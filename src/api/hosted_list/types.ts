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
  create_time: number // 创建时间 (秒级时间戳)
  finish_time?: number // 完成/更新时间 (秒级时间戳)
  describe?: string // (来自示例数据)
  delegate_balance?: number // (来自示例数据)
  recycle_time?: number // (来自示例数据)
  recycle_txid?: string // (来自示例数据)
  handle_status?: number // (来自示例数据)
  delegate_status?: number // (来自示例数据)
  used_energy_num?: number // (来自示例数据)
  nickname?: string // 用户昵称 (来自示例数据 tg_name 或 nickname)
  tg_name?: string // 用户TG名 (来自示例数据)
  bot_name?: string // 机器人用户名
}

// 由于不再有详情页，HostedOrderDetail 可以移除或注释掉
// export interface HostedOrderDetail extends AutoManageAddressItem {
//   // 详情可能包含更多字段
//   payment_method?: string;
//   transaction_id?: string;
//   remarks?: string;
// }
