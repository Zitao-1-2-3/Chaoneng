/**
 * Bot Menu API Types
 * 代理端机器人菜单接口类型定义
 */

/**
 * 菜单项
 */
export interface BotMenuItem {
  id: number
  created_at: number
  updated_at: number
  agent_id: number
  bot_id: number
  menu_name: string
  order_num: number
  status: number // 1=启用, 2=禁用
}

/**
 * 获取菜单列表 - 请求参数
 * GET /v1/bot/menu
 */
export interface GetBotMenuListParams {
  agent_id?: number
  bot_id: number // required
  status?: number // 1=启用, 2=禁用
}

/**
 * 获取菜单列表 - 响应数据
 * 注意：data 字段直接是菜单数组
 */
export type GetBotMenuListResponse = BotMenuItem[]

/**
 * 添加菜单 - 请求参数
 * POST /v1/bot/menu
 */
export interface AddBotMenuParams {
  menu_name: string
  order_num: number
  status: number // 1=启用, 2=禁用
}

/**
 * 更新菜单 - 请求参数（单个菜单项）
 */
export interface UpdateBotMenuItemParams {
  id: number
  menu_name: string
  order_num: number
  status: number
}

/**
 * 批量更新菜单 - 请求参数
 * PUT /v1/bot/menu
 */
export interface BatchUpdateBotMenuParams {
  bot_id: number
  menus: UpdateBotMenuItemParams[]
}
