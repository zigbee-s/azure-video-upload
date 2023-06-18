const { BlobServiceClient } = require("@azure/storage-blob");

// Replace "<connection-string>" with your Azure Storage connection string
const connectionString = "DefaultEndpointsProtocol=https;AccountName=hackathonvideogg;AccountKey=0qGWSt4F4oCAB16ZP67GmGbl8YyubH/SVWAb/l4gH7URt+VXFughEuhk+qs0DKqDw/XFxkmzYSba+ASt+hZE4g==;EndpointSuffix=core.windows.net";
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Replace "<container-name>" with the name of your container where videos will be stored
const containerName = "videos";
const containerClient = blobServiceClient.getContainerClient(containerName);


// Replace "<video-path>" with the local path of the video file you want to upload
const videoPath = "./test.mp4";
const videoName = "first"; // Provide a name for the video file in the storage

async function uploadVideo() {
  const blockBlobClient = containerClient.getBlockBlobClient(videoName);
  await blockBlobClient.uploadFile(videoPath);
  console.log("Video uploaded successfully.");
}

uploadVideo().catch((error) => {
  console.error("Error uploading video:", error);
});


