import { exec } from 'child_process'
import { promisify } from 'util'
import { TaskPayload } from '../types'

const execAsync = promisify(exec)

export async function download({ convertionId, url }: TaskPayload) {
  const outputDir = `/tmp/${convertionId}`
  await execAsync(`mkdir "${outputDir}" && mkdir "${outputDir}/pages"`)

  try {
    await execAsync(`wget ${url} -qO ${outputDir}/file.pdf`)
  } catch (error) {
    await execAsync(`rm -r ${outputDir}`)
    throw error
  }
}
