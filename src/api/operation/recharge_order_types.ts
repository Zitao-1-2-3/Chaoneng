/**
 * 充值订单相关类型定义
 */

// ========== 新接口 v2 类型定义 ==========

/**
 * 充值订单查询参数 - 新接口 v2
 */
export interface V2DepositListParams {
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kind?: number // 类型: 1-代理充值, 2-用户充值, 3-兑换, 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  order_id?: string // 订单ID（字符串格式）
  page_size?: number // 每页大小
  pay_address?: string // 支付地址
  receive_address?: string // 收款地址
  start_time?: string // 开始时间
  status?: number // 状态
  source?: string // 来源
}

/**
 * 充值订单列表项 - 新接口 v2
 */
export interface V2DepositItem {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  paid_at: number | null // 支付时间（Unix时间戳）
  kind: number // 类型: 1-代理充值, 2-用户充值, 3-兑换, 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  status: number // 状态: 1-新订单, 2-已支付, 3-已发送, 4-已回收, 5-已完成, 6-失败订单, 7-已退款, 8-已取消, 9-中止订单
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种: TRX, USDT
  receive_address: string // 收款地址
  pay_id: string // 支付ID
  cost: string // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG名字
  pay_address: string // 支付地址
  username?: string // 用户账号
  email?: string // 用户邮箱
  origin?: number // 来源（1=机器人，2=H5）
}

/**
 * 分页信息 - 新接口 v2
 */
export interface V2Pager {
  current_page: number // 当前页码
  page_size: number // 每页大小
  total: number // 总数
}

/**
 * 充值订单列表响应 - 新接口 v2
 */
export interface V2DepositListResponse {
  list: V2DepositItem[] // 订单列表
  pager: V2Pager // 分页信息
}

/**
 * 充值订单详情 - 新接口 v2
 */
export interface V2DepositDetail {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  paid_at: number // 支付时间（Unix时间戳）
  kind: number // 类型: 1-代理充值, 2-用户充值, 3-兑换, 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  status: number // 状态: 1-新订单, 2-已支付, 3-已发送, 4-已回收, 5-已完成, 6-失败订单, 7-已退款, 8-已取消, 9-中止订单
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种: TRX, USDT
  receive_address: string // 收款地址
  pay_id: string // 支付ID
  cost: string // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG名字
  pay_transaction: V2PayTransaction | null // 支付交易信息
  username?: string // 用户账号
  email?: string // 用户邮箱
  origin?: number // 来源（1=机器人，2=H5）
}

/**
 * 支付交易信息 - 新接口 v2
 */
export interface V2PayTransaction {
  id: string // 交易ID（哈希）
  from: string // 支付地址
  to: string // 收款地址
  amount: string // 交易金额
  coin: string // 币种
  height: number // 区块高度
  time: number // 交易时间（Unix时间戳）
  handled: boolean // 是否已处理
}

/**
 * 充值订单详情响应 - 新接口 v2
 */
export interface V2DepositDetailResponse {
  data: V2DepositDetail
}

// ========== 旧接口类型定义 ==========

// ========== 旧接口类型定义 ==========

/**
 * 分页参数
 */
export interface PageParam {
  page_size?: number // 每页大小
  current_page?: number // 当前页码
}

/**
 * 充值订单查询参数 - 旧接口
 */
export interface RechargeOrderQueryParams extends PageParam {
  query?: string // 关键字搜索 (代理信息/TG用户名等)
  order_id?: string // 订单号
  status?: number // 订单状态
  order_type?: number // 订单类型
  receive_address?: string // 收款地址
  pay_address?: string // 支付地址
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
  sort?: string // 排序字段
  order?: string // 排序方式
  sort_by?: string // 排序字段（转换后）
}

/**
 * 充值订单列表项 - 旧接口
 */
export interface RechargeOrderItem {
  id: number
  order_id: string // 订单号
  user_name: string // 代理名称
  tg_id: string // TG用户ID
  tg_name: string // TG用户名
  tg_nickname: string // TG用户昵称
  bot_id: number // 机器人ID
  bot_name: string // 机器人名称
  order_type: number // 订单类型: 1-充值TRX, 2-充值USDT
  in_mount: string // 充值金额
  in_unit: string // 充值单位
  pay_mount: string // 支付金额
  pay_unit: string // 支付单位
  status: number // 订单状态: 1-已完成, 2-待支付, 3-已取消
  receive_address: string // 收款地址
  pay_address: string // 支付地址
  describe: string // 备注
  create_time: number // 创建时间（时间戳）
  pay_time?: number // 支付时间（时间戳）
  finish_time?: number // 完成时间（时间戳）
}

/**
 * 充值订单详情 - 订单信息
 */
export interface RechargeOrderDetail {
  order_num: string // 订单号
  status: number // 订单状态
  statusText?: string // 订单状态文本（前端添加）
  order_type: number // 订单类型
  tg_id: string // TG用户ID
  tg_name: string // TG用户名
  tg_nickname: string // TG用户昵称
  bot_id: number // 机器人ID
  bot_name: string // 机器人名称
  in_mount: string // 充值金额
  in_unit: string // 充值单位
  pay_mount: string // 支付金额
  pay_unit: string // 支付单位
  describe: string // 备注
  create_time: number // 创建时间
  pay_time?: number // 支付时间
  finish_time?: number // 完成时间
}

/**
 * 充值订单详情 - 充值信息
 */
export interface RechargeDetail {
  to_address: string // 收款地址
  owner_address: string // 支付地址
  hash: string // 交易哈希
}

/**
 * 充值订单详情响应
 */
export interface RechargeOrderDetailResponse {
  order_info: RechargeOrderDetail
  recharge_info: RechargeDetail
}
