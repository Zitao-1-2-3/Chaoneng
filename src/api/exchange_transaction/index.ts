import request from '@/axios'
import type {
  ExchangeOrderListItem,
  ExchangeOrderListParams,
  ExchangeOrderListResult,
  ExchangeOrderDetailData,
  ResendTrxParams,
  V2ExchangeListParams,
  V2ExchangeListResponse
} from './types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/order/exchange/'

/**
 * 获取闪兑订单列表 - 新接口 v2
 * GET /v2/order/exchange/list
 */
export const v2GetExchangeList = (params: V2ExchangeListParams) => {
  console.log('[v2GetExchangeList] 调用参数:', params)
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

// ========== 旧接口 ==========

// Define IResponse if not globally available
interface IResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * V2 - 查询闪兑订单列表
 * @param params 查询参数
 */
export const getExchangeOrderListApi = (params: ExchangeOrderListParams) => {
  // Assuming request.get supports generics and backend returns IResponse structure
  return request.get<IResponse<ExchangeOrderListResult>>({
    url: '/v2/manage/exchange_order/list',
    params
  })
}
export const getExchangeOrderDetailApi = (id: number) => {
  // Assuming request.get supports generics and backend returns IResponse structure
  return request.get<IResponse<ExchangeOrderDetailData>>({
    url: `/v2/manage/order/exchange_order/detail/${id}`
  })
}

/**
 * V2 - 查询闪兑单交易详情
 * @param id 订单数据库 ID
 */
export const getExchangeTxDetailApi = (id: number) => {
  // Assuming request.get supports generics and backend returns IResponse structure
  return request.get<IResponse<ExchangeOrderDetailData>>({
    url: `/v2/manage/exchange_order/tx_detail/${id}`
  })
}

/**
 * V2 - 补发TRX (逻辑暂时注释)
 * @param params 补发参数
 */
export const resendTrxApi = (params: ResendTrxParams) => {
  // TODO: 需要后端确认实际的 V2 补发接口 URL
  const V2_RESEND_URL = '/v2/manage/exchange_order/resend_trx' // 假设的 V2 URL
  console.warn(`resendTrxApi is called but currently commented out. Target URL: ${V2_RESEND_URL}`)
  return Promise.resolve({ code: 999, message: '补发功能暂未启用', data: false }) // 返回一个模拟的失败响应

  /* // 实际调用 (取消注释以启用)
  // Assuming request.post supports generics and backend returns IResponse structure
  return request.post<IResponse<boolean>>({
    url: V2_RESEND_URL, // 使用确认后的 V2 URL
    data: params
  })
  */
}

export const exportExchangeOrderApi = (params: ExchangeOrderListParams) => {
  return request.get<IResponse<boolean>>({
    url: '/v2/manage/exchange_order/export',
    params,
    responseType: 'blob'
  })
}

// 导出所有类型
export * from './types'
