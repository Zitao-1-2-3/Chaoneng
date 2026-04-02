import request from '@/axios'
import type {
  RechargeOrderQueryParams,
  RechargeOrderDetailResponse,
  V2DepositListParams,
  V2DepositListResponse,
  V2DepositDetail
} from './recharge_order_types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/order/'

/**
 * 获取充值订单列表 - 新接口 v2
 * GET /v2/order/deposit/list
 */
export const v2GetDepositList = (
  params: V2DepositListParams
): Promise<IResponse<V2DepositListResponse>> => {
  return request.get({
    url: `${BASE_URL}deposit/list`,
    params
  })
}

/**
 * 获取充值订单详情 - 新接口 v2
 * GET /v2/order/{id}
 */
export const v2GetDepositDetail = (id: string): Promise<IResponse<V2DepositDetail>> => {
  return request.get({
    url: `${BASE_URL}${id}`
  })
}

// ========== 旧接口 ==========

/**
 * 获取充值订单列表 - 旧接口
 */
export const getRechargeOrderListApi = (params: RechargeOrderQueryParams): Promise<any> => {
  return request.get({
    url: '/v2/manage/tg_user/inorder/list',
    params
  })
}

/**
 * 获取充值订单详情 - 旧接口
 */
export const getRechargeOrderDetailApi = (
  id: number
): Promise<IResponse<RechargeOrderDetailResponse>> => {
  return request.get({ url: `/v2/manage/tg_user/inorder/detail/${id}` })
}

/**
 * 导出充值订单 - 旧接口
 */
export const exportRechargeOrderApi = (params: RechargeOrderQueryParams): Promise<any> => {
  return request.get({
    url: '/v2/manage/tg_user/inorder/export',
    params,
    responseType: 'blob'
  })
}
