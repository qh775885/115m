export interface Rational {
  /** 分子 */
  num: number
  /** 分母 */
  den: number
}

/**
 * 微秒时间基
 */
export const microsecTimebase: Rational = {
  num: 1,
  den: 1_000_000,
}

/**
 * 秒时间基
 */
export const secTimebase: Rational = {
  num: 1,
  den: 1,
}

/**
 * 时间基转换
 * @param value {number} 时间值
 * @param fromTimebase {Rational} 源时间基
 * @param toTimebase {Rational} 目标时间基
 */
export function timebaseConvert(
  value: number,
  fromTimebase: Rational,
  toTimebase: Rational,
): number {
  return (
    (((value * fromTimebase.num) / fromTimebase.den) * toTimebase.den)
    / toTimebase.num
  )
}
