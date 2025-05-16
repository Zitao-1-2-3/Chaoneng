import request from '@/axios'
import type { ReplyListParams, ReplyItem, ReplySaveParams, BotOption } from './types'

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
export const updateReplyStatusApi = (data) => {
  // Assuming /v1/bot/reply/update can handle partial updates with id and status.
  // The backend signature for UpdateBotReply will determine if this is correct.
  // If it needs the full object, this approach needs to be revised in the calling component.
  return request.post<boolean>({ url: '/v1/bot/reply/update', data }) // Updated URL, using POST
}

// 获取机器人列表 (用于搜索下拉框)
export const getBotOptionsApi = () => {
  return request.get<BotOption[]>({ url: '/mock/bot/options' }) // Placeholder URL, please update
}
