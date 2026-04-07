import request from '@/axios'
import type {
  AgentBillListParamsV2,
  AgentBillListResponseV2,
  AgentLedgerQueryParams,
  AgentLedgerListResponseData
} from './ledger.types'

// 导出类型定义
export * from './ledger.types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/manage/bill/agent/'

/**
 * 获取代理账单列表 - 新接口 v2
 * GET /v2/manage/bill/agent/list
 */
export const v2GetAgentBillList = (
  params: AgentBillListParamsV2
): Promise<IResponse<AgentBillListResponseV2>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 导出代理账单 - 新接口 v2
 * GET /v2/manage/bill/agent/export
 */
export const v2ExportAgentBill = (params: AgentBillListParamsV2): Promise<IResponse<Blob>> => {
  return request.get({
    url: `${BASE_URL}export`,
    params,
    responseType: 'blob'
  })
}

// ========== 旧接口 ==========

/**
 * 获取代理账单列表
 * @param params 查询参数
 * @returns Promise<IResponse<AgentLedgerListResponseData>>
 */
export const getAgentLedgerListApi = (
  params: AgentLedgerQueryParams
): Promise<IResponse<AgentLedgerListResponseData>> => {
  // 注意：此 URL 基于 Ledger.vue 中的 getAgentLedgerListApi 调用，请确认是否正确
  return request.get({ url: '/v2/manage/agent_balance/list', params })
}

/**
 * 导出代理账单
 * @param params 查询参数
 * @returns Promise<IResponse> (假设导出操作不返回特定数据结构)
 */
export const exportAgentLedgerApi = (params: AgentLedgerQueryParams): Promise<IResponse> => {
  console.log('params', params)

  // 注意：此 URL 和方法基于 Ledger.vue 中的 exportAgentLedgerApi 调用，请确认是否正确
  // 通常导出是大文件，可能是 POST 请求，或者 GET 请求直接下载
  // 这里假设是 POST 请求，并将参数放在 body 中
  return request.get({
    url: '/v2/manage/agent_balance/export',
    params: params,
    responseType: 'blob'
  })
}
