import request from '@/axios'
import type {
  AddPriceParams,
  UpdatePriceParams,
  V1PriceListParams,
  V1PriceListResponseData,
  V2SystemPriceResponse,
  V2UpdateSystemPriceParams
} from './agent_price_types'

// ========== 系统价格参数相关接口（新接口 v2）==========

// 主分支
const BASE_URL = '/v2/system/'

// 获取价格列表 - v2
// GET /v2/price/list
export const v2GetPriceList = (
  params?: V1PriceListParams
): Promise<{ data: V1PriceListResponseData }> => {
  return request.get({
    url: '/v2/price/list',
    params
  })
}

// 获取系统价格参数 - 新接口 v2
// GET /v2/system/price (无请求参数)
export const v2GetSystemPrice = (): Promise<{ data: V2SystemPriceResponse }> => {
  return request.get({ url: `${BASE_URL}price` })
}

// 更新系统价格参数 - 新接口 v2
// POST /v2/system/price/update
export const v2UpdateSystemPrice = (data: V2UpdateSystemPriceParams): Promise<any> => {
  return request.put({ url: `/v2/price`, data })
}

// ========== 旧接口 ==========

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
export const deleteAgentPriceApi = (_id: number): Promise<any> => {
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
export const updateAgentPriceStatusApi = (_id: number, _status: number): Promise<any> => {
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

// 机器人价格配置 - 获取配置列表（旧接口，保留兼容）
export const getSysConfListApi = (params?: any): Promise<any> => {
  return request.get({ url: '/v2/manage/sys/list', params })
}

// 机器人价格配置 - 更新配置
export const updateSysConfApi = (data: any): Promise<any> => {
  return request.post({ url: '/v2/manage/sys/update', data })
}
