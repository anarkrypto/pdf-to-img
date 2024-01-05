import { Connection, connect as connectAmqp } from 'amqplib'

export { Connection } from 'amqplib'

const AMQP_URL = process.env.RABBITMQ_URL!
const AMQP_USER = process.env.RABBITMQ_USER!
const AMQP_PASS = process.env.RABBITMQ_PASS!

export async function connect(): Promise<Connection> {
  const url = new URL(AMQP_URL)

  const connection = await connectAmqp({
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    username: AMQP_USER,
    password: AMQP_PASS,
    heartbeat: 60,
  })
  return connection
}
