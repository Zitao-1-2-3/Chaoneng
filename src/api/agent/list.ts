import request from '@/axios'

// ==================== 类型定义 ====================

/**
 * 代理列表查询参数
 */
export interface AgentQueryParams {
  keyword?: string // 关键字：代理ID/联系方式
  current_page?: number // 页码
  page_size?: number // 每页数量
  status?: number | string // 状态：'' 或 undefined 表示全部, 1 表示启用, 2 表示禁用
  start_time?: number // 开始时间 (时间戳)
  end_time?: number // 结束时间 (时间戳)
}

/**
 * 代理列表项
 */
export interface AgentItem {
  id: number
  username: string // 代理名称
  email: string // 邮箱
  role_id: number // 角色ID
  status: number // 状态 (1:启用, 2:禁用)
  gift_bandwidth: boolean // 是否赠送带宽
  trx_balance: string // TRX余额
  usdt_balance: string // USDT余额
  created_at: number // 创建时间 (时间戳)
  updated_at: number // 更新时间 (时间戳)
  role?: {
    id: number
    name: string
    status: number
    created_at: number
    updated_at: number
    permissions: any[] | null
  }
  // 以下字段后端暂未提供
  bot_num?: number // 机器人数量
  tg_account_num?: number // TG账号数量
  total_trx_amount?: string // TRX总收入
  total_usdt_amount?: string // USDT总收入
}

/**
 * 代理列表响应数据
 */
export interface AgentListResponseData {
  list: AgentItem[]
  totalCount: number
}

/**
 * 新增代理参数
 */
export interface AddAgentPayload {
  username: string // 代理名称
  email: string // 邮箱
  password: string // 登录密码
  gift_bandwidth?: boolean // 是否赠送带宽 (true:赠送, false:不赠送)
  status?: number // 状态 (1:启用, 2:禁用)
}

/**
 * 更新代理参数
 */
export interface UpdateAgentPayload {
  id: number | string // 代理ID
  email?: string // 邮箱
  password?: string // 登录密码 (留空不修改)
  gift_bandwidth?: boolean // 是否赠送带宽 (true:赠送, false:不赠送)
  status?: number // 状态
}

/**
 * 代理充值参数
 */
export interface RechargeAgentPayload {
  agent_id: number // 代理ID
  amount: number // 充值金额
  coin: string // 币种 (TRX/USDT)
  secret: string // 密钥
  describe?: string // 备注
}

// ==================== 接口函数 ====================

/**
 * 获取代理列表
 */
export const getAgentListApi = async (
  params: AgentQueryParams
): Promise<IResponse<AgentListResponseData>> => {
  const res = await request.get({ url: '/v2/manage/agent/list', params })

  // 后端返回: { data: { list: [], pager: { total: 12 } } }
  // 转换为: { data: { list: [], totalCount: 12 } }
  const backendData = res.data as any

  return {
    ...res,
    data: {
      list: backendData?.list || [],
      totalCount: backendData?.pager?.total || 0
    }
  }
}

/**
 * 新增代理
 */
export const addAgentApi = (data: AddAgentPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/add', data })
}

/**
 * 更新代理
 */
export const updateAgentApi = (data: UpdateAgentPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/update', data })
}

/**
 * 代理充值
 */
export const rechargeTrxApi = (data: RechargeAgentPayload): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/agent/change_balance', data })
}

/**
 * 导出代理列表
 */
export const exportAgentListApi = (params: AgentQueryParams): Promise<IResponse<Blob>> => {
  return request.get({
    url: '/v2/manage/agent/export',
    params,
    responseType: 'blob'
  })
}

// ==================== 旧接口（已废弃，保留参考） ====================

/**
 * /**
 * 更新代理状态参数
 */
// export interface UpdateAgentStatusPayload {
//   id: number | string // 代理ID
//   status: number // 状态 (1:启用, 2:禁用)
// }
//  * 更新代理状态（旧接口，已废弃）
//  * @deprecated 请使用 updateAgentApi 代替
//  * 说明：此接口与 updateAgentApi 使用相同的 URL，建议统一使用 updateAgentApi
//  */
// export const updateAgentStatusApi = (data: UpdateAgentStatusPayload): Promise<IResponse> => {
//   return request.post({ url: '/v2/manage/agent/update', data })
// }
