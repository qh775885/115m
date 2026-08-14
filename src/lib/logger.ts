export class Logger {
  name: string
  private silent = false
  constructor(name: string, silent = false) {
    this.name = name
    this.silent = silent
  }
  sub(name: string) {
    return new Logger(`${this.name}:${name}`, this.silent)
  }
  enableSilentMode() {
    this.silent = true
  }
  debug(...args: any[]) {
    if (this.silent) return
    console.debug(`[${this.name}]`, ...args)
  }
  info(...args: any[]) {
    if (this.silent) return
    console.info(`[${this.name}]`, ...args)
  }
  warn(...args: any[]) {
    console.warn(`[${this.name}]`, ...args)
  }
  error(...args: any[]) {
    console.error(`[${this.name}]`, ...args)
  }
}
export const appLogger = new Logger('115m')
