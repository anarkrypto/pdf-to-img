import { consumer } from './queue/consumer'
import { sendToQueue } from './queue/produce'
import { TaskPayload } from './types'
import { convert } from './tasks/convert'
import { uploadImages } from './tasks/upload'
import { promisify } from 'util'
import { exec } from 'child_process'
import { callWebhook } from './tasks/webhook'
import { download } from './tasks/download'
import { info } from './tasks/info'

const execAsync = promisify(exec)

async function downloadTask(payload: TaskPayload) {
  await download(payload)
  console.log(`[INFO] Download task ${payload.convertionId} finished`)
  await sendToQueue('info', payload)
}

async function infoTask(payload: TaskPayload) {
  const pages = await info(payload)
  console.log(`[INFO] Info task ${payload.convertionId} finished`)
  await sendToQueue('convert', {
    ...payload,
    pages,
  })
}

async function convertTask(payload: TaskPayload) {
  const pages = await convert(payload)
  console.log(`[INFO] Conversion task ${payload.convertionId} finished`)
  await sendToQueue('upload', {
    ...payload,
    pages,
  })
}

async function uploadTask(payload: TaskPayload) {
  const pages = await uploadImages(payload)
  console.log(`[INFO] Upload task ${payload.convertionId} finished`)
  execAsync(`rm -rf /tmp/${payload.convertionId}`)
  await sendToQueue('webhook', {
    ...payload,
    pages,
  })
}

async function webhookTask(payload: TaskPayload) {
  await callWebhook(payload)
  console.log(`[INFO] Webhook task ${payload.convertionId} finished`)
}

export async function startWorkers() {
  console.log(`[INFO] Starting Workers`)

  const consumeQueue = await consumer()

  consumeQueue('download', downloadTask)
  consumeQueue('info', infoTask)
  consumeQueue('convert', convertTask)
  consumeQueue('upload', uploadTask)
  consumeQueue('webhook', webhookTask)
}
