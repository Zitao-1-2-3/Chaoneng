import request from '@/axios'
import type {
  GroupListParams,
  GroupListResponse,
  UpdateGroupStatusParams,
  SendGroupMessageParams
} from './types'

const BASE_URL = '/v1/bot/'

/**
 * 分页获取群组列表
 * GET /v1/bot/group
 */
export const getGroupList = (params: GroupListParams): Promise<IResponse<GroupListResponse>> => {
  return request.get({
    url: `${BASE_URL}group`,
    params
  })
}

/**
 * 更新群组状态
 * POST /v1/group/update-status
 */
export const updateGroupStatus = (data: UpdateGroupStatusParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}update-status`,
    data
  })
}

/**
 * 发送群组消息
 * POST /v1/group/send-message
 */
export const sendGroupMessage = (data: SendGroupMessageParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}send-message`,
    data
  })
}

/**
 * 获取机器人列表（用于群组列表筛选）
 * GET /v1/message/bot
 */
export const getGroupBotList = (): Promise<IResponse<Array<{ id: number; user_name: string }>>> => {
  return request.get({
    url: '/v1/message/bot'
  })
}
