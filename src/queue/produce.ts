import { Connection, connect } from 'amqplib'
import { TaskPayload } from '../types'

const AMQP_URL = 'amqp://localhost'

let connection: Connection

export async function sendToQueue(queue: string, task: TaskPayload) {
  if (!connection) {
    connection = await connect(AMQP_URL, 'heartbeat=60')
  }

  const channel = await connection.createChannel()
  
  try {
    channel.assertQueue(queue, { durable: true })
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)))
  } finally {
    await channel.close()
  }
}
