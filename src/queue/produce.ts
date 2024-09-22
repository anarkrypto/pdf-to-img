import { Connection, connect } from './connect'
import { TaskPayload } from '../types'

export type QueueName = 'download' | 'convert' | 'upload' | 'webhook'

export async function sendToQueue(queueName: QueueName, task: TaskPayload) {
  const connection: Connection = await connect()

  const channel = await connection.createChannel()

  try {
    await Promise.all([
      channel.assertExchange('notification-exchange', 'fanout'),
      channel.assertExchange('error-exchange', 'fanout'),
    ])

    await channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: 'error-exchange',
    })
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(task)))
  } finally {
    await channel.close()
    await connection.close()
  }
}
