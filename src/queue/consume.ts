import { Connection, connect } from './connect'
import { TaskPayload } from '../types'


export type Worker = (payload: TaskPayload) => Promise<void>

export async function consumeQueue(queue: string, worker: Worker) {

  const connection: Connection = await connect()

  const channel = await connection.createChannel()

  try {
    await channel.assertQueue(queue, { durable: true })
    channel.prefetch(1)
    await channel.consume(queue, async (message) => {
      if (!message) {
        return
      }

      const payload = JSON.parse(message.content.toString())

      try {
        await worker(payload)
        channel.ack(message)
      } catch (error) {
        console.error(`Error processing ${payload.convertionId}`, error)
        channel.nack(message)
      }
    })
  } catch (error) {
    await channel.close()
    throw error
  }
}
