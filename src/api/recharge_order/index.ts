import request from '@/axios'
import type { DepositListParamsV1, DepositListResponseV1, DepositDetailResponseV1 } from './type'

// 导出类型定义
export * from './type'

// ========== 新接口 v1 ==========

/**
 * 获取用户充值列表 - 新接口 v1
 * GET /v1/order/deposit/list
 */
export const v1GetDepositList = (
  params: DepositListParamsV1
): Promise<IResponse<DepositListResponseV1>> => {
  return request.get({
    url: '/v1/order/deposit/list',
    params
  })
}

/**
 * 获取订单详情 - 新接口 v1
 * GET /v1/order/{id}
 */
export const v1GetDepositDetail = (id: string): Promise<IResponse<DepositDetailResponseV1>> => {
  return request.get({
    url: `/v1/order/${id}`
  })
}

// ========== 旧接口 ==========

// 获取充值订单列表
export const getRechargeOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/inorder/list', params })
}

// 获取充值订单详情
export const getRechargeOrderDetailApi = (id: number) => {
  return request.get({ url: `/v1/order/inorder/detail/${id}` })
}

// 导出充值订单
export const exportRechargeOrderApi = (params: any) => {
  return request.get({ url: '/v1/order/inorder/export', params, responseType: 'blob' })
}
