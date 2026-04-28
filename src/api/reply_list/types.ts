// ========== 关键词回复类型定义 ==========

// ========== 新类型定义 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 关键词回复列表查询参数 - 新接口 v1
 */
export interface ReplyListParamsV1 {
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  key_name?: string // 关键词名称
  keyword?: string // 关键字
  page_size?: number // 每页大小
  status?: number // 状态
  order?: string // 排序参数
}

/**
 * 关键词回复列表项 - 新接口 v1
 */
export interface ReplyItemV1 {
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  content: string // 回复内容
  created_at: string // 创建时间
  id: number // 回复ID
  key_name: string // 关键词名称
  show_command: number // 显示命令
  status: number // 状态
  updated_at: string // 更新时间
}

/**
 * 关键词回复列表响应 - 新接口 v1
 */
export interface ReplyListResponseV1 {
  list: ReplyItemV1[] // 关键词回复列表
  pager: Pager // 分页信息
}

/**
 * 创建关键词回复请求参数 - 新接口 v1
 */
export interface CreateReplyParamsV1 {
  bot_id: number // 机器人ID（必填）
  content: string // 回复内容
  key_name: string[] // 关键词名称数组（必填）
  status: number // 状态（必填）
}

/**
 * 更新关键词回复请求参数 - 新接口 v1
 */
export interface UpdateReplyParamsV1 {
  content: string // 回复内容
  id: number // 回复ID（必填）
  status: number // 状态（必填）
}

/**
 * 删除关键词回复请求参数 - 新接口 v1
 */
export interface DeleteReplyParamsV1 {
  id: number // 回复ID（必填）
}

// ========== 旧类型定义 ==========

// 关键词回复项类型
export interface ReplyItem {
  id: number // from backend: id
  tg_bot_id: number // from backend: tg_bot_id
  bot_name: string // from backend: name (for bot_username display)
  key_name: string // from backend: key_name (for keyword display)
  content?: string // from backend: content
  status: number // from backend: status
  create_time: number // from backend: create_time (timestamp)
  update_time: number // from backend: update_time (timestamp)

  // These fields are used by the form/table logic and will be populated from the fields above
  // or are specific to frontend state. They might not directly map to a single backend field on GET.
  bot_id?: string | number // Used by form, will be tg_bot_id. Keep for compatibility or map.
  keyword?: string // Used by form, will be key_name. Keep for compatibility or map.
  bot_username?: string // Used by table display, will be bot_name

  // Original fields kept for reference or if other parts of app use them, but primary data comes from above
  type?: number
  reply_category?: string
  command_action?: string
  menu_ids?: number[]
  inline_menu_ids?: number[]
  command?: string
  [key: string]: any
}

// 获取关键词回复列表的API参数类型
export interface ReplyListParams {
  current_page?: number
  page_size?: number
  bot_id?: string
  keyword?: string
  status?: number
  type?: number // Corresponds to ReplyItem.type for filtering
  [key: string]: any
}

// 保存关键词回复的API参数类型 (用于新增和编辑 - SIMPLIFIED based on new dialog)
export interface ReplySaveParams {
  id?: number // For edit mode
  tg_bot_id: number // Changed from string to number
  key_name: string[] // Changed from keyword: string
  content?: string // 回复内容 from the new dialog
  status: number // 状态 from the new dialog
  // Fields like 'type', 'reply_category', 'command_action', 'menu_ids', 'inline_menu_ids', 'command' (string version)
  // are NOT part of the new simplified dialog and thus not directly in its save parameters.
  // If the backend requires them for save/update, they must be handled differently (e.g., defaults or fetched separately if editing).
}

// 机器人选项类型
export interface BotOption {
  label: string
  value: string | number // Allow number for value if API returns it, component will handle
}
