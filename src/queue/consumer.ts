import { Connection, connect } from './connect'
import { TaskPayload } from '../types'

export type Worker = (payload: TaskPayload) => Promise<void>

const MAX_REQUEUES = 5

export async function consumer() {
  const connection: Connection = await connect()

  const channel = await connection.createChannel()

  try {
    await Promise.all([
      channel.assertExchange('main-exchange', 'fanout'),
      channel.assertExchange('error-exchange', 'fanout'),
    ])

    await channel.assertQueue('requeue')

    await channel.bindQueue('requeue', 'error-exchange', '')

    await channel.consume('requeue', async (msg) => {
      if (!msg) return

      const {
        'x-first-death-reason': reason,
        'x-first-death-queue': originalQueue,
      } = msg.properties.headers

      if (originalQueue == null || reason !== 'rejected') {
        channel.ack(msg)
        return
      }

      const xDeaths = msg.properties.headers['x-death'] || []
      const rejectsCount =
        xDeaths.find((d) => d.reason === 'rejected')?.count ?? -1

      if (rejectsCount === -1 || rejectsCount >= MAX_REQUEUES) {
        channel.ack(msg)
        return
      }

      await channel.sendToQueue(originalQueue, msg.content, msg.properties)

      channel.ack(msg)
    })

    return async (queue: string, worker: Worker) => {
      await channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: 'error-exchange',
      })

      await channel.bindQueue(queue, 'main-exchange', '')
      await channel.prefetch(1)

      await channel.consume(queue, async (msg) => {
        if (!msg) {
          return
        }

        const payload = JSON.parse(msg.content.toString())

        try {
          await worker(payload)
          channel.ack(msg)
        } catch (error) {
          console.error(`Error processing ${payload.convertionId}`, error)
          channel.nack(msg, false, false)
        }
      })
    }
  } catch (error) {
    await channel.close()
    throw error
  }
}
