import request from '@/axios'
import type {
  ReplyListParams,
  ReplyItem,
  ReplySaveParams,
  BotOption,
  ReplyListParamsV1,
  ReplyListResponseV1,
  CreateReplyParamsV1,
  UpdateReplyParamsV1
} from './types'

// 导出类型定义
export * from './types'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/bot/reply/'

/**
 * 获取关键词回复列表 - 新接口 v1
 * GET /v1/bot/reply/list
 */
export const v1GetReplyList = (
  params: ReplyListParamsV1
): Promise<IResponse<ReplyListResponseV1>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 创建关键词回复 - 新接口 v1
 * POST /v1/bot/reply/add
 */
export const v1CreateReply = (data: CreateReplyParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}add`,
    data
  })
}

/**
 * 更新关键词回复 - 新接口 v1
 * POST /v1/bot/reply/update
 */
export const v1UpdateReply = (data: UpdateReplyParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}update`,
    data
  })
}

/**
 * 删除关键词回复 - 新接口 v1
 * POST /v1/bot/reply/delete/{id}
 */
export const v1DeleteReply = (id: number): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}delete/${id}`
  })
}

// ========== 旧接口 ==========

// 获取关键词回复列表
export const getReplyListApi = (params: ReplyListParams) => {
  return request.get<{ list: ReplyItem[]; totalCount: number }>(
    { url: '/v1/bot/reply/list', params } // Updated URL
  )
}

// 删除关键词回复
export const deleteReplyApi = (id: number) => {
  // Changed to POST and sending ID in data, as per common practice for POST delete
  return request.post<boolean>({ url: '/v1/bot/reply/delete', data: { id } }) // Updated URL and method
}

// 保存关键词回复 (新增/编辑)
export const saveReplyApi = (data: ReplySaveParams) => {
  // Data is now expected to be in the correct format (tg_bot_id, key_name as string[])
  const url = data.id ? '/v1/bot/reply/update' : '/v1/bot/reply/add'
  return request.post<ReplyItem>({ url, data })
}

// 更新关键词回复状态
export const updateReplyStatusApi = (data: { id: number; status: number }) => {
  // Assuming /v1/bot/reply/update can handle partial updates with id and status.
  // The backend signature for UpdateBotReply will determine if this is correct.
  // If it needs the full object, this approach needs to be revised in the calling component.
  return request.post<boolean>({ url: '/v1/bot/reply/update', data }) // Updated URL, using POST
}

// 获取机器人列表 (用于搜索下拉框)
export const getBotOptionsApi = () => {
  return request.get<BotOption[]>({ url: '/mock/bot/options' }) // Placeholder URL, please update
}
