import request from '@/axios'
import type { AxiosPromise } from 'axios'
import { formatToDateTime } from '@/utils/dateUtil' // 引入日期格式化工具

// 移除本地定义，假设 IResponse 是全局可用的
// interface IResponse<T = any> {
//   code: number
//   message: string
//   data: T
// }

// 定义机器人列表查询参数类型
export interface AgentBotQueryParams {
  query?: string // 关键字：机器人ID/用户名/所属代理
  status?: number | string // 状态：'' 或 undefined 表示全部, 1 表示启用, 2 表示禁用 (假设值，请根据后端确认)
  current_page?: number // 使用后端期望的参数名
  page_size?: number // 使用后端期望的参数名
}

// 定义机器人列表项类型 (根据示例数据调整)
export interface AgentBotItem {
  id: number | string // 机器人ID
  tg_bot_id: number | string // TG Bot ID (新增，但可能不在表格显示)
  name: string // 机器人昵称 (替代 nickname)
  firstname: string // Firstname (新增，但可能不在表格显示)
  user_name: string // 机器人用户名 (替代 username)
  email: string // Email (新增，但可能不在表格显示)
  tg_admin: string // 管理员TG号 (替代 tg_id)
  apl_key: string // API密钥 (替代 api_key)
  order_count: number // 交易订单数
  status: number // 机器人状态 (1: 启用, 2: 禁用 - 假设值)
  create_time: string | number // 创建时间
  update_time: string | number // 最后活动时间 (替代 last_active_time)
  // agent_id 字段已移除
}

// 定义列表接口返回结构 (假设 data 结构)
interface AgentBotListResponseData {
  list: AgentBotItem[]
  totalCount: number
}

// 定义更新状态参数类型
export interface UpdateAgentBotStatusPayload {
  id: number | string // 机器人ID
  status: number // 新的状态 (1: 启用, 2: 禁用 - 假设值)
}

/**
 * 获取机器人列表
 * @param params 查询参数
 * @returns Promise<IResponse<AgentBotListResponseData>> // 修正返回类型
 */
export const getAgentBotListApi = (
  params: AgentBotQueryParams
): Promise<IResponse<AgentBotListResponseData>> => {
  return request.get({ url: '/v2/manage/agent_bot/list', params })
}

/**
 * 更新机器人状态 (禁用/启用)
 * @param data 更新负载 { id: 机器人ID, status: 新状态 }
 * @returns Promise<IResponse> // 修正返回类型 (如果更新操作没有特定 data 返回)
 */
export const updateAgentBotStatusApi = (data: UpdateAgentBotStatusPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent_bot/update', data })
}

export const exportAgentBotListApi = (params: AgentBotQueryParams): Promise<IResponse<Blob>> => {
  return request.get({ url: '/v2/manage/agent_bot/export', params, responseType: 'blob' })
}
