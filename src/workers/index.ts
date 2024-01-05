import { consumeQueue } from '../queue/consume'
import { sendToQueue } from '../queue/produce'
import { TaskPayload } from '../types'
import { convert } from './convert'
import { uploadImages } from './upload'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

async function convertTask(payload: TaskPayload) {
  const pages = await convert(payload)
  console.log(`[INFO] Conversion task ${payload.convertionId} finished`)
  await sendToQueue('upload', {
    ...payload,
    pages,
  })
}

async function uploadTask(payload: TaskPayload) {
  await uploadImages(payload)
  console.log(`[INFO] Upload task ${payload.convertionId} finished`)
  await execAsync(`rm -rf /tmp/${payload.convertionId}`)
}

export async function startWorkers() {
  console.log(`[INFO] Starting Workers`)
  consumeQueue('convert', convertTask)
  consumeQueue('upload', uploadTask)
}
