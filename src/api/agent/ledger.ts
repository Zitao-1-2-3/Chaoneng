import request from '@/axios'
import type { AgentBillListParamsV2, AgentBillListResponseV2 } from './ledger.types'

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
