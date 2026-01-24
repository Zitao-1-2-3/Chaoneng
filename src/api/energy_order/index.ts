import request from '@/axios'

// 获取能量订单列表
export const getEnergyOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/energy_order/list', params })
}

// 获取带宽订单列表
export const getBandwidthOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/bandwidth_order/list', params })
}

// 获取能量订单详情
export const getEnergyOrderDetailApi = (id: string | number) => {
  return request.get({ url: `/v1/order/energy_order/detail/${id}` })
}

// 获取带宽订单详情
export const getBandwidthOrderDetailApi = (id: string | number) => {
  return request.get({ url: `/v1/order/bandwidth_order/detail/${id}` })
}

// 获取交易详情
export const getTransactionDetailApi = (transaction_hash: string) => {
  return request.get({
    url: '/v1/order/energy_order/transaction_detail',
    params: { transaction_hash }
  })
}

// 导出能量订单
export const exportEnergyOrderApi = (params: any) => {
  return request.get({ url: '/v1/order/energy_order/export', params, responseType: 'blob' })
}

// 获取批量激活订单详情
export const getBatchActiveDetailApi = (id: string | number, params?: any) => {
  return request.get({ url: `/v1/order/batch_active/list/${id}`, params })
}

export const getByCountDetailApi = (
  id: string | number,
  params?: { currentPage: number; pageSize: number }
) => {
  return request.get({ url: `/v1/order/energy_count/list/${id}`, params })
}
