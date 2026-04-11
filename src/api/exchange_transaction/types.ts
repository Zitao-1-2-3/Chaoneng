// ========== 新接口 v2 类型定义 ==========

/**
 * 闪兑订单查询参数 - 新接口 v2
 */
export interface V2ExchangeListParams {
  bot_name?: string // 机器人名称
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  order_id?: string // 订单ID（字符串格式）
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  status?: number // 状态: 1-新订单, 2-已支付, 3-已发送, 4-已回收, 5-已完成, 6-失败订单, 7-已退款, 8-已取消, 9-中止订单
}

/**
 * 闪兑订单列表项 - 新接口 v2
 */
export interface V2ExchangeItem {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number // 支付时间（Unix时间戳-秒）
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
  agent_name?: string // 代理名称
  bot_name?: string // 机器人名称
  bot_user_name?: string // 机器人用户名
  bot_first_name?: string // 机器人昵称
  tg_user_name?: string // TG用户名
  tg_first_name?: string // TG昵称
  in_coin?: string // 输入币种
  out_coin?: string // 输出币种
  out_amount?: string // 输出金额
  real_rate?: string // 实时汇率
  actual_rate?: string // 实际汇率
  agent_profit?: string // 代理利润
  plate_profit?: string // 平台利润
  agent_cost?: string // 代理扣款
  completed_at?: number | null // 完成时间（Unix时间戳-秒）
}

/**
 * 闪兑详情 - 兑换信息
 */
export interface V2ExchangeInfo {
  order_id: string // 订单ID
  in_address: string // 输入地址
  in_amount: string // 输入金额
  in_coin: string // 输入币种
  real_rate: string // 实时汇率
  actual_rate: string // 实际汇率
  out_address: string // 输出地址
  out_amount: string // 输出金额
  out_coin: string // 输出币种
  out_txid: string // 输出交易hash
  out_at: number // 输出时间（Unix时间戳-秒）
  agent_profit: string // 代理利润
  plate_profit: string // 平台利润
}

/**
 * 闪兑详情 - 交易信息
 */
export interface V2TransactionInfo {
  id: string // 交易hash
  from: string // 发送地址
  to: string // 接收地址
  amount: string // 金额
  coin: string // 币种
  height: number // 区块高度
  time: number // 交易时间（Unix时间戳-秒）
  handled: boolean // 是否已处理
}

/**
 * 闪兑订单详情 - 新接口 v2
 */
export interface V2ExchangeDetail {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number // 支付时间（Unix时间戳-秒）
  kind: number // 类型
  status: number // 状态
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 收款地址
  pay_id: string // 支付ID
  cost: string // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_user_name: string // 机器人用户名
  bot_first_name: string // 机器人昵称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG昵称
  agent_cost?: string // 代理扣款
  exchange: V2ExchangeInfo // 兑换信息
  pay_transaction: V2TransactionInfo // 支付交易信息
  deliver_transaction: V2TransactionInfo // 发放交易信息
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
 * 闪兑订单列表响应 - 新接口 v2
 */
export interface V2ExchangeListResponse {
  list: V2ExchangeItem[] // 订单列表
  pager: V2Pager // 分页信息
}

// ========== 旧接口类型定义 ==========

// Type based on the provided JSON response (/v2/manage/exchange_order/list item)
export interface ExchangeOrderListItem {
  id: number // Database ID (for keys, detail/resend calls)
  order_id: string // 订单号
  username: string // 用户名 (TG名?)
  user_id: number // 用户ID
  order_type: number // 1: USDT 兑换 TRX, 2: TRX 兑换 USDT
  order_amount: string // 支付金额 (Decimal as string)
  pay_unit: string // 支付单位 (USDT)
  exchange_amount: string // 用户获得/平台支出 (Decimal as string)
  agent_out_amount: string // 代理扣款 (Decimal as string)
  plate_profit: string // 平台利润 (Decimal as string)
  exchange_unit: string // 兑换单位 (TRX)
  trx_price: string // 计算后汇率 (Decimal as string)
  real_price: string // 实时汇率 (Decimal as string)
  receive_address: string // 用户接收地址
  status: number // 1: 已完成, 2: 失败, 3: 待支付
  create_time: number // 创建时间 (Unix timestamp - seconds)
  finish_time: number // 完成时间 (Unix timestamp - seconds)
  in_txid?: string // Optional 转入交易ID
  out_txid?: string // Optional 转出交易ID
}

// List parameters based on searchable fields in ExchangeOrderListItem
export interface ExchangeOrderListParams {
  pageNo?: number // Or page/pageNum based on backend implementation
  pageSize?: number
  keyword?: string // Add keyword field based on screenshot
  order_id?: string // Keep other fields in case backend supports them alongside keyword
  username?: string
  user_id?: number
  status?: number // 订单状态
  order_type?: number // 订单类型
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // 创建时间范围 (Unix timestamp - seconds)
  end_time?: number // 创建时间范围 (Unix timestamp - seconds)
  // Add other searchable fields if backend supports them
}

// List result structure
export interface ExchangeOrderListResult {
  list: ExchangeOrderListItem[]
  total: number // Assuming 'total' for total count based on common practice
  // Other pagination fields like pageNo, pageSize if returned by API
}

// Type based on the actual /v2/manage/exchange_order/tx_detail/:id response
// This seems to describe the transaction details rather than order summary
export interface ExchangeOrderDetailData {
  id?: number // Database ID
  order_id?: number | string // Order ID (API shows 0, might be string elsewhere)
  in_txid?: string // 转入 TxID
  in_from_address?: string // 转入发送地址
  in_to_address?: string // 转入接收地址
  in_number?: number | string // 转入数量
  in_time?: number // 转入时间 (Unix timestamp - seconds?)
  out_txid?: string // 转出 TxID
  out_from_address?: string // 转出发送地址
  out_to_address?: string // 转出接收地址
  out_time?: number // 转出时间 (Unix timestamp - seconds?)
  user_get_amount?: string // 用户获得数量 (Decimal as string)
  order_amount?: string // 原始订单支付金额 (Decimal as string)
  pay_unit?: string // 原始订单支付单位
  // --- Fields previously expected but MISSING from this API response ---
  // agent_id?: string;
  // agent_name?: string;
  // exchange_type?: string | number;
  // payment_amount?: string | number; // Covered by order_amount
  // payment_unit?: string; // Covered by pay_unit
  // exchange_trx_rate?: string | number;
  // expenditure_trx_amount?: string | number;
  // platform_profit?: string | number;
  // real_time_rate?: string | number;
  // resend_trx?: string | number;
  // receive_address?: string; // Covered by out_to_address?
  // resend_time?: string | number;
  // status?: number | string;
  // agent_deduction?: string | number;
  // operator?: string;
  // complete_time?: string | number; // Covered by out_time?
  // remark?: string;
  // exchange_unit?: string; // Needed to format user_get_amount?
}

// Resend parameters (id should match ExchangeOrderListItem.id)
export interface ResendTrxParams {
  id: number // Use number type
  amount: number | string
  reason: number | string
  remark?: string
}
