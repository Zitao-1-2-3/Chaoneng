import request from '@/axios'
import type { InviteListQueryParams, InviteListResponse } from './invite.types'

// 导出类型定义
export * from './invite.types'

// ==================== 邀请列表接口 ====================

const INVITE_BASE = '/v2/manage/invite/'

/**
 * 获取邀请记录列表
 * 接口路径：GET /v2/manage/invite/list
 * @param params 查询参数
 */
export const getInviteListApi = (
  params: InviteListQueryParams
): Promise<IResponse<InviteListResponse>> => {
  return request.get({ url: `${INVITE_BASE}list`, params })
}

/**
 * 导出邀请记录列表
 * 接口路径：GET /v2/manage/invite/export
 * @param params 查询参数
 */
export const exportInviteListApi = (params: InviteListQueryParams): Promise<IResponse<Blob>> => {
  return request.get({ url: `${INVITE_BASE}export`, params, responseType: 'blob' })
}
