/**
 * 能量订单工具函数
 * 处理能量订单相关的业务逻辑
 */

/**
 * 能量订单类型枚举
 */
export enum EnergyOrderKind {
  TIME_ENERGY = 4, // 时间能量
  COUNT_ENERGY = 5, // 笔数能量
  WELFARE_ENERGY = 6, // 福利能量
  QUICK_ENERGY = 7, // 快速能量
  AUTO_HOSTING = 8, // 自动托管
  BATCH_ENERGY = 9, // 批量能量
  BATCH_ACTIVE = 10 // 批量激活
}

/**
 * 能量订单类型文本映射
 */
export const ENERGY_ORDER_KIND_TEXT: Record<number, string> = {
  [EnergyOrderKind.TIME_ENERGY]: '时间能量',
  [EnergyOrderKind.COUNT_ENERGY]: '笔数能量',
  [EnergyOrderKind.WELFARE_ENERGY]: '福利能量',
  [EnergyOrderKind.QUICK_ENERGY]: '快速能量',
  [EnergyOrderKind.AUTO_HOSTING]: '自动托管',
  [EnergyOrderKind.BATCH_ENERGY]: '批量能量',
  [EnergyOrderKind.BATCH_ACTIVE]: '批量激活'
}

/**
 * 获取能量订单类型文本
 * @param kind 订单类型
 * @returns 类型文本
 */
export function getEnergyOrderKindText(kind: number | undefined): string {
  if (kind === undefined || kind === null) return '-'
  return ENERGY_ORDER_KIND_TEXT[kind] || '未知类型'
}

/**
 * 能量订单类型选项 (用于搜索表单的下拉选择)
 */
export const ENERGY_ORDER_KIND_OPTIONS = [
  { label: '全部', value: undefined },
  { label: '时间能量', value: EnergyOrderKind.TIME_ENERGY },
  { label: '笔数能量', value: EnergyOrderKind.COUNT_ENERGY },
  { label: '福利能量', value: EnergyOrderKind.WELFARE_ENERGY },
  { label: '快速能量', value: EnergyOrderKind.QUICK_ENERGY },
  { label: '自动托管', value: EnergyOrderKind.AUTO_HOSTING },
  { label: '批量能量', value: EnergyOrderKind.BATCH_ENERGY },
  { label: '批量激活', value: EnergyOrderKind.BATCH_ACTIVE }
]

/**
 * ISO 时间字符串转 Unix 时间戳（秒）
 * @param isoTime ISO 时间字符串
 * @returns Unix 时间戳（秒），如果转换失败返回 0
 */
export function isoToTimestamp(isoTime: string | null | undefined): number {
  if (!isoTime) return 0
  try {
    return Math.floor(new Date(isoTime).getTime() / 1000)
  } catch {
    return 0
  }
}

/**
 * 计算能量有效时长文本
 * @param kind 订单类型
 * @param delegatedAt 委托时间（ISO格式字符串）
 * @param recycledAt 回收时间（ISO格式字符串）
 * @returns 有效时长文本，如 "1天" 或 "3天"
 */
export function calculateEnergyRentText(
  kind: number | undefined,
  delegatedAt: string | null | undefined,
  recycledAt: string | null | undefined
): string {
  // 如果不是时间能量类型，返回 "-"
  if (kind !== EnergyOrderKind.TIME_ENERGY) {
    return '-'
  }

  // 如果没有委托时间或回收时间，返回 "-"
  if (!delegatedAt || !recycledAt) {
    return '-'
  }

  try {
    const delegatedTimestamp = isoToTimestamp(delegatedAt)
    const recycledTimestamp = isoToTimestamp(recycledAt)

    if (delegatedTimestamp === 0 || recycledTimestamp === 0) {
      return '-'
    }

    // 计算时间差（秒）
    const diffSeconds = recycledTimestamp - delegatedTimestamp

    // 转换为小时
    const hours = Math.floor(diffSeconds / 3600)

    // 如果小于24小时，显示小时数
    if (hours < 24) {
      return `${hours}小时`
    }

    // 否则显示天数
    const days = Math.floor(hours / 24)
    return `${days}天`
  } catch {
    return '-'
  }
}

/**
 * 格式化能量数量显示
 * @param amount 能量数量
 * @returns 格式化后的字符串
 */
export function formatEnergyAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null || amount === '') return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '-'
  return num.toLocaleString('en-US')
}

/**
 * 获取收款方式文本
 * @param energyAddress 能量接收地址
 * @param receiveAddress 收款地址
 * @returns 收款方式文本
 */
export function getPaymentMethodText(
  energyAddress: string | null | undefined,
  receiveAddress: string | null | undefined
): string {
  // 如果能量接收地址为空，显示横杠
  if (!energyAddress || energyAddress.trim() === '') {
    return '-'
  }

  // 如果能量接收地址不为空，且收款地址为空，显示"余额支付"
  if (!receiveAddress || receiveAddress.trim() === '') {
    return '余额支付'
  }

  // 其他情况显示收款地址
  return receiveAddress
}
