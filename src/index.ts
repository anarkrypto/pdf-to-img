import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { cors } from 'hono/cors'
import { v4 as uuid } from 'uuid'
import { uploadFile } from './utils/upload'
import { ConvertOptions, convert } from './utils/convert'

const execAsync = promisify(exec)

const TMP_DIR = '/tmp'
const BUCKET_DIR = 'pdfs'

const ajv = new Ajv()
addFormats(ajv)

interface RequestBody extends Omit<ConvertOptions, 'outputDir'> {}

interface PageResult {
  page: number
  url: string
}

const schema: JSONSchemaType<RequestBody> = {
  type: 'object',
  properties: {
    url: { type: 'string', format: 'uri', maxLength: 1024 },
    quality: { type: 'integer', minimum: 1, maximum: 100 },
    format: { type: 'string', enum: ['png', 'jpg', 'jpeg', 'webp'] },
    dpi: { type: 'integer', minimum: 1, maximum: 600 },
  },
  required: ['url'],
  additionalProperties: false,
}

const defaultOptions: Partial<ConvertOptions> = {
  quality: 80,
  format: 'webp',
  dpi: 300,
}

const app = new Hono()

app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    allowMethods: ['POST', 'OPTIONS'],
  }),
)

app.post('/', async (c) => {
  const data = await c.req.json()
  if (!ajv.validate(schema, data)) {
    return c.json({ message: ajv.errorsText() }, { status: 400 })
  }

  const convertionId = uuid()

  const outputDir = `${TMP_DIR}/${convertionId}`

  const options = { ...defaultOptions, ...data }

  try {
    const imageFiles = await convert({ ...options, outputDir })

    const promises: Promise<PageResult>[] = []

    for (const file of imageFiles) {
      const page = Number(file.split('.')[0])
      const key = `${BUCKET_DIR}/${convertionId}/${file}`
      const promise = uploadFile(
        `${outputDir}/${file}`,
        key,
        `image/${options.format}`,
      ).then((url) => ({ url, page }))
      promises.push(promise)
    }

    const result = await Promise.all(promises)

    const resultSorted = result.sort((a, b) => a.page - b.page)

    return c.json(resultSorted)
  } catch (error) {
    console.error(`Error processing ${data.url}`, error)
    return c.json(
      {
        message: error instanceof Error ? error.message : 'unknown error',
      },
      500,
    )
  } finally {
    await execAsync(`rm -rf ${outputDir}`)
  }
})

serve(app)
