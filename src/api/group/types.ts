/**
 * 群组列表查询参数
 */
export type GroupListParams = {
  current_page?: number // 当前页码
  page_size?: number // 每页数量
  keyword?: string // 关键字（群组ID/群组名称/机器人AID）
  bot_type?: number | string // 机器人类型
  start_time?: string // 开始时间
  end_time?: string // 结束时间
}

/**
 * 群组列表项
 */
export type GroupListItem = {
  id: number // 群组记录ID
  group_id: string // 群组ID
  group_name: string // 群组名称
  bot_username: string // 机器人用户名
  bot_aid: string // 机器人AID
  bot_nickname: string // 机器人昵称
  member_count: number // 群人数
  group_link: string // 群链接
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  status: number // 状态：1-启用，2-禁用
}

/**
 * 分页信息
 */
export type Pager = {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 群组列表响应
 */
export type GroupListResponse = {
  list: GroupListItem[] // 群组列表
  pager: Pager // 分页信息
}

/**
 * 更新群组状态请求参数
 */
export type UpdateGroupStatusParams = {
  id: number // 群组记录ID（必填）
  status: number // 状态：1-启用，2-禁用（必填）
}

/**
 * 发送群组消息请求参数
 */
export type SendGroupMessageParams = {
  group_id: string // 群组ID（必填）
  message: string // 消息内容（必填）
  bot_id?: number // 机器人ID（可选）
}
