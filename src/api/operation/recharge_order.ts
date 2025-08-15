import request from '@/axios'

export interface RechargeOrderItem {
  id: number
  agentInfo: string // 代理信息
  bot: string // 机器人
  tgUsername: string // 用户的TG用户名
  address: string // 地址
  amount: number // 金额
}
export interface PageParam {
  pageSize?: number
  currentPage?: number
}
export interface RechargeOrderQueryParams extends PageParam {
  query?: string // 关键字搜索 (代理信息/TG用户名等)
}

export const getRechargeOrderListApi = (params: RechargeOrderQueryParams) => {
  return request.get({
    url: '/v2/manage/tg_user/inorder/list',
    params
  })
}

// 获取充值订单详情
export const getRechargeOrderDetailApi = (id: number) => {
  return request.get({ url: `/v2/manage/tg_user/inorder/detail/${id}` })
}

export const exportRechargeOrderApi = (params: RechargeOrderQueryParams) => {
  return request.get({
    url: '/v2/manage/tg_user/inorder/export',
    params,
    responseType: 'blob'
  })
}
