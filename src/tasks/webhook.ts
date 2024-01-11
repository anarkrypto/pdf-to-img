import { TaskPayload } from '../types'

export async function callWebhook(payload: TaskPayload) {
  const url = payload.webhook as string
  const isSuccess = !payload.error

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(
      isSuccess
        ? { success: true, ...payload }
        : { success: false, ...payload },
    ),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status code ${response.status}`)
  }

  return response
}
