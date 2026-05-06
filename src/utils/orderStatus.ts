/**
 * 订单状态工具函数
 * 统一管理订单状态映射和显示
 */

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  NEW = 1, // 新订单
  PAID = 2, // 已支付
  SENT = 3, // 已发送
  RECYCLED = 4, // 已回收
  COMPLETED = 5, // 已完成
  FAILED = 6, // 失败订单
  REFUNDED = 7, // 已退款
  CANCELLED = 8, // 已取消
  ABORTED = 9 // 中止订单
}

/**
 * 订单状态文本映射
 */
export const ORDER_STATUS_TEXT: Record<number, string> = {
  [OrderStatus.NEW]: '新订单',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.SENT]: '已发送',
  [OrderStatus.RECYCLED]: '已回收',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.FAILED]: '失败订单',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.ABORTED]: '中止订单'
}

/**
 * 订单状态类型映射 (用于 ElTag 的 type 属性)
 */
export const ORDER_STATUS_TYPE: Record<number, string> = {
  [OrderStatus.NEW]: 'info',
  [OrderStatus.PAID]: 'warning',
  [OrderStatus.SENT]: 'primary',
  [OrderStatus.RECYCLED]: 'success',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.FAILED]: 'danger',
  [OrderStatus.REFUNDED]: 'warning',
  [OrderStatus.CANCELLED]: 'info',
  [OrderStatus.ABORTED]: 'danger'
}

/**
 * 获取订单状态文本
 * @param status 状态码
 * @returns 状态文本
 */
export function getStatusText(status: number | undefined): string {
  if (status === undefined || status === null) return '-'
  return ORDER_STATUS_TEXT[status] || '未知状态'
}

/**
 * 获取订单状态类型 (用于 ElTag)
 * @param status 状态码
 * @returns 状态类型
 */
export function getStatusType(
  status: number | undefined
): 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  if (status === undefined || status === null) return 'info'
  return (ORDER_STATUS_TYPE[status] || 'info') as
    | 'success'
    | 'warning'
    | 'info'
    | 'primary'
    | 'danger'
}

/**
 * 订单状态选项 (用于搜索表单的下拉选择)
 */
export const ORDER_STATUS_OPTIONS = [
  { label: '全部', value: undefined },
  { label: '新订单', value: OrderStatus.NEW },
  { label: '已支付', value: OrderStatus.PAID },
  { label: '已发送', value: OrderStatus.SENT },
  { label: '已回收', value: OrderStatus.RECYCLED },
  { label: '已完成', value: OrderStatus.COMPLETED },
  { label: '失败订单', value: OrderStatus.FAILED },
  { label: '已退款', value: OrderStatus.REFUNDED },
  { label: '已取消', value: OrderStatus.CANCELLED },
  { label: '中止订单', value: OrderStatus.ABORTED }
]
