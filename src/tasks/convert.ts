import { exec } from 'child_process'
import { promisify } from 'util'
import { PageResult, TaskPayload } from '../types'
import { cpus } from 'os'

const execAsync = promisify(exec)

export async function convert({
  convertionId,
  pages,
  format,
  quality,
  dpi,
}: TaskPayload): Promise<PageResult[]> {
  const pdf = `/tmp/${convertionId}/file.pdf`
  const outputDir = `/tmp/${convertionId}/pages`

  const numberOfPages = pages.length
  const numberOfThreadsAvailable = cpus().length
  const numberOfThreadsRequired =
    numberOfThreadsAvailable > numberOfPages
      ? numberOfPages
      : numberOfThreadsAvailable
  const pagesPerThread = Math.ceil(numberOfPages / numberOfThreadsRequired)

  const threads = Array.from(
    { length: numberOfThreadsRequired },
    (_, index) => {
      const start = index * pagesPerThread
      const end = start + pagesPerThread
      return pages.slice(start, end)
    },
  )

  const threadsPromises = threads.map((pages) => {
    const pagesList = pages.map(({ page }) => page).join(',')
    return execAsync(
      `magick -quality ${quality} -density ${dpi} -define webp:lossless=true ${pdf}[${pagesList}] ${outputDir}/%d.${format}`,
    )
  })

  await Promise.all(threadsPromises)

  return pages.map((page) => {
    return {
      ...page,
      url: `${outputDir}/${page.page}.${format}`,
    }
  })
}
