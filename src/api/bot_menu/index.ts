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
