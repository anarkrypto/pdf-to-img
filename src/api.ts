import { Hono } from 'hono'
import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { cors } from 'hono/cors'
import { v4 as uuid } from 'uuid'
import { ConversionOptions } from './types'
import { sendToQueue } from './queue/produce'
import { serve } from '@hono/node-server'

const ajv = new Ajv()
addFormats(ajv)

interface RequestBody extends ConversionOptions {
  url: string
}

const schema: JSONSchemaType<RequestBody> = {
  type: 'object',
  properties: {
    url: { type: 'string', format: 'uri', maxLength: 1024 },
    quality: { type: 'integer', minimum: 1, maximum: 100 },
    format: { type: 'string', enum: ['png', 'jpg', 'jpeg', 'webp'] },
    dpi: { type: 'integer', minimum: 1, maximum: 600 },
    webhook: { type: 'string', format: 'uri', maxLength: 1024 },
  },
  required: ['url'],
  additionalProperties: false,
}

const defaultOptions: ConversionOptions = {
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

app.post('/convert', async (c) => {
  const data = await c.req.json()
  if (!ajv.validate(schema, data)) {
    return c.json({ message: ajv.errorsText() }, { status: 400 })
  }

  const convertionId = uuid()

  const payload = {
    convertionId,
    ...defaultOptions,
    ...data,
    pages: [],
  }

  try {
    await sendToQueue('download', payload)
    return c.json({ success: true, convertionId })
  } catch (error) {
    console.error(`Error processing ${data.url}`, error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'unknown error',
      },
      500,
    )
  }
})

serve(app)
