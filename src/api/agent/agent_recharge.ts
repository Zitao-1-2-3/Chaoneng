import request from '@/axios'

export interface AgentRechargeItem {
  id: number
  orderNo: string
  agentName: string
  contact: string
  rechargeType: string // e.g., 'USDT'
  amount: number
  status: number // e.g., 0: 待处理, 1: 已完成, 2: 已取消
  createTime: string
  remark: string // e.g., '手动充值' or '转账充值'
}

export interface AgentRechargeQueryParams extends PageParam {
  query?: string // 关键字搜索 (订单号/代理名称)
  status?: number // 订单状态过滤
}

export const getAgentRechargeListApi = (params: AgentRechargeQueryParams) => {
  return request.get({
    url: '/agent/recharge/list',
    params
  })
}

export const exportAgentRechargeApi = (params: AgentRechargeQueryParams) => {
  return request.get({
    url: '/agent/recharge/export',
    params,
    responseType: 'blob'
  })
}

export const getAgentRechargeDetailApi = (id: number) => {
  return request.get({
    url: `/agent/recharge/detail/${id}`
  })
}
