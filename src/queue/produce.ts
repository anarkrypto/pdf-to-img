import { Connection, connect } from './connect'
import { TaskPayload } from '../types'

export async function sendToQueue(queue: string, task: TaskPayload) {
  const connection: Connection = await connect()

  const channel = await connection.createChannel()

  try {
    await Promise.all([
      channel.assertExchange('notification-exchange', 'fanout'),
      channel.assertExchange('error-exchange', 'fanout'),
    ])

    await channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: 'error-exchange',
    })
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(task)))
  } finally {
    await channel.close()
    await connection.close()
  }
}
