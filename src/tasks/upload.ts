import { S3 } from 'aws-sdk'
import { createReadStream } from 'fs'
import { PageResult, TaskPayload } from '../types'

const BUCKET_DIR = 'pdfs'

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
