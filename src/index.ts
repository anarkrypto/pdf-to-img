import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir } from 'fs'
import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { uploadFile } from './utils/upload'
import { getMD5 } from './utils/checksum'
import { cors } from 'hono/cors'

const execAsync = promisify(exec)
const readdirAsync = promisify(readdir)
const TMP_DIR = '/tmp'
const BUCKET_DIR = 'pdfs/'

type ImageFormats = 'png' | 'jpg' | 'jpeg' | 'webp'

interface ConvertData {
  url: string
  quality: number
  format: ImageFormats
}

interface PageResult {
  page: number
  url: string
}

const ajv = new Ajv()
addFormats(ajv)

const schema: JSONSchemaType<ConvertData> = {
  type: 'object',
  properties: {
    url: { type: 'string', format: 'uri', maxLength: 1024 },
    quality: { type: 'integer', minimum: 1, maximum: 100 },
    format: { type: 'string', enum: ['png', 'jpg', 'jpeg', 'webp'] },
  },
  required: ['url'],
  additionalProperties: false,
}

const defaultConfig: Partial<ConvertData> = {
  quality: 80,
  format: 'webp',
}

const app = new Hono()

app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    allowMethods: ['POST', 'OPTIONS'],
  })
)

app.post('/', async (c) => {
  const data = await c.req.json()
  if (!ajv.validate(schema, data)) {
    return c.json({ message: ajv.errorsText() }, { status: 400 })
  }

  const convertionId = 
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const outputDir = `${TMP_DIR}/${convertionId}`

  const config = { ...defaultConfig, ...data }

  const uploadWithChecksum = async (file: string) => {
    const path = `${outputDir}/${file}`
    const md5 = await getMD5(path)
    const key = `${BUCKET_DIR}/${md5}/${file}`
    const result = await uploadFile(path, key, config.format)
    const page = parseInt(file.split('.')[0], 10)
    return {
      page,
      url: result.Location
    }
  }

  try {

    await execAsync(`mkdir ${outputDir}`)

    await execAsync(`magick -quality ${config.quality} -define webp:lossless=true ${config.url} ${outputDir}/%d.webp`)

    const imageFiles = await readdirAsync(outputDir)

    const promises: Promise<PageResult>[] = []

    imageFiles.forEach((file) => promises.push(uploadWithChecksum(file)))

    const result = await Promise.all(promises)

    const resultSorted = result.sort((a, b) => a.page - b.page)

    return c.json(resultSorted)
  } catch (error) {
    console.error(`Error processing ${data.url}`, error)
    return c.json({message: error instanceof Error ? error.message : 'unknown error'})
  } finally {
    await execAsync(`rm -rf ${outputDir}`)
  }
})

serve(app)
