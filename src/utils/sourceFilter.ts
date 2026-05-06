/**
 * 来源过滤工具函数
 * 统一管理来源类型的判断和显示
 */

/**
 * 来源类型枚举
 */
export enum SourceType {
  BOT = 1, // 机器人
  H5 = 2 // H5
}

/**
 * 来源类型文本映射
 */
export const SOURCE_TYPE_TEXT: Record<number, string> = {
  [SourceType.BOT]: '机器人',
  [SourceType.H5]: 'H5'
}

/**
 * 获取来源文本
 * @param origin 来源类型
 * @param tgUserName TG用户名（可选）
 * @returns 来源文本
 */
export function getSourceText(origin: number | undefined, tgUserName?: string): string {
  // 如果 TG 用户名不为空，显示为机器人
  if (tgUserName && tgUserName.trim() !== '') {
    return SOURCE_TYPE_TEXT[SourceType.BOT]
  }

  if (origin === undefined || origin === null) return '-'
  return SOURCE_TYPE_TEXT[origin] || '-'
}

/**
 * 来源类型选项 (用于搜索表单的下拉选择)
 */
export const SOURCE_TYPE_OPTIONS = [
  { label: '全部', value: undefined },
  { label: '机器人', value: SourceType.BOT },
  { label: 'H5', value: SourceType.H5 }
]

/**
 * 判断是否应该隐藏列（根据来源类型）
 * 某些列只在特定来源下显示
 * @param origin 来源类型
 * @param columnType 列类型
 * @returns 是否隐藏
 */
export function shouldHideColumn(
  origin: number | undefined,
  columnType: 'bot' | 'h5' | 'all'
): boolean {
  if (columnType === 'all') return false

  if (origin === undefined || origin === null) return false

  if (columnType === 'bot') {
    return origin !== SourceType.BOT
  }

  if (columnType === 'h5') {
    return origin !== SourceType.H5
  }

  return false
}

/**
 * 根据来源类型获取标签类型（用于 ElTag）
 * @param origin 来源类型
 * @param tgUserName TG用户名（可选）
 * @returns 标签类型
 */
export function getSourceTagType(origin: number | undefined, tgUserName?: string): string {
  // 如果 TG 用户名不为空，返回机器人的标签类型
  if (tgUserName && tgUserName.trim() !== '') {
    return 'primary'
  }

  if (origin === undefined || origin === null) return 'info'

  switch (origin) {
    case SourceType.BOT:
      return 'primary'
    case SourceType.H5:
      return 'success'
    default:
      return 'info'
  }
}
