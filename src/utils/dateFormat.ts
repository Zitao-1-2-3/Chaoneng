/**
 * Unix 时间戳格式化工具
 */

/**
 * 格式化 Unix 时间戳（秒级）为可读的日期时间字符串
 * @param timestamp Unix 时间戳（秒）
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期时间字符串
 */
export function formatUnixTime(
  timestamp: number | string | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!timestamp || timestamp === 0) {
    return '-'
  }

  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const date = new Date(time * 1000)

  if (isNaN(date.getTime())) {
    return '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化 Unix 时间戳为本地化字符串
 * @param timestamp Unix 时间戳（秒）
 * @param locale 语言环境，默认 'zh-CN'
 * @returns 本地化的日期时间字符串
 */
export function formatUnixTimeLocale(
  timestamp: number | string | null | undefined,
  locale: string = 'zh-CN'
): string {
  if (!timestamp || timestamp === 0) {
    return '-'
  }

  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const date = new Date(time * 1000)

  if (isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * 格式化 Unix 时间戳为日期（不含时间）
 * @param timestamp Unix 时间戳（秒）
 * @returns 格式化后的日期字符串，如 '2026-03-31'
 */
export function formatUnixDate(timestamp: number | string | null | undefined): string {
  return formatUnixTime(timestamp, 'YYYY-MM-DD')
}

/**
 * 格式化 Unix 时间戳为时间（不含日期）
 * @param timestamp Unix 时间戳（秒）
 * @returns 格式化后的时间字符串，如 '14:30:45'
 */
export function formatUnixTimeOnly(timestamp: number | string | null | undefined): string {
  return formatUnixTime(timestamp, 'HH:mm:ss')
}
