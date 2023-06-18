const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer();

// Azure Storage credentials
const AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=hackathonvideogg;AccountKey=0qGWSt4F4oCAB16ZP67GmGbl8YyubH/SVWAb/l4gH7URt+VXFughEuhk+qs0DKqDw/XFxkmzYSba+ASt+hZE4g==;EndpointSuffix=core.windows.net';
const CONTAINER_NAME = 'videos';

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

// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
