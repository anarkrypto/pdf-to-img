import { exec } from 'child_process'
import { readdir } from 'fs'
import { promisify } from 'util'
import { PageResult, TaskPayload } from '../types'

const execAsync = promisify(exec)
const readdirAsync = promisify(readdir)

export async function convert({
  convertionId,
  url,
  ...options
}: TaskPayload): Promise<PageResult[]> {
  const outputDir = `/tmp/${convertionId}`

  try {
    await execAsync(`mkdir ${outputDir}`)

    await execAsync(
      `magick -quality ${options.quality} -density ${options.dpi} -define webp:lossless=true ${url} ${outputDir}/%d.${options.format}`,
    )

    const imageFiles = await readdirAsync(outputDir)

    const pages = imageFiles.map((file) => ({
      page: Number(file.split('.')[0]),
      url: `${outputDir}/${file}`,
    }))

    return pages
  } catch (error) {
    await execAsync(`rm -rf ${outputDir}`)
    throw error
  }
}
