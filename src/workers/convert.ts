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
  const pdf = `/tmp/${convertionId}/file.pdf`
  const outputDir = `/tmp/${convertionId}/pages`
  await execAsync(
    `magick -quality ${options.quality} -density ${options.dpi} -define webp:lossless=true "${pdf}" "${outputDir}/%d.${options.format}"`,
  )

  const imageFiles = await readdirAsync(outputDir)

  const pages = imageFiles.map((file) => ({
    page: Number(file.split('.')[0]),
    url: `${outputDir}/${file}`,
  }))

  return pages
}
