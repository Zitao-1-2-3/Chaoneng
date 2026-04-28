import request from '@/axios'
import type {
  GetBotMenuListParams,
  GetBotMenuListResponse,
  AddBotMenuParams,
  BatchUpdateBotMenuParams
} from './types'

// 导出类型定义
export * from './types'

const BASE_URL = '/v1/bot/menu'

/**
 * 获取机器人菜单列表
 * GET /v1/bot/menu
 */
export const getBotMenuList = (
  params: GetBotMenuListParams
): Promise<IResponse<GetBotMenuListResponse>> => {
  return request.get({
    url: BASE_URL,
    params
  })
}

/**
 * 添加机器人菜单（运营端使用）
 * POST /v1/bot/menu
 */
export const addBotMenu = (data: AddBotMenuParams): Promise<IResponse> => {
  return request.post({
    url: BASE_URL,
    data
  })
}

/**
 * 批量更新机器人菜单
 * PUT /v1/bot/menu
 * @param data - 包含 bot_id 和 menus 数组
 */
export const batchUpdateBotMenu = (data: BatchUpdateBotMenuParams): Promise<IResponse> => {
  return request.put({
    url: BASE_URL,
    data
  })
}

/**
 * 删除机器人菜单（运营端使用）
 * DELETE /v1/bot/menu/{id}
 */
export const deleteBotMenu = (id: number): Promise<IResponse> => {
  return request.delete({
    url: `${BASE_URL}/${id}`
  })
}

// ========== 内联按钮 API ==========

/**
 * 获取内联按钮列表（用于群发消息选择）
 * GET /v1/message/inner_button
 * 无参数，返回所有可用的内联按钮
 */
export const v1GetInnerButtonList = (): Promise<IResponse<any>> => {
  return request.get({
    url: '/v1/message/inner_button'
  })
}

/**
 * 创建内联按钮 - v1接口
 * POST /v1/message/inner_button
 */
export const v1CreateInnerButton = (data: any): Promise<IResponse> => {
  return request.post({
    url: '/v1/message/inner_button',
    data
  })
}

/**
 * 更新内联按钮 - v1接口
 * PUT /v1/message/inner_button
 */
export const v1UpdateInnerButton = (data: any): Promise<IResponse> => {
  return request.put({
    url: '/v1/message/inner_button',
    data
  })
}

/**
 * 删除内联按钮 - v1接口
 * DELETE /v1/message/inner_button/{id}
 */
export const v1DeleteInnerButton = (id: number): Promise<IResponse> => {
  return request.delete({
    url: `/v1/message/inner_button/${id}`
  })
}

/**
 * 获取内联回调操作指令列表 - 仅管理端使用
 */
export const getCallBackListApi = () => {
  return request.get({ url: '/v1/bot/operate-command/list' })
}
