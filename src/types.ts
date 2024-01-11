export type ImageFormats = 'png' | 'jpg' | 'jpeg' | 'webp'

export interface PageResult {
    page: number
    url: string
    width: number
    height: number
}

export interface ConversionOptions {
    quality: number
    format: ImageFormats
    dpi: number
}

export interface TaskPayload extends ConversionOptions {
    convertionId: string
    url: string
    pages: PageResult[]
    webhook?: string
    error?: string
}