// ========== 托管列表类型定义 ==========

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
 * 托管列表查询参数 - 新接口 v1
 */
export interface HostingListParamsV1 {
  address?: string // 地址
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
  user_id?: number // 用户ID
  origin?: number // 来源（1=机器人，2=H5）
  order?: string // 排序参数
}

/**
 * 托管列表项 - 新接口 v1
 */
export interface HostingItemV1 {
  id: number // 托管ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  address: string // 托管地址
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  user_id: number // 用户ID
  order_id: string // 订单ID
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // 用户名
  user_account?: string // 用户账号
  user_email?: string // 用户邮箱
  origin?: number // 来源（1=机器人，2=H5）
}

/**
 * 托管列表响应 - 新接口 v1
 */
export interface HostingListResponseV1 {
  list: HostingItemV1[] // 托管列表
  pager: Pager // 分页信息
}

/**
 * 删除托管地址请求参数 - 新接口 v1
 */
export interface RemoveHostingParamsV1 {
  address: string // 托管地址（必填）
}

// ========== 旧类型定义 ==========

export interface BotOption {
  label: string
  value: any
}

export interface AutoManageAddressListParams {
  current_page: number
  page_size: number
  tg_bot_id?: number | string // 筛选机器人
  address?: string // 托管地址关键词
  // 根据实际情况添加其他搜索参数
}

export interface AutoManageAddressItem {
  id: number // 记录ID，用于删除
  manage_record_id?: number // (似乎是内部关联ID，列表可能不需要直接显示)
  order_id?: string // (来自示例数据，但不确定是否在列表中显示)
  tg_id?: number // 用户TG ID
  tg_bot_id: number // 机器人TG ID
  bot_id?: number // 机器人ID（新接口字段）
  address: string // 托管地址
  from_address?: string // (来自示例数据)
  txid?: string // (来自示例数据)
  energy_num?: number // (来自示例数据)
  energy_rent_time?: number // (来自示例数据)
  energy_rent_text?: string // (来自示例数据)
  order_amount?: string // (来自示例数据)
  pay_amount?: string // (来自示例数据)
  pay_unit?: string // (来自示例数据)
  status?: number // (来自示例数据，但不确定是否在列表中显示，截图中没有)
  manage_status?: number // (来自示例数据)
  create_time: number | string // 创建时间 (秒级时间戳或字符串)
  finish_time?: number | string // 完成/更新时间 (秒级时间戳或字符串)
  describe?: string // (来自示例数据)
  delegate_balance?: number // (来自示例数据)
  recycle_time?: number // (来自示例数据)
  recycle_txid?: string // (来自示例数据)
  handle_status?: number // (来自示例数据)
  delegate_status?: number // (来自示例数据)
  used_energy_num?: number // (来自示例数据)
  nickname?: string // 用户昵称 (来自示例数据 tg_name 或 nickname)
  tg_name?: string // 用户TG名 (来自示例数据)
  user_name?: string // 用户名（新接口字段 - 对应后端 user_name）
  tg_user_name?: string // TG用户名（新接口字段）
  bot_name?: string // 机器人用户名
  user_account?: string // 用户账号
  user_email?: string // 用户邮箱
  origin?: number // 来源（1=机器人，2=H5）
}
