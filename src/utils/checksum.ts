import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function getMD5(path: string): Promise<string> {
    const command = `md5sum ${path}`
    const { stdout } = await execAsync(command)
    const md5 = stdout.split(' ')[0]
    return md5
  }
  