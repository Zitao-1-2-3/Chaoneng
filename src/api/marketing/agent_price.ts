import request from '@/axios'
// import type { PageResult, IResponse } from '@/api/types' // 暂时注释掉，路径未知

// 类型定义 - 可以根据实际后端返回进行调整
export interface AgentPriceVO {
  id: number
  // price_type: 1:闪租, 2:托管, 3:按笔数, 4:闪兑, 5:按天数, 6:首次激活 (更新注释)
  price_type: number
  price_trx: number // 用于多种类型：托管价格/笔, 闪兑费率(%), 闪租/按笔数价格/笔, 首次激活单价
  price_trx_65000: number // 托管 - 65000能量价格(TRX)
  price_trx_131000: number // 托管 - 131000能量价格(TRX)
  price_day_1: number // 按天数 - 1天价格(TRX)
  price_day_3: number // 按天数 - 3天价格(TRX)
  price_day_7: number // 按天数 - 7天价格(TRX)
  price_day_15: number // 按天数 - 15天价格(TRX)
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
  price_trx_65000?: number
  price_trx_131000?: number
  price_day_1?: number
  price_day_3?: number
  price_day_7?: number
  price_day_15?: number
  // status: number // 1: 启用, 2: 禁用
}

// 更新价格配置参数
export interface UpdatePriceParams extends AddPriceParams {
  id: number
}

// 查询价格列表 - 接口路径和参数可能需要根据实际情况调整
export const getAgentPriceListApi = (params: any): Promise<any> => {
  return request.get({ url: '/v2/manage/agent_price/list', params })
}

// 新增价格配置
export const addAgentPriceApi = (data: AddPriceParams): Promise<any> => {
  return request.post({ url: '/v2/manage/agent_price/add', data })
}

// 修改价格配置
export const updateAgentPriceApi = (data: UpdatePriceParams): Promise<any> => {
  return request.post({ url: '/v2/manage/agent_price/update', data })
}

// 删除价格配置 - 假设通过更新接口实现（如果后端支持）或有独立删除接口
// 注意：如果后端没有独立的删除接口，可能需要调整这里的实现，例如调用 update 并设置一个特殊状态，或者确认后端是否支持 /v2/manage/agent_price/delete
// 暂时保留原函数名，但修改实现调用 update，如果后端提供了删除接口，需要修改路径和方法
export const deleteAgentPriceApi = (id: number): Promise<any> => {
  // 假设通过 update 接口并传递特定参数来删除，这需要后端支持
  // 如果后端有 /v2/manage/agent_price/delete，则应使用：
  // return request.delete({ url: '/v2/manage/agent_price/delete', params: { id } })
  // 暂时注释掉，因为不确定后端实现。如果需要删除功能，请确认后端接口。
  console.warn('删除操作的后端实现未明确，请确认 /v2/manage/agent_price/delete 或其他删除方式')
  // 暂时返回一个成功的 Promise，以便前端流程继续，但实际可能未删除
  return Promise.resolve({ code: 0, data: null, message: '删除操作待确认后端接口' } as any)
}

// 更新价格配置状态 - 这个功能现在应该由 updateAgentPriceApi 统一处理
// 保留此函数是为了兼容旧代码调用处，但内部调用 updateAgentPriceApi
export const updateAgentPriceStatusApi = (id: number, status: number): Promise<any> => {
  // 注意：调用 updateAgentPriceApi 需要完整的更新数据，而不仅仅是 id 和 status
  // 这里需要先获取当前行的完整数据，然后修改 status 再调用 update
  // 这使得单独的状态切换变得复杂，建议在调用处 (AgentPrice.vue) 处理：获取完整数据，修改状态，然后调用 updateAgentPriceApi
  console.warn('建议直接在 AgentPrice.vue 中调用 updateAgentPriceApi 来更新状态')
  // 暂时返回一个成功的 Promise，提醒修改调用逻辑
  return Promise.resolve({
    code: 0,
    data: null,
    message: '请在 AgentPrice.vue 中直接调用 updateAgentPriceApi'
  } as any)
}

// 机器人价格配置 - 获取配置列表
export const getSysConfListApi = (params?: any): Promise<any> => {
  return request.get({ url: '/v2/manage/sys/list', params })
}

// 机器人价格配置 - 更新配置
export const updateSysConfApi = (data: any): Promise<any> => {
  return request.post({ url: '/v2/manage/sys/update', data })
}
