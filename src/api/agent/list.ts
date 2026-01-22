import request from '@/axios'
import { formatToDateTime } from '@/utils/dateUtil'

// 定义代理列表查询参数类型
export interface AgentQueryParams {
  query?: string // 关键字：代理ID/联系方式
  status?: number | string // 状态：'' 或 undefined 表示全部, 1 表示启用, 2 表示禁用
  current_page?: number
  page_size?: number
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
}

// 定义代理列表项类型 (根据示例数据调整)
export interface AgentItem {
  id: number | string // 代理ID
  user_name: string // 代理名称 (替代 name)
  email: string // 联系方式 (替代 contact)
  bot_num: number // 机器人数量 (替代 bot_count)
  tg_account_num: number // 总用户数 (替代 user_count)
  trx_mount: string | number // TRX余额 (替代 trx_balance, 类型调整)
  total_trx_amount: string | number // TRX收入 (替代 trx_income, 类型调整)
  total_usdt_amount: string | number // USDT收入 (替代 usdt_income, 类型调整)
  gift_bandwidth: number // 是否赠送带宽 [0:不赠送 1:赠送]
  status: number // 状态 (示例值为 0, 需确认 0/1/2 的含义)
  create_time: string | number // 创建时间 (示例值为 0)
}

export interface AgentListParams {
  query?: string // 关键字：代理ID/联系方式
  status?: number | string // 状态：'' 或 undefined 表示全部, 1 表示启用, 2 表示禁用
  current_page?: number
  page_size?: number
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
}

// 定义列表接口返回结构 (假设 data 结构)
interface AgentListResponseData {
  list: AgentItem[]
  totalCount: number
}

// 定义更新状态参数类型
export interface UpdateAgentStatusPayload {
  id: number | string // 代理ID
  status: number // 新的状态 (1: 启用, 2: 禁用)
}

/**
 * 获取代理列表
 * @param params 查询参数
 * @returns Promise<IResponse<AgentListResponseData>>
 */
export const getAgentListApi = (
  params: AgentQueryParams
): Promise<IResponse<AgentListResponseData>> => {
  return request.get({ url: '/v2/manage/agent/list', params })
}

/**
 * 更新代理状态 (禁用/启用)
 * @param data 更新负载 { id: 代理ID, status: 新状态 }
 * @returns Promise<IResponse>
 */
export const updateAgentStatusApi = (data: UpdateAgentStatusPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/update', data })
}

export const rechargeTrxApi = (data: any) => {
  return request.post({ url: '/v2/manage/agent/change_balance', data })
}

// 定义新增代理参数类型
export interface AddAgentPayload {
  username: string // 代理名称
  email: string // 联系方式
  password: string // 登录密码
  gift_bandwidth?: number // 是否赠送带宽 [0:不赠送 1:赠送]
}

// 定义编辑代理参数类型
export interface UpdateAgentPayload {
  id: number | string // 代理ID
  username?: string // 代理名称（可选）
  email?: string // 联系方式（可选）
  password?: string // 登录密码（可选，留空不修改）
  gift_bandwidth?: number // 是否赠送带宽 [0:不赠送 1:赠送]（可选）
  status?: number // 状态（可选）
}

/**
 * 新增代理
 * @param data 新增代理数据
 * @returns Promise<IResponse>
 */
export const addAgentApi = (data: AddAgentPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/add', data })
}

/**
 * 编辑代理
 * @param data 编辑代理数据
 * @returns Promise<IResponse>
 */
export const updateAgentApi = (data: UpdateAgentPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/update', data })
}

export const exportAgentListApi = (params: AgentListParams) => {
  return request.get<IResponse<Blob>>({
    url: '/v2/manage/agent/export',
    params,
    responseType: 'blob'
  })
}
