/**
 * 能量交易页面工具函数
 */

import type { SearchFormParams, EnergyListParams, EnergyOrder, ExportDataItem } from './types'
import { getSourceText } from '@/utils/sourceFilter'
import {
  getEnergyOrderKindText,
  formatEnergyAmount,
  getPaymentMethodText
} from '@/utils/energyOrder'
import { getStatusText } from '@/utils/orderStatus'
import { formatToDateTime } from '@/utils/dateUtil'

/**
 * 转换搜索表单参数为 API 参数
 * @param params 搜索表单参数
 * @returns API 参数
 */
export function transformSearchParamsToApiParams(params: SearchFormParams): EnergyListParams {
  const apiParams: EnergyListParams = {}

  // 处理时间范围（毫秒转秒）
  if (params.dateRange && params.dateRange.length === 2) {
    apiParams.start_time = String(Math.floor(params.dateRange[0] / 1000))
    apiParams.end_time = String(Math.floor(params.dateRange[1] / 1000))
  }

  // 处理关键字查询
  if (params.keyword) {
    apiParams.keyword = params.keyword
  }

  // 处理来源
  if (params.origin !== undefined && params.origin !== '') {
    apiParams.origin = Number(params.origin)
  }

  // 处理订单类型
  if (params.kind) {
    apiParams.kind = params.kind
  }

  // 处理收款钱包地址
  if (params.receive_address) {
    apiParams.receive_address = params.receive_address
  }

  // 处理能量接收地址
  if (params.energy_address) {
    apiParams.energy_address = params.energy_address
  }

  // 处理状态
  if (params.status) {
    apiParams.status = params.status
  }

  return apiParams
}

/**
 * 转换订单数据为导出格式
 * @param order 订单数据
 * @param selectedSource 当前选择的来源
 * @returns 导出数据项
 */
export function transformOrderToExportData(
  order: EnergyOrder,
  selectedSource: number | string
): ExportDataItem {
  // 基础字段（始终导出）
  const baseData: Partial<ExportDataItem> = {
    订单号: order.id || '-',
    代理名称: order.agent_name || '-'
  }

  // 根据来源判断导出哪些字段
  // 如果没有筛选来源，或者来源为机器人(1)，导出TG相关字段
  if (!selectedSource || selectedSource === 1 || selectedSource === '1') {
    baseData['TG用户名'] = order.tg_user_name || '-'
    baseData['TG用户昵称'] = order.tg_first_name || '-'
  }

  // 如果没有筛选来源，或者来源为H5(2)，导出H5相关字段
  if (!selectedSource || selectedSource === 2 || selectedSource === '2') {
    baseData['用户账号'] = order.username || '-'
    baseData['用户邮箱'] = order.email || '-'
  }

  // 其他通用字段
  return {
    ...baseData,
    来源: getSourceText(order.origin, order.tg_user_name, order.username),
    订单类型: getEnergyOrderKindText(order.kind),
    交易金额: `${order.amount || '-'} ${order.coin || ''}`.trim(),
    应发放能量: formatEnergyAmount(order.energy_amount),
    实际发放能量: formatEnergyAmount(order.energy_actual_amount),
    收款方式: getPaymentMethodText(order.energy_address, order.receive_address),
    能量接收地址: order.energy_address || '-',
    笔数: order.energy_count || '-',
    订单状态: getStatusText(order.status),
    备注: order.describe || '-',
    创建时间: order.created_at ? formatToDateTime(order.created_at) : '-',
    回收时间: order.recycled_at ? formatToDateTime(new Date(order.recycled_at).getTime()) : '-'
  } as ExportDataItem
}

/**
 * 按创建时间降序排序订单列表
 * @param orders 订单列表
 * @returns 排序后的订单列表
 */
export function sortOrdersByCreatedTime(orders: EnergyOrder[]): EnergyOrder[] {
  return [...orders].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return timeB - timeA // 降序：新的在前
  })
}

/**
 * 检查是否有搜索条件
 * @param params 搜索参数
 * @returns 是否有搜索条件
 */
export function hasSearchCondition(params: SearchFormParams): boolean {
  return !!(
    params.keyword ||
    params.origin ||
    params.receive_address ||
    params.energy_address ||
    params.status ||
    params.kind ||
    params.dateRange
  )
}

/**
 * 判断订单是否可以停止
 * @param order 订单数据
 * @param stoppingOrders 正在停止的订单集合
 * @param stoppedOrders 已停止的订单集合
 * @returns 是否可以停止
 */
export function canStopOrder(
  order: EnergyOrder,
  stoppingOrders: Set<string>,
  stoppedOrders: Set<string>
): boolean {
  // 状态必须是"已发送"（status=3）且不在停止中且没有被停止过
  return order.status === 3 && !stoppingOrders.has(order.id) && !stoppedOrders.has(order.id)
}

/**
 * 订单停止轮询配置
 */
export const STOP_POLLING_CONFIG = {
  MAX_ATTEMPTS: 3,
  INTERVAL: 3000
} as const
