import { exec } from 'child_process'
import { promisify } from 'util'
import { PageResult, TaskPayload } from '../types'

const execAsync = promisify(exec)

export async function info({
  convertionId,
}: TaskPayload): Promise<PageResult[]> {
  const pdf = `/tmp/${convertionId}/file.pdf`
  const { stdout } = await execAsync(`magick identify "${pdf}"`)
  const pages = await stdout.split('\n')
  return pages
    .filter((page) => page)
    .map((page, index) => {
      console.log('page', page)
      const dimensions = page.split(' ')[2]
      console.log('dimensions', dimensions)
      const width = Number(dimensions.split('x')[0])
      const height = Number(dimensions.split('x')[1])
      return {
        page: index,
        url: `${pdf}[${index}]`,
        width,
        height,
      }
    })
}
