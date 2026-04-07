import request from '@/axios'
import type {
  ExchangeOrderListParamsV1,
  ExchangeOrderListResponseV1,
  ExchangeOrderDetailResponseV1
} from './type'

// 导出类型定义
export * from './type'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/order/'

/**
 * 获取闪兑订单列表 - 新接口 v1
 * GET /v1/order/exchange/list
 */
export const v1GetExchangeOrderList = (
  params: ExchangeOrderListParamsV1
): Promise<IResponse<ExchangeOrderListResponseV1>> => {
  return request.get({
    url: `${BASE_URL}exchange/list`,
    params
  })
}

/**
 * 获取订单详情 - 新接口 v1
 * GET /v1/order/{id}
 */
export const v1GetExchangeOrderDetail = (
  id: string
): Promise<IResponse<ExchangeOrderDetailResponseV1>> => {
  return request.get({
    url: `${BASE_URL}${id}`
  })
}

// ========== 旧接口 ==========

// 获取兑换订单列表
export const getExchangeOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/exchange_order/list', params })
}

// 获取兑换订单详情
export const getExchangeOrderDetailApi = (id: number) => {
  return request.get({ url: `/v1/order/exchange_order/detail/${id}` })
}

// 获取交易详情
export const getTransactionDetailApi = (id: number) => {
  return request.get({ url: `/v1/order/exchange_order/tx_detail/${id}` })
}

// 获取转入详情
// export const getTransferInDetailApi = (id: Number) => {
//   return request.get({ url: `/v1/order/exchange_order/tx_detail/${id}` })
// }

// 导出兑换订单
export const exportExchangeOrderApi = (params: any) => {
  return request.get({ url: '/v1/order/exchange_order/export', params, responseType: 'blob' })
}
