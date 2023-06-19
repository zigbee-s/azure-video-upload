const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(cors());

// Create a temporary storage location for storing the file chunks
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Azure Storage configuration


const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.CONTAINER_NAME;


// Create an Azure Blob Service client
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Route for handling file chunk uploads
// Upload route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('Uploading file:', req.file.originalname);
try {
  const file = req.file;

  // Upload the file to Azure Blob Storage
  const blockBlobClient = containerClient.getBlockBlobClient(file.originalname);
  const uploadBlobResponse = await blockBlobClient.upload(file.buffer, file.buffer.length);

  console.log('File uploaded:', uploadBlobResponse);
  res.sendStatus(200);
} catch (error) {
  console.error('Error uploading file:', error);
  res.status(500).send('Error uploading file');
}
});


// Route for streaming the uploaded video
const {generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = require("@azure/storage-blob");


async function generateSasToken(filename) {
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.CONTAINER_NAME;

  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
  const blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, sharedKeyCredential);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(filename);

  const sasOptions = {
    containerName: containerClient.containerName,
    blobName: blobClient.name,
    permissions: BlobSASPermissions.parse("r"),
    protocol: "https",
    startsOn: new Date(),
    expiresOn: new Date(new Date().getTime() + 3600 * 1000), // Set the expiration time (e.g., 1 hour from now)
  };

  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  return blobClient.url + "?" + sasToken;
}

// Route for streaming the uploaded video
app.get('/api/stream/:filename', async (req, res) => {
  const filename = req.params.filename;
  console.log('Streaming file:', filename);
  try {
    const sasUrl = await generateSasToken(filename);
    res.send(sasUrl);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).send('Error streaming file');
  }
});

// Start the server
app.listen(3001, () => {
console.log('Server listening on port 3001');
});