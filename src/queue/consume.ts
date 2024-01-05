import { Connection, connect } from 'amqplib'
import { TaskPayload } from '../types'

const AMQP_URL = 'amqp://localhost'

let connection: Connection

export type Worker = (payload: TaskPayload) => Promise<void>

export async function consumeQueue(queue: string, worker: Worker) {
    if (!connection) {
      connection = await connect(AMQP_URL, 'heartbeat=60')
    }
  
    const channel = await connection.createChannel()
  
    try {
      channel.assertQueue(queue, { durable: true })
      channel.prefetch(1)
      channel.consume(queue, async (message) => {
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
    } catch {
      await channel.close()
    }
  }