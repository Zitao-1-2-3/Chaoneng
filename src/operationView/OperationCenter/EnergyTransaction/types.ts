/**
 * 能量交易页面类型定义
 */

import type { V2EnergyItem } from '@/api/energy_transaction/types'

/**
 * 能量订单数据 - 直接复用 API 层定义
 */
export type EnergyOrder = V2EnergyItem

/**
 * 列表查询参数
 */
export interface EnergyListParams {
  current_page?: number
  page_size?: number
  start_time?: string
  end_time?: string
  keyword?: string
  origin?: number
  kind?: number
  receive_address?: string
  energy_address?: string
  status?: number
  order?: string
}

/**
 * 搜索表单参数
 */
export interface SearchFormParams {
  keyword?: string
  origin?: number | string
  receive_address?: string
  energy_address?: string
  status?: number
  kind?: number
  dateRange?: [number, number]
}

/**
 * 导出数据项
 */
export interface ExportDataItem {
  订单号: string
  代理名称: string
  TG用户名?: string
  TG用户昵称?: string
  用户账号?: string
  用户邮箱?: string
  来源: string
  订单类型: string
  交易金额: string
  应发放能量: string
  实际发放能量: string
  收款方式: string
  能量接收地址: string
  笔数: string | number
  订单状态: string
  备注: string
  创建时间: string
  回收时间: string
}
