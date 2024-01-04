import { S3 } from 'aws-sdk'
import { createReadStream } from 'fs'
import { PageResult, TaskPayload } from '../types'
import { promisify } from 'util'
import { exec } from 'child_process'

const BUCKET_DIR = 'pdfs'

const accessKeyId = process.env.S3_ACCESS_KEY_ID!
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!
const bucketName = process.env.S3_BUCKET_NAME!

const execAsync = promisify(exec)

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
  try {
    const promises: Promise<PageResult>[] = []

    for (const { page, url } of pages) {
      const key = `${BUCKET_DIR}/${convertionId}/${page}.${format}`
      const promise = uploadFile(
        url,
        key,
        `image/${format}`,
      ).then((url) => ({ url, page: page }))
      promises.push(promise)
    }

    const result = await Promise.all(promises)

    const pagesSorted = result.sort((a, b) => a.page - b.page)

    return pagesSorted
  } finally {
    await execAsync(`rm -rf /tmp/${convertionId}`)
  }
}
