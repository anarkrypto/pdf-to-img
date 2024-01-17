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

  const results: PageResult[] = []
  let currentIndex = 0

  async function processNextPage(): Promise<void> {
    if (currentIndex >= numberOfPages) return

    const currentPageIndex = currentIndex
    currentIndex++

    const page = pages[currentPageIndex]

    await execAsync(
      `magick -quality ${quality} -density ${dpi} -define webp:lossless=true ${pdf}[${page.page}] ${outputDir}/${page.page}.${format}`,
    )

    results.push({ ...page, url: `${outputDir}/${page.page}.${format}` })

    await processNextPage()
  }

  const processingPromises: Promise<void>[] = []
  for (let i = 0; i < numberOfThreadsRequired; i++) {
    processingPromises.push(processNextPage())
  }

  await Promise.all(processingPromises)

  return results
}
