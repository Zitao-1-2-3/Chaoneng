// ========== 新接口 v1 类型定义 ==========

/**
 * 机器人列表查询参数
 */
export type BotListParams = {
  current_page?: number // 当前页码
  page_size?: number // 每页数量
  agent_name?: string // 代理名称（搜索）
  keyword?: string // 关键字（搜索）
  status?: number | string // 状态：1-启用，2-禁用
}

/**
 * 机器人列表项
 */
export type BotListItem = {
  id: number | string // 机器人ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  user_name: string // 机器人用户名
  first_name: string // 机器人昵称
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  status: number // 状态：1-启用，2-禁用
  auto_renew: number // 自动续费：1-是，2-否
  expired_at: number // 到期时间（Unix时间戳）
  token: string // 机器人Token
  tg_admin: string // TG管理员
  describe: string // 描述
  total_fee: string // 总费用
  user_count: number // 用户数量
  order_count: number // 订单数量
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
 * 机器人列表响应
 */
export type BotListResponse = {
  list: BotListItem[] // 机器人列表
  pager: Pager // 分页信息
}

/**
 * 机器人详情
 */
export type BotDetail = {
  id: number // 机器人ID
  created_at: string // 创建时间
  updated_at: string // 更新时间
  user_name: string // 机器人用户名
  first_name: string // 机器人昵称
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  status: number // 状态：1-启用，2-禁用
  auto_renew: number // 自动续费：1-是，2-否
  expired_at: string // 到期时间
  token: string // 机器人Token
  tg_admin: string // TG管理员
  describe: string // 描述
  total_fee: number // 总费用
}

/**
 * 代理成本价（系统价格）
 */
export type SystemPrice = {
  id: number // ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  active: string // 激活价格
  time_1h: string // 1小时时间价格
  time_1d: string // 1天时间价格
  time_3d: string // 3天时间价格
  time_7d: string // 7天时间价格
  time_15d: string // 15天时间价格
  time_30d: string // 30天时间价格
  stroke: string // 笔数价格
  stroke_usdt: string // 笔数USDT价格
  flash: string // 闪兑价格
  hosting_65k: string // 托管65k价格
  hosting_131k: string // 托管131k价格
  trx_2_usdt: string // TRX转USDT价格
  usdt_2_trx: string // USDT转TRX价格
  batch_flash: string // 批量闪兑价格
  weal_time_1h: string // 福利1小时价格
  bot_fee: string // 机器人费用
}

/**
 * 机器人价格配置详情（扁平化结构）
 */
export type BotPriceConfig = {
  id: number // 配置ID
  bot_id?: number // 机器人ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  admin_id: number // 管理员ID

  // 批量下单
  active: string // 激活地址单价
  batch_flash: string // 批量下单能量单价

  // 闪租能量
  flash: string

  // 智能托管
  hosting_65k: string // 65000能量
  hosting_131k: string // 131000能量

  // 笔数能量
  stroke: string // 笔数能量TRX
  stroke_usdt: string // 笔数能量USDT

  // 时间能量
  time_1h: string // 1小时租赁
  time_1d: string // 1天租赁
  time_3d: string // 3天租赁
  time_7d: string // 7天租赁
  time_15d: string // 15天租赁
  time_30d: string // 30天租赁

  // 闪兑配置
  trx_2_usdt: string // TRX兑USDT利润（小数形式，如 "0.15" 表示 15%）
  usdt_2_trx: string // USDT兑TRX利润（小数形式，如 "0.15" 表示 15%）
  min_trx_balance: string // 最低账号余额
  max_trx_2_usdt: string // TRX兑USDT可兑换上限
  max_usdt_2_trx: string // USDT兑TRX可兑换上限

  // 福利板块
  weal_time_1h: string // 福利能量
  weal_hour_limit?: string // 每小时购买限制
  weal_total_limit?: string // 总购买限制

  // 其他配置
  bot_fee: string // 机器人费用（暂未使用）
  allow_pledge?: boolean // 是否允许质押
  notice_status?: number // 通知状态
}

/**
 * Address 列表查询参数
 */
export type AddressListParams = {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  keyword?: string // 关键字（搜索）
  kind?: number // 类型：1-代理充值, 2-用户充值, 3-兑换(TRX-USDT), 4-时间能量(闪租), 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  page_size?: number // 每页数量
}

/**
 * Address 列表项
 */
export type AddressListItem = {
  id: number // 地址ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  address: string // 地址
  kind: number | string // 类型：1-代理充值, 2-用户充值, 3-兑换(TRX-USDT), 4-时间能量(闪租), 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费（可能是数字或字符串）
  bot_id: number // 机器人ID
  agent_id: number // 代理ID
  created_by: string // 创建者
  agent_name: string // 代理名称
  email: string // 邮箱
}

/**
 * Address 列表响应
 */
export type AddressListResponse = {
  list: AddressListItem[] // 地址列表
  pager: Pager // 分页信息
}

/**
 * 绑定地址请求参数
 */
export type BindAddressParams = {
  address: string // 地址（必填）
  bot_id: number // 机器人ID（必填）
  kind: number // 类型（必填）：1-代理充值, 2-用户充值, 3-兑换, 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
}

/**
 * 更新机器人请求参数
 */
export type UpdateBotParams = {
  id: number | string // 机器人ID（必填）
  auto_renew?: number // 自动续费：1-是，2-否
  describe?: string // 描述
  status?: number // 状态：1-启用，2-禁用
  tg_admin?: string // TG管理员
}

/**
 * 更新机器人价格配置请求参数（扁平化结构）
 */
export type UpdateBotPriceParams = {
  id: number | string // 配置ID（必填）
  bot_id?: number | string // 机器人ID（可选）
  created_at?: string // 创建时间
  updated_at?: string // 更新时间

  // 批量下单
  active?: number // 激活地址单价
  batch_flash?: number // 批量下单能量单价

  // 闪租能量
  flash?: number

  // 智能托管
  hosting_131k?: number // 131000能量
  hosting_65k?: number // 65000能量

  // 笔数能量
  stroke?: number // 笔数能量TRX
  stroke_usdt?: number // 笔数能量USDT

  // 时间能量
  time_15d?: number // 15天租赁
  time_1d?: number // 1天租赁
  time_1h?: number // 1小时租赁
  time_30d?: number // 30天租赁
  time_3d?: number // 3天租赁
  time_7d?: number // 7天租赁

  // 闪兑配置
  trx_2_usdt?: number // TRX兑USDT利润（小数形式，如 0.15 表示 15%）
  usdt_2_trx?: number // USDT兑TRX利润（小数形式，如 0.15 表示 15%）
  min_trx_balance?: number // 最低账号余额
  max_trx_2_usdt?: number // TRX兑USDT可兑换上限
  max_usdt_2_trx?: number // USDT兑TRX可兑换上限

  // 福利板块
  weal_time_1h?: number // 福利能量
  weal_hour_limit?: number // 每小时购买限制
  weal_total_limit?: number // 总购买限制

  // 其他配置
  allow_pledge?: boolean // 是否允许质押
  notice_status?: number // 通知状态
  bot_fee?: number // 机器人费用（暂未使用）
}

/**
 * 机器人续费请求参数
 */
export type RenewBotParams = {
  id: number | string // 机器人ID（必填）
  month_num: number // 续费月数（必填）
}

/**
 * 机器人续费价格响应
 */
export type BotRenewPrice = {
  amount: string // 续费价格（每月）
}

/**
 * 创建机器人请求参数
 */
export type CreateBotParams = {
  agent_id: number // 代理ID（必填）
  describe: string // 描述（必填）
  status: number // 状态：1-启用，2-禁用（必填）
  tg_admin: string // TG管理员（必填）
  token: string // 机器人Token（必填）
}

/**
 * 代理账单列表查询参数
 */
export type AgentBillListParams = {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  coin?: string // 币种
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kinds?: number[] // 类型数组：1, 2, 3
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  user_id?: number // 用户ID
}

/**
 * 代理账单列表项
 */
export type AgentBillListItem = {
  order_id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳）
  kind: number // 类型：1, 2, 3
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  balance: string // 余额
  coin: string // 币种（如 "TRX"）
  profit: string // 利润
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
}

/**
 * 代理账单列表响应
 */
export type AgentBillListResponse = {
  list: AgentBillListItem[] // 账单列表
  pager: Pager // 分页信息
}
