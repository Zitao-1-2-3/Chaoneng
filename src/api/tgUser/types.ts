// ========== 用户列表类型定义 ==========

// ========== 新类型定义 v1 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 用户列表查询参数 - 新接口 v1
 */
export interface UserListParamsV1 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  status?: number // 状态
}

/**
 * 用户列表项 - 新接口 v1
 */
export interface UserItemV1 {
  id: number // 用户ID
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
  bot_id: number // 机器人ID
  tg_user_id: number // TG用户ID
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  agent_id: number // 代理ID
  trx_balance: string // TRX余额
  usdt_balance: string // USDT余额
  last_address: string // 最后地址
  address_list: string[] // 地址列表
  lang: string // 语言
  status: number // 状态
}

/**
 * 用户列表响应 - 新接口 v1
 */
export interface UserListResponseV1 {
  list: UserItemV1[] // 用户列表
  pager: Pager // 分页信息
}

/**
 * 用户充值请求参数 - 新接口 v1
 */
export interface RechargeUserParamsV1 {
  amount: number // 充值金额（必填）
  coin: string // 币种（必填，如 "TRX" 或 "USDT"）
  describe: string // 描述（必填）
  user_id: number // 用户ID（必填）
}

/**
 * 群发消息列表查询参数 - 新接口 v1
 */
export interface MassSendListParamsV1 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
  status?: number // 状态
}

/**
 * 群发消息键盘按钮
 */
export interface MassSendKeyboard {
  additionalProp1?: string
  additionalProp2?: string
  additionalProp3?: string
}

/**
 * 群发消息列表项 - 新接口 v1
 */
export interface MassSendItemV1 {
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  content: string // 消息内容
  created_at: string // 创建时间
  fail_num: number // 失败数量
  id: number // 消息ID
  image: string // 图片
  keyboards: MassSendKeyboard[] // 键盘按钮
  ok_num: number // 成功数量
  percent: number // 百分比
  receive_type: string // 接收类型
  status: number // 状态
  tg_user_ids: string // TG用户ID列表
  updated_at: string // 更新时间
}

/**
 * 群发消息列表响应 - 新接口 v1
 */
export interface MassSendListResponseV1 {
  list: MassSendItemV1[] // 群发消息列表
  pager: Pager // 分页信息
}

/**
 * 删除群发消息请求参数 - 新接口 v1
 */
export interface DeleteMassSendParamsV1 {
  id: number // 消息ID（必填）
}

/**
 * 群发消息请求参数 - 新接口 v1
 */
export interface SendGroupMessageParamsV1 {
  bot_id: number // 机器人ID（必填）
  content: string // 消息内容（必填）
  image?: string // 图片URL（可选）
  keyboards?: any[] // 键盘按钮（可选）
  receive_type: string // 接收类型（必填，如 "user_custom", "all_user", "one_user"）
  tg_user_ids?: number[] // TG用户ID列表（可选，当 receive_type 为 "user_custom" 时必填）
}

/**
 * 发送单个消息请求参数 - 新接口 v1
 */
export interface SendMessageParamsV1 {
  content: string // 消息内容（必填）
  keyboards?: any[] // 键盘按钮（可选）
  user_id: number // 用户ID（必填）
}

/**
 * 用户账单类型枚举
 */
export enum UserBillKind {
  KindAgentDeposit = 1, // 代理充值（地址由运营用户管理）
  KindUserDeposit = 2, // 用户充值
  KindExchange = 3, // 兑换（TRX-USDT）
  KindTimeEnergy = 4, // 时间能量（闪租能量，1小时有效的）
  KindStrokeEnergy = 5, // 笔数能量（长期有效的，每天不用额外扣一笔，一次发放两笔，用完再补）
  KindWealEnergy = 6, // 福利能量（打折的时间能量，有购买限制）
  // 以下的类别暂不支持绑定快速购买地址
  KindFlashEnergy = 7, // 快速能量（快速租用，1小时有效的，用了会提前回收）
  KindHosting = 8, // 自动托管（一次发放两笔）
  KindBatchEnergy = 9, // 批量能量（带自动激活）
  KindBatchActive = 10, // 批量激活
  KindBotFee = 11 // 机器人付费
}

/**
 * 用户账单列表查询参数 - 新接口 v1
 */
export interface UserBillListParamsV1 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  coin?: string // 币种（TRX, USDT）
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kinds?: number[] // 账单类型数组（1-11，参考 UserBillKind 枚举）
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  user_id?: number // 用户ID
}

/**
 * 用户账单列表项 - 新接口 v1
 */
export interface UserBillItemV1 {
  agent_id: number // 代理ID
  amount: string // 金额
  balance: string // 余额
  bot_id: number // 机器人ID
  coin: string // 币种
  created_at: number // 创建时间（时间戳）
  describe: string // 描述
  kind: number // 账单类型（参考 UserBillKind 枚举）
  order_id: string // 订单ID
  user_id: number // 用户ID
}

/**
 * 用户账单列表响应 - 新接口 v1
 */
export interface UserBillListResponseV1 {
  list: UserBillItemV1[] // 账单列表
  pager: Pager // 分页信息
}

// ========== 旧类型定义 ==========

/**
 * 定义用户余额记录请求参数类型
 */
export interface UserBalanceRecordParams {
  current_page?: number
  page_size?: number
  unit?: 'TRX' | 'USDT' | ''
  change_type?: 'in' | 'out' | ''
}
