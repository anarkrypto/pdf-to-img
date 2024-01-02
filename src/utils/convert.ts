import { exec } from "child_process"
import { readdir } from 'fs'
import { promisify } from "util"

export type ImageFormats = 'png' | 'jpg' | 'jpeg' | 'webp'

export interface ConvertData {
    url: string
    quality: number
    format: ImageFormats
    density: number
    outputDir: string
}

const execAsync = promisify(exec)
const readdirAsync = promisify(readdir)

export async function convert (config: ConvertData): Promise<string[]> {
    await execAsync(`mkdir ${config.outputDir}`)

    await execAsync(`magick -quality ${config.quality} -density ${config.density} -define webp:lossless=true ${config.url} ${config.outputDir}/%d.${config.format}`)

    const imageFiles = await readdirAsync(config.outputDir)

    return imageFiles
}