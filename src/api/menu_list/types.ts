// ========== 机器人菜单类型定义 ==========

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
 * 机器人菜单列表查询参数 - 新接口 v1
 */
export interface MenuListParamsV1 {
  agent_id?: number // 代理ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  menu_type?: number // 菜单类型
  page_size?: number // 每页大小
  status?: number // 状态
}

/**
 * 机器人菜单列表项 - 新接口 v1
 */
export interface MenuItemV1 {
  id: number // 菜单ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  agent_id: number // 代理ID
  menu_name: string // 菜单名称
  menu_type: number // 菜单类型:1菜单 2内联按钮
  order_num: number // 排序
  status: number // 状态：1=启用，2=禁用
  create_type: number // 创建类型
  inner_type: string // 内联类型 url/call
  inner_value: string // 内联值
  other: string // 其他信息
  callback_type: string // 回调类型
}

/**
 * 机器人菜单列表响应 - 新接口 v1
 */
export interface MenuListResponseV1 {
  list: MenuItemV1[] // 菜单列表
  pager: Pager // 分页信息
}

/**
 * 内联按钮项（简化版）
 */
export interface InnerButtonItem {
  id: number // 按钮ID
  agent_id: number // 代理ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  inner_type: string // 内联类型 url/call
  inner_value: string // 内联值
  text: string // 按钮文本
  status?: number // 状态：1=启用，2=禁用
}

/**
 * 内联按钮列表响应（无分页）
 * GET /v1/message/inner_button
 */
export type InnerButtonListResponse = InnerButtonItem[]

/**
 * 添加机器人菜单请求参数 - 新接口 v1
 */
export interface AddMenuParamsV1 {
  callback_type?: string // 回调类型
  inner_type: string // 内联类型
  inner_value: string // 内联值
  menu_name: string // 菜单名称（必填）
  menu_type: number // 菜单类型（必填）
  order_num: number // 排序（必填）
  status: number // 状态（必填）
}

/**
 * 更新机器人菜单请求参数 - 新接口 v1
 */
export interface UpdateMenuParamsV1 {
  callback_type?: string // 回调类型
  id: number // 菜单ID（必填）
  inner_type: string // 内联类型
  inner_value: string // 内联值
  menu_name: string // 菜单名称（必填）
  menu_type: number // 菜单类型（必填）
  order_num: number // 排序（必填）
  status: number // 状态（必填）
}

/**
 * 创建内联按钮请求参数
 * POST /v1/message/inner_button
 */
export interface CreateInnerButtonParams {
  agent_id?: number // 代理ID（可选）
  created_at?: string // 创建时间（可选）
  id?: number // 按钮ID（可选，创建时为0）
  inner_type: string // 内联类型 url/call
  inner_value: string // 内联值
  text: string // 按钮文本
  updated_at?: string // 更新时间（可选）
}

/**
 * 更新内联按钮请求参数
 * PUT /v1/message/inner_button
 */
export interface UpdateInnerButtonParams {
  agent_id?: number // 代理ID（可选）
  created_at?: string // 创建时间（可选）
  id: number // 按钮ID（必填）
  inner_type: string // 内联类型 url/call
  inner_value: string // 内联值
  text: string // 按钮文本
  updated_at?: string // 更新时间（可选）
}

// ========== 旧类型定义 ==========

// 定义内联回调类型
export interface InnerCallback {
  id: number
  callback_type: string
  name: string
  status: number
}

// 定义菜单项接口
export interface MenuItem {
  id: number
  user_id?: number
  menu_name: string
  menu_type: number // 菜单类型:1菜单 2内联按钮
  order_num: number // 排序
  status: number // 状态：1=启用，2=禁用
  create_type?: number
  inner_type: string // 内联类型 url/call 菜单为内联时必须选择
  inner_value?: string // 根据inner_type判断: url时为链接地址，call时为回调函数名称
  callback_type?: string // 回调类型
  // 前端特有字段
  span?: number
  text?: string // 用于显示
  _fromEnabled?: boolean // 拖拽标记：是否从启用区域拖拽
  _fromDisabled?: boolean // 拖拽标记：是否从禁用区域拖拽
}

// 菜单布局类型 - 二维数组，用于拖拽排序
export type MenuLayout = (MenuItem | null)[][]
