import { Connection, connect } from './connect'
import { TaskPayload } from '../types'

let connection: Connection

export async function sendToQueue(queue: string, task: TaskPayload) {
  if (!connection) {
    connection = await connect()
  }

  const channel = await connection.createChannel()
  
  try {
    channel.assertQueue(queue, { durable: true })
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)))
  } finally {
    await channel.close()
  }
}
