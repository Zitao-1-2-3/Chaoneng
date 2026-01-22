import request from '@/axios'
import {
  EnergyTransactionOrder,
  EnergyTransactionResponse,
  EnergyTransactionQueryParams,
  UpdateStatusParams,
  PageParams,
  ListResult,
  EnergyCountListItem,
  BatchActiveListItem
} from './types'

// --- 新增：精确匹配示例响应的 IResponse 接口 ---
// !! 请确认所有 API 是否都遵循此结构 !!
export interface ApiResponse<T = any> {
  code: string // 注意：code 是字符串 "000000"
  data: T | null // data 可能为 null 或包含具体类型
  msg: string // 注意：字段名是 msg
  trace?: {
    // trace 结构是可选的
    id?: string
    srcIp?: string
    timestamp?: number
  }
}

export interface HandleRecycleParams {
  id: number
}

/**
 * 处理回收
 * @param data 处理回收参数
 */
export const handleRecycleApi = (data: HandleRecycleParams) => {
  return request.post<ApiResponse<EnergyTransactionOrder | null>>({
    url: '/v2/manage/energy_order/hand_recycle',
    data
  })
}

/**
 * 获取能量交易订单列表
 * @param params 查询参数
 */
export const getEnergyTransactionListApi = (params: EnergyTransactionQueryParams) => {
  return request.get<ApiResponse<EnergyTransactionResponse>>({
    url: '/v2/manage/energy_order/list',
    params
  })
}

/**
 * 获取能量交易订单详情
 * @param id 订单ID
 */
export const getEnergyTransactionDetailApi = (id: string) => {
  return request.get<ApiResponse<EnergyTransactionOrder>>({
    url: `/v2/manage/energy_order/detail/${id}`
  })
}

/**
 * 更新能量交易订单状态
 * @param data 状态更新参数
 */
export const updateEnergyTransactionStatusApi = (data: UpdateStatusParams) => {
  return request.post<ApiResponse<EnergyTransactionOrder | null>>({
    url: '/v1/operation/energy-transaction/update-status',
    data
  })
}

/**
 * 导出能量交易订单
 * @param params 查询参数
 */
export const exportEnergyTransactionApi = (params: EnergyTransactionQueryParams) => {
  return request.get({
    url: '/v2/manage/energy_order/export',
    params,
    responseType: 'blob'
  })
}

/**
 * 查询笔数订单详情列表
 * @param id 主订单 ID
 * @param params 分页参数
 */
export const getEnergyCountListApi = (id: string | number, params: PageParams) => {
  return request.get<ApiResponse<ListResult<EnergyCountListItem>>>({
    url: `/v2/manage/energy_count/list/${id}`,
    params
  })
}

/**
 * 查询批量或激活订单详情列表
 * @param id 主订单 ID
 * @param params 分页参数
 */
export const getBatchActiveListApi = (id: string | number, params: PageParams) => {
  return request.get<ApiResponse<ListResult<BatchActiveListItem>>>({
    url: `/v2/manage/batch_active/list/${id}`,
    params
  })
}

/**
 * 获取带宽订单详情
 * @param id 订单ID
 */
export const getBandwidthOrderDetailApi = (id: string) => {
  return request.get<ApiResponse<EnergyTransactionOrder>>({
    url: `/v2/manage/bandwidth_order/detail/${id}`
  })
}

/**
 * 获取带宽按笔数详情列表
 * @param id 主订单 ID
 * @param params 分页参数
 */
export const getBandwidthCountListApi = (id: string | number, params: PageParams) => {
  return request.get<ApiResponse<ListResult<EnergyCountListItem>>>({
    url: `/v2/manage/bandwidth_count/list/${id}`,
    params
  })
}

// 导出所有类型
export * from './types'
