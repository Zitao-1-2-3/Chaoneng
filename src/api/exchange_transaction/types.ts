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
