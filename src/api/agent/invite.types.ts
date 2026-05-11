// ==================== 邀请列表接口类型定义 ====================

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 邀请记录列表查询参数
 */
export interface InviteListQueryParams {
  current_page?: number // 页码
  page_size?: number // 每页大小
  keyword?: string // 关键字搜索（受邀人ID/受邀人/邀请人/代理名称/机器人用户名）
  bot_id?: number // 机器人ID筛选
  start_time?: number // 开始时间（Unix时间戳-秒）
  end_time?: number // 结束时间（Unix时间戳-秒）
  order?: string // 排序参数，格式：字段名 ASC/DESC
}

/**
 * 邀请记录列表项
 */
export interface InviteRecordItem {
  id: string // 邀请记录ID
  invitee_id: string // 受邀人ID
  invitee_name: string // 受邀人名称
  promo_bot_name: string // 推广机器人用户名
  inviter_name: string // 邀请人名称
  agent_name: string // 代理名称
  promo_link: string // 推广链接
  reward_amount: number // 奖励金额
  created_at: number // 创建时间（Unix时间戳-秒）
}

/**
 * 邀请记录列表响应数据
 */
export interface InviteListResponse {
  list: InviteRecordItem[]
  pager?: Pager
  total?: number // 兼容不同的分页格式
}

/**
 * 机器人选项（用于下拉选择）
 */
export interface BotOption {
  label: string // 显示文本
  value: string // 机器人ID
}
