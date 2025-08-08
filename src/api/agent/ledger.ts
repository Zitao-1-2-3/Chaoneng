import request from '@/axios'
import { formatToDateTime } from '@/utils/dateUtil'

/**
 * 代理账单数据项接口
 */
export interface AgentLedgerItem {
  id: number | string // 扣款ID
  email: string // 代理信息
  username: string // 代理名称
  describe: string // 交易类型
  amount: string | number
  change_type: 'in' | 'out' // 用于格式化金额颜色
  unit: string // 单位，例如 TRX
  after_amount: string | number // 交易后TRX余额
  status: number // 扣款状态 (0, 1: 已完成, 2: 已取消, 3: 进行中)
  order_num: string | number // 关联订单ID
  create_time: string | number // 扣款时间
}

/**
 * 代理账单查询参数
 */
export interface AgentLedgerQueryParams {
  query?: string // 关键字
  status?: number | string // 扣款状态
  current_page?: number
  page_size?: number
}

/**
 * 代理账单列表响应
 */
interface AgentLedgerListResponseData {
  list: AgentLedgerItem[]
  totalCount: number
}

/**
 * 获取代理账单列表
 * @param params 查询参数
 * @returns Promise<IResponse<AgentLedgerListResponseData>>
 */
export const getAgentLedgerListApi = (
  params: AgentLedgerQueryParams
): Promise<IResponse<AgentLedgerListResponseData>> => {
  // 注意：此 URL 基于 Ledger.vue 中的 getAgentLedgerListApi 调用，请确认是否正确
  return request.get({ url: '/v2/manage/agent_balance/list', params })
}

/**
 * 导出代理账单
 * @param params 查询参数
 * @returns Promise<IResponse> (假设导出操作不返回特定数据结构)
 */
export const exportAgentLedgerApi = (params: AgentLedgerQueryParams): Promise<IResponse> => {
  console.log('params', params)

  // 注意：此 URL 和方法基于 Ledger.vue 中的 exportAgentLedgerApi 调用，请确认是否正确
  // 通常导出是大文件，可能是 POST 请求，或者 GET 请求直接下载
  // 这里假设是 POST 请求，并将参数放在 body 中
  return request.get({
    url: '/v2/manage/agent_balance/export',
    params: params,
    responseType: 'blob'
  })
}
