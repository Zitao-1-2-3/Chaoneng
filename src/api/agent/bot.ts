import request from '@/axios'
import type {
  AgentBotQueryParams,
  AgentBotListResponse,
  UpdateAgentBotPayload,
  UpdateAgentBotStatusPayload
} from './bot.types'

// 导出类型定义
export * from './bot.types'

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
