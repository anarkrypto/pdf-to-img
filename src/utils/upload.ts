import { S3 } from 'aws-sdk'
import { createReadStream } from 'fs'

const accessKeyId = process.env.S3_ACCESS_KEY_ID!
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!
const bucketName = process.env.S3_BUCKET_NAME!

const s3 = new S3({
  accessKeyId,
  secretAccessKey,
})

export async function uploadFile(
  path: string,
  key: string,
  mimetype?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(path)

    fileStream.on('error', reject)

    s3.upload(
      {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: mimetype,
      },
      undefined,
      (error, data) => {
        if (error) {
          return reject(error.message)
        }
        resolve(data.Location)
      },
    )
  })
}