// const AWS = require("aws-sdk");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// https://zalandino-images.s3.eu-north-1.amazonaws.com/2025-06-16T10:13:25.044Z-07.png
const extractKeyFromUrl = (url) => {
  return url.split("/").pop(); // returns the last element aka filename
};

// delete file from S3
const deleteFile = async (fileUrl) => {
  const key = extractKeyFromUrl(fileUrl);
  const params = {
    Bucket: "zalandino-images",
    Key: key
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
  } catch (err) {
    console.log("Error deleting S3 Object:", err);
    throw err;
  }
};

exports.deleteFile = deleteFile;
