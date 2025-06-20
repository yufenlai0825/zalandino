const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// https://zalandino-images.s3.eu-north-1.amazonaws.com/2025-06-16T10:13:25.044Z-07.png
const extractKeyFromUrl = (url) => {
  return url.split("/").pop(); // returns the last element aka filename
};

// delete file from S3
const deleteFile = (fileUrl) => {
  const key = extractKeyFromUrl(fileUrl);
  const params = {
    Bucket: "zalandino-images",
    Key: key
  };

  return s3.deleteObject(params).promise();
};

exports.deleteFile = deleteFile;
