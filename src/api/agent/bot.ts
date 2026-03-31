import request from '@/axios'
import type { AxiosPromise } from 'axios'

// ==================== 类型定义 ====================

/**
 * 机器人列表查询参数（新接口）
 */
export interface AgentBotQueryParams {
  agent_name?: string // 代理名称
  current_page?: number // 页码
  keyword?: string // 关键字搜索
  page_size?: number // 每页大小
  status?: number | string // 状态筛选
}

/**
 * 分页信息
 */
export interface PagerInfo {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 机器人列表项（新接口数据结构）
 */
export interface AgentBotItem {
  id: number // 机器人ID
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  auto_renew: number // 自动续费
  created_at: string // 创建时间
  describe: string // 描述
  expired_at: string // 过期时间
  firstname: string // 机器人昵称
  status: number // 状态 (1: 启用, 2: 禁用)
  tg_admin: string // 管理员TG号
  token: string // 机器人Token
  total_fee: number // 总费用
  updated_at: string // 更新时间
  username: string // 机器人用户名
}

/**
 * 机器人列表响应数据（新接口格式）
 */
export interface AgentBotListResponse {
  list: AgentBotItem[]
  pager: PagerInfo
}

/**
 * 更新机器人参数（新接口）
 */
export interface UpdateAgentBotPayload {
  id: number // 机器人ID
  auto_renew?: number // 自动续费 (1: 开启, 0: 关闭)
  describe?: string // 描述
  status?: number // 状态 (1: 启用, 2: 禁用)
  tg_admin?: string // 管理员TG号
}

/**
 * 更新机器人状态参数（兼容旧接口）
 * @deprecated 请使用 UpdateAgentBotPayload 代替
 */
export interface UpdateAgentBotStatusPayload {
  id: number | string // 机器人ID
  status: number // 新的状态 (1: 启用, 2: 禁用)
}

// ==================== 兼容性类型（保持向后兼容） ====================

/**
 * 机器人列表响应数据（兼容旧接口格式）
 * @deprecated 请使用 AgentBotListResponse 代替
 */
interface AgentBotListResponseData {
  list: AgentBotItem[]
  totalCount: number
}

// ==================== 新接口（v2） ====================

const AGENT_BOT_BASE = '/v2/manage/agent_bot/'

/**
 * 获取机器人列表（新接口 v2）
 * 接口路径：GET /v2/manage/agent_bot/list
 * @param params 查询参数
 */
export const getAgentBotListApi = (
  params: AgentBotQueryParams
): Promise<IResponse<AgentBotListResponse>> => {
  return request.get({ url: `${AGENT_BOT_BASE}list`, params })
}

/**
 * 更新机器人信息（新接口 v2）
 * 接口路径：POST /v2/manage/agent_bot/update
 * @param data 更新参数
 */
export const updateAgentBotApi = (data: UpdateAgentBotPayload): Promise<IResponse> => {
  return request.post({ url: `${AGENT_BOT_BASE}update`, data })
}

/**
 * 更新机器人状态（兼容接口）
 * @deprecated 请使用 updateAgentBotApi 代替
 * @param data 更新参数
 */
export const updateAgentBotStatusApi = (data: UpdateAgentBotStatusPayload): Promise<IResponse> => {
  // 转换为新接口格式
  const payload: UpdateAgentBotPayload = {
    id: Number(data.id),
    status: data.status
  }
  return updateAgentBotApi(payload)
}

/**
 * 导出机器人列表（新接口 v2）
 * 接口路径：GET /v2/manage/agent_bot/export
 * @param params 查询参数
 */
export const exportAgentBotListApi = (params: AgentBotQueryParams): Promise<IResponse<Blob>> => {
  return request.get({ url: `${AGENT_BOT_BASE}export`, params, responseType: 'blob' })
}

// ==================== 旧接口（已废弃，保留参考） ====================

/**
 * 获取机器人列表（旧接口，已废弃）
 * @deprecated 请使用上面的 getAgentBotListApi 代替
 */
// export const getAgentBotListApiOld = (
//   params: AgentBotQueryParams
// ): Promise<IResponse<AgentBotListResponseData>> => {
//   return request.get({ url: '/v2/manage/agent_bot/list', params })
// }
