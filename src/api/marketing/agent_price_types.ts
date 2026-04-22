// ========== 系统价格参数相关类型定义（新接口 v2）==========
// 代理价格配置相关类型定义
// 系统价格参数查询参数 - v2
export interface V2SystemPriceParams {
  kind: number // 类型: 1-11 (具体含义待确认)
}

// 系统价格参数响应数据 - v2（字符串格式）
export interface V2SystemPriceResponse {
  id: number
  created_at: number // Unix时间戳
  updated_at: number // Unix时间戳
  active: string | number // 是否激活
  time_1h: string | number // 按时间-1小时价格
  time_1d: string | number // 按时间-1天价格
  time_3d: string | number // 按时间-3天价格
  time_7d: string | number // 按时间-7天价格
  time_15d: string | number // 按时间-15天价格
  time_30d: string | number // 按时间-30天价格
  stroke: string | number // 按笔数价格
  flash: string | number // 闪租价格
  hosting_65k: string | number // 托管65k价格
  hosting_131k: string | number // 托管131k价格
  trx_2_usdt: string | number // 闪兑-TRX兑换USDT费率（小数，显示时需乘以100）
  usdt_2_trx: string | number // 闪兑-USDT兑换TRX费率（小数，显示时需乘以100）
  bot_fee: string | number // 机器人价格
  batch_flash: string | number // 批量下单价格
}

// 系统价格参数更新参数 - v2
export interface V2UpdateSystemPriceParams {
  id: number // 必须：记录ID
  // 以下字段为可选，只传需要修改的字段
  active?: string | number
  time_1h?: string | number // 按时间-1小时价格
  time_1d?: string | number // 按时间-1天价格
  time_3d?: string | number // 按时间-3天价格
  time_7d?: string | number // 按时间-7天价格
  time_15d?: string | number // 按时间-15天价格
  time_30d?: string | number // 按时间-30天价格
  stroke?: string | number // 按笔数价格
  flash?: string | number // 闪租价格
  hosting_65k?: string | number // 托管65k价格
  hosting_131k?: string | number // 托管131k价格
  trx_2_usdt?: string | number // 闪兑-TRX兑换USDT费率（小数，保存时需除以100）
  usdt_2_trx?: string | number // 闪兑-USDT兑换TRX费率（小数，保存时需除以100）
  bot_fee?: string | number // 机器人价格
  batch_flash?: string | number // 批量下单价格
}

// ========== 旧的类型定义 ==========

// 类型定义 - 可以根据实际后端返回进行调整
export interface AgentPriceVO {
  id: number
  // price_type: 1:闪租, 2:托管, 3:按笔数, 4:闪兑, 5:按天数, 6:首次激活 (更新注释)
  price_type: number
  price_trx: number // 用于多种类型：托管价格/笔, 闪兑费率(T-U)(%), 闪租/按笔数价格/笔, 首次激活单价
  price_usdt?: number // 闪兑 - TRX兑USDT的费率(%)
  price_trx_65000: number // 托管 - 65000能量价格(TRX)
  price_trx_131000: number // 托管 - 131000能量价格(TRX)
  price_day_1: number // 按天数 - 1天价格(TRX)
  price_day_3: number // 按天数 - 3天价格(TRX)
  price_day_7: number // 按天数 - 7天价格(TRX)
  price_day_15: number // 按天数 - 15天价格(TRX)
  price_day_30?: number // 按天数 - 30天价格(TRX)
  // status: number // 1: 启用, 2: 禁用
  creator_name?: string
  create_time?: string
  update_time?: string
}

// 新增价格配置参数
export interface AddPriceParams {
  // price_type: 1:闪租, 2:托管, 3:按笔数, 4:闪兑, 5:按天数, 6:首次激活 (更新注释)
  price_type: number
  price_trx?: number
  price_usdt?: number // 闪兑 - TRX兑USDT的费率(%)
  price_trx_65000?: number
  price_trx_131000?: number
  price_day_1?: number
  price_day_3?: number
  price_day_7?: number
  price_day_15?: number
  price_day_30?: number
  // status: number // 1: 启用, 2: 禁用
}

// 更新价格配置参数
export interface UpdatePriceParams extends AddPriceParams {
  id: number
}
