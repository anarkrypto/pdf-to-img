import { createReadStream } from 'fs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PageResult, TaskPayload } from '../types'

const BUCKET_DIR = 'pdfs'

const accessKeyId = process.env.S3_ACCESS_KEY_ID!
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!
const bucketName = process.env.S3_BUCKET_NAME!
const region = process.env.S3_REGION!

const client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
})

export async function uploadFile(
  path: string,
  key: string,
  mimetype?: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const fileStream = createReadStream(path)
    fileStream.on('error', reject)

    try {
      const Key = key.replace(/^\//, '')
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key,
        ACL: 'public-read',
        Body: fileStream,
        ContentType: mimetype,
      })

      await client.send(command)

      resolve(
        `https://${bucketName}.s3.${
          region ? `${region}.` : ''
        }amazonaws.com/${Key}`,
      )
    } catch (error) {
      reject(error)
    }
  })
}

export async function uploadImages({
  convertionId,
  pages,
  format,
}: TaskPayload) {
  const promises: Promise<PageResult>[] = []

  for (const { page, url, width, height } of pages) {
    const key = `${BUCKET_DIR}/${convertionId}/${page}.${format}`
    const promise = uploadFile(url, key, `image/${format}`).then((url) => ({
      url,
      page: page,
      width,
      height,
    }))
    promises.push(promise)
  }

  const result = await Promise.all(promises)

  const pagesSorted = result.sort((a, b) => a.page - b.page)

  return pagesSorted
}
