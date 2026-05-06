/**
 * 数字格式化工具函数
 */

/**
 * 解析数字（支持字符串和数字类型）
 * @param val 输入值
 * @returns 解析后的数字，如果解析失败返回 0
 */
export function parseNum(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * 格式化数字为万单位
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatToWan(num: number | string | undefined): string {
  const value = parseNum(num)
  if (value === 0) return '0'

  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }

  return value.toLocaleString('en-US')
}

/**
 * 格式化金额（保留2位小数）
 * @param amount 金额
 * @returns 格式化后的字符串
 */
export function formatAmount(amount: string | number | undefined): string {
  const num = parseNum(amount)
  if (num === 0) return '0.00'
  return num.toFixed(2)
}

/**
 * 格式化百分比
 * @param value 数值（0-1 或 0-100）
 * @param isDecimal 是否为小数形式（0-1），默认 true
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(
  value: string | number | undefined,
  isDecimal: boolean = true
): string {
  const num = parseNum(value)
  if (num === 0) return '0%'

  const percent = isDecimal ? num * 100 : num
  return `${percent.toFixed(2)}%`
}

/**
 * 格式化数字（千分位分隔）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: string | number | undefined): string {
  const value = parseNum(num)
  if (value === 0) return '0'
  return value.toLocaleString('en-US')
}
