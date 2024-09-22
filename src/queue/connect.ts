import { Connection, connect as connectAmqp } from 'amqplib'

export type { Connection } from 'amqplib'

const AMQP_URL = process.env.RABBITMQ_URL!

export async function connect(): Promise<Connection> {
  const connection = await connectAmqp(AMQP_URL, {
    heartbeat: 60,
  })
  return connection
}
