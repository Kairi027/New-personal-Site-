/**
 * 时间格式化工具 - UTC 转北京时间（UTC+8）展示。
 * 统一解析逻辑，不依赖浏览器本地时区。
 */

const BEIJING_OFFSET = 8 * 60 * 60 * 1000

/**
 * 统一解析时间字符串为 Date 对象（UTC 时间戳）。
 * - 带时区标识（如 +08:00 或 Z）按 ISO8601 标准解析
 * - 无时区标识的裸字符串视为 UTC（兼容旧接口）
 * 不依赖浏览器本地时区。
 */
export function parseBeijingTime(timeStr: string): Date {
  if (!timeStr) return new Date(NaN)
  let s = timeStr
  if (s.includes('+') || s.endsWith('Z')) {
    return new Date(s)
  }
  if (s.includes('T')) {
    s = s + 'Z'
  } else {
    s = s.replace(' ', 'T') + 'Z'
  }
  return new Date(s)
}

export function formatDateTime(utcStr: string | undefined | null): string {
  if (!utcStr) return ''
  const d = parseBeijingTime(utcStr)
  if (isNaN(d.getTime())) return utcStr
  const bj = new Date(d.getTime() + BEIJING_OFFSET)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`
}

export function formatDate(utcStr: string | undefined | null): string {
  if (!utcStr) return ''
  const d = parseBeijingTime(utcStr)
  if (isNaN(d.getTime())) return utcStr
  const bj = new Date(d.getTime() + BEIJING_OFFSET)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())}`
}

export function formatRelative(utcStr: string | undefined | null): string {
  if (!utcStr) return ''
  const d = parseBeijingTime(utcStr)
  if (isNaN(d.getTime())) return utcStr
  const diff = Date.now() - d.getTime()
  if (diff < 0) return formatDateTime(utcStr)
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}天前`
  return formatDate(utcStr)
}
