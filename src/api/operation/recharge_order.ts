import request from '@/axios'

export interface RechargeOrderItem {
  id: number
  agentInfo: string // 代理信息
  bot: string // 机器人
  tgUsername: string // 用户的TG用户名
  address: string // 地址
  amount: number // 金额
}

export interface RechargeOrderQueryParams extends PageParam {
  query?: string // 关键字搜索 (代理信息/TG用户名等)
}

export const getRechargeOrderListApi = (params: RechargeOrderQueryParams) => {
  return request.get({
    url: '/operation/recharge_order/list',
    params
  })
}

export const exportRechargeOrderApi = (params: RechargeOrderQueryParams) => {
  return request.get({
    url: '/operation/recharge_order/export',
    params,
    responseType: 'blob'
  })
}
