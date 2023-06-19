require('dotenv').config(); // Load environment variables from .env file

const { BlobServiceClient, generateBlobSASQueryParameters,BlobSASPermissions, StorageSharedKeyCredential } = require("@azure/storage-blob");

const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.CONTAINER_NAME;
const blobName = "test2.mp4";
const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
const blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, sharedKeyCredential)


async function generateSasToken() {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

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

// Usage example:
generateSasToken()
  .then(sasUrl => console.log("SAS URL:", sasUrl))
  .catch(error => console.error("Error generating SAS URL:", error));
