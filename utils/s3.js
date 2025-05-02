const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.NCP_REGION_NAME,
  endpoint: process.env.NCP_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NCP_ACCESS_KEY_ID,
    secretAccessKey: process.env.NCP_SECRET_KEY,
  },
});

const uploadToNcpS3 = async (file) => {
  const filename = `${uuidv4()}-${file.originalname}`;
  const command = new PutObjectCommand({
    Bucket: process.env.NCP_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read", // ← 이 라인 필수!
  });

  await s3.send(command);

  return `${process.env.NCP_STORAGE_ENDPOINT}/${process.env.NCP_BUCKET_NAME}/${filename}`;
};

module.exports = { uploadToNcpS3 };
