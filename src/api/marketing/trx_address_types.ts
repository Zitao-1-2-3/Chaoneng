/**
 * 运营端收款配置 - 类型定义
 */

/**
 * 获取地址列表 - 查询参数
 */
export interface V2AddressListParams {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  kind?: number // 类型：1-11（具体含义待确认）
  page_size?: number // 每页大小
}

/**
 * 地址列表项
 */
export interface V2AddressItem {
  id: number // 地址ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  address: string // TRX地址
  kind: number // 类型
  bot_id: number // 机器人ID
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  email: string // 代理邮箱
  created_by: string // 创建人
}

/**
 * 分页信息
 */
export interface V2Pager {
  current_page: number // 当前页码
  page_size: number // 每页大小
  total: number // 总数
}

/**
 * 地址列表响应
 */
export interface V2AddressListResponse {
  list: V2AddressItem[] // 地址列表
  pager: V2Pager // 分页信息
}

/**
 * 创建地址 - 请求参数
 */
export interface V2CreateAddressParams {
  kind?: number // 类型：1-代理充值, 2-用户充值, 等
  list: string[] // 地址列表
}

/**
 * 更新地址 - 请求参数（用于绑定/解绑）
 */
export interface V2UpdateAddressParams {
  address: string // 地址
  agent_id: number // 代理ID（解绑时为0）
  bot_id: number // 机器人ID
  created_at: string // 创建时间
  created_by: string // 创建人
  id: number // 地址ID
  kind: number // 类型
  updated_at: string // 更新时间
}

/**
 * 删除地址 - 请求参数
 */
export interface V2DeleteAddressParams {
  list: string[] // 要删除的地址列表
}

/**
 * 未绑定代理列表项
 */
export interface V2UnboundAgent {
  id: number // 代理ID
  username: string // 代理名称
  email: string // 代理邮箱
}

/**
 * 未绑定代理列表响应
 */
export interface V2UnboundAgentsResponse {
  list: V2UnboundAgent[] // 代理列表
  pager: V2Pager // 分页信息
}
