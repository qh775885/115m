/**
 * 115 RSA 加密 - 纯 JS 实现，无外部依赖
 */

export class Rsa115 {
  private n = '8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683'
  private e = '10001'

  private a2hex(byteArray: number[]): string {
    let hexString = ''
    for (let i = 0; i < byteArray.length; i++) {
      const nextHexByte = byteArray[i].toString(16)
      hexString += nextHexByte.length < 2 ? `0${nextHexByte}` : nextHexByte
    }
    return hexString
  }

  public hex2a(hex: string): string {
    let str = ''
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return str
  }

  private pkcs1pad2(s: string, n: number): string | null {
    if (n < s.length + 11) return null
    const ba: number[] = []
    let pos = n
    let i = s.length - 1

    while (i >= 0 && pos > 0) {
      ba[--pos] = s.charCodeAt(i--)
    }
    ba[--pos] = 0
    while (pos > 2) {
      ba[--pos] = 0xFF
    }
    ba[pos - 1] = 2
    ba[0] = 0

    return this.a2hex(ba)
  }

  private pkcs1unpad2(a: string): string {
    const c = this.hex2a(a)
    let i = 1
    while (c.charCodeAt(i) !== 0) {
      i++
    }
    return c.slice(i + 1)
  }

  /**
   * 模幂运算（square-and-multiply）
   * 避免 mBI ** eBI 暴力指数运算导致的性能灾难
   */
  private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n
    let b = base % mod
    let e = exp
    while (e > 0n) {
      if (e & 1n) result = (result * b) % mod
      e >>= 1n
      b = (b * b) % mod
    }
    return result
  }

  encrypt(text: string): string {
    const m = this.pkcs1pad2(text, 0x80)
    if (!m) throw new Error('pkcs1pad2 failed')

    const mBI = BigInt('0x' + m)
    const eBI = BigInt('0x' + this.e)
    const nBI = BigInt('0x' + this.n)
    const c = this.modPow(mBI, eBI, nBI)

    let h = c.toString(16)
    while (h.length < 0x80 * 2) {
      h = `0${h}`
    }
    return h
  }

  decrypt(text: string): string {
    const ba: number[] = []
    for (let i = 0; i < text.length; i++) {
      ba[i] = text.charCodeAt(i)
    }
    const a = BigInt('0x' + this.a2hex(ba))
    const eBI = BigInt('0x' + this.e)
    const nBI = BigInt('0x' + this.n)
    const c = this.modPow(a, eBI, nBI)
    const d = this.pkcs1unpad2(c.toString(16).padStart(0x80 * 2, '0'))
    return d
  }
}
