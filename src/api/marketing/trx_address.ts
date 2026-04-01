import request from '@/axios'
import type {
  V2AddressListParams,
  V2AddressListResponse,
  V2CreateAddressParams,
  V2UpdateAddressParams,
  V2DeleteAddressParams,
  V2UnboundAgentsResponse
} from './trx_address_types'

// --- Base URL updated to v2 ---
const BASE_URL = '/v2/manage/agent_charge_addr'

/**
 * 获取TRX地址列表 - 新接口
 */
const NEW_BASE_URL = '/v2/address'

export const v2GetAddressList = (
  params: V2AddressListParams
): Promise<IResponse<V2AddressListResponse>> => {
  return request.get({
    url: `${NEW_BASE_URL}/list`,
    params
  })
}

/**
 * 创建TRX地址 - 新接口
 */
export const v2CreateAddress = (data: V2CreateAddressParams): Promise<IResponse> => {
  return request.post({
    url: `${NEW_BASE_URL}/create`,
    data
  })
}

/**
 * 更新地址 - 新接口（用于绑定/解绑）
 */
export const v2UpdateAddress = (data: V2UpdateAddressParams): Promise<IResponse> => {
  return request.post({
    url: `${NEW_BASE_URL}/update`,
    data
  })
}

/**
 * 删除地址 - 新接口
 */
export const v2DeleteAddress = (data: V2DeleteAddressParams): Promise<IResponse> => {
  return request.post({
    url: `${NEW_BASE_URL}/delete`,
    data
  })
}

/**
 * 获取未绑定的代理列表 - 新接口
 */
export const v2GetUnboundAgents = (): Promise<IResponse<V2UnboundAgentsResponse>> => {
  return request.get({
    url: `${NEW_BASE_URL}/unbound_agents`
  })
}

/**
 * 获取TRX地址列表 - 旧接口（保留兼容）
 */
export const getTrxAddressListApi = (params = {}) => {
  return request.get({
    url: `${BASE_URL}/list`,
    params
  })
}

/**
 * 创建TRX地址 (接收逗号分隔的地址字符串)
 */
export const createTrxAddressApi = (data: { address: string }) => {
  return request.post({
    url: `${BASE_URL}/add`,
    data // Backend expects { Address: "addr1,addr2,..." }
  })
}

/**
 * 更新TRX地址 (用于绑定/解绑/修改)
 * Matches UpdateAgentChargeAddrParams
 */
export const updateTrxAddressApi = (data: { id: number; status: number; user_id: number }) => {
  return request.post({
    url: `${BASE_URL}/update`,
    data
  })
}

/**
 * 删除TRX地址
 */
export const deleteTrxAddressApi = (id: number) => {
  return request.post({
    url: `${BASE_URL}/delete`,
    data: { id }
  })
}

/**
 * 批量删除TRX地址
 * Matches BatchDelChargeAddrParams
 */
export const batchDeleteTrxAddressApi = (data: { id_list: number[] }) => {
  return request.post({
    url: `${BASE_URL}/batch_delete`,
    data // Backend expects { id_list: [...] }
  })
}

/**
 * 批量导入TRX地址 (File Upload)
 */
export const batchImportTrxAddressApi = (formData: FormData) => {
  return request.post({
    url: `${BASE_URL}/import`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导出模版
 */
export const exportAddressModuleApi = () => {
  return request.get({
    url: `${BASE_URL}/module`,
    responseType: 'blob'
  })
}

/**
 * 获取代理商列表
 */
export const getAgentListApi = () => {
  return request.get({
    url: `${BASE_URL}/list_user`
  })
}
