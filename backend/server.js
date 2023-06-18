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

  // Create a new BlobServiceClient
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  // Get a reference to a container
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

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
// Route for streaming the uploaded video
app.get('/api/stream/:filename', async (req, res) => {
  const filename = req.params.filename;

  try {
    const blobClient = containerClient.getBlobClient(filename);

    // Get the video properties to set the content type
    const properties = await blobClient.getProperties();
    const contentType = properties.contentType;

    // Set the response headers for streaming the video
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    // Check if the client sent a range header
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : properties.contentLength - 1;
      const chunkSize = end - start + 1;

      // Set the response headers for partial content request
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${properties.contentLength}`);
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the video in chunks
      const downloadResponse = await blobClient.download(0, properties.contentLength);
      const responseStream = downloadResponse.readableStreamBody;
      responseStream.on('data', (chunk) => {
        res.write(chunk);
      });
      responseStream.on('end', () => {
        res.end();
      });
      responseStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).send('Error streaming file');
      });
    } else {
      // Stream the full video
      const responseStream = await blobClient.download();
      responseStream.readableStreamBody.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).send('Error streaming file');
  }
});


// Start the server
app.listen(3001, () => {
console.log('Server listening on port 3001');
});