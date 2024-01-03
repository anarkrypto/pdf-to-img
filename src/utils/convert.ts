import { exec } from "child_process"
import { readdir } from 'fs'
import { promisify } from "util"

export type ImageFormats = 'png' | 'jpg' | 'jpeg' | 'webp'

export interface ConvertOptions {
    url: string
    quality: number
    format: ImageFormats
    dpi: number
    outputDir: string
}

const execAsync = promisify(exec)
const readdirAsync = promisify(readdir)

export async function convert (options: ConvertOptions): Promise<string[]> {
    await execAsync(`mkdir ${options.outputDir}`)

    await execAsync(`magick -quality ${options.quality} -density ${options.dpi} -define webp:lossless=true ${options.url} ${options.outputDir}/%d.${options.format}`)

    const imageFiles = await readdirAsync(options.outputDir)

    return imageFiles
}