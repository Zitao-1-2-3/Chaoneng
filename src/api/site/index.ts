import request from '@/axios'
import type {
  SiteListParams,
  SiteListResponse,
  SiteDetail,
  CreateSiteParams,
  UpdateSiteParams
} from './types'

// ========== Site 站点管理接口 v1 ==========

const BASE_URL = '/v1/site/'

/**
 * 分页获取站点列表
 * GET /v1/site/list
 */
export const v1GetSiteList = (params: SiteListParams): Promise<IResponse<SiteListResponse>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 获取站点详情
 * GET /v1/site/{id}
 */
export const v1GetSiteDetail = (id: number | string): Promise<IResponse<SiteDetail>> => {
  return request.get({
    url: `${BASE_URL}${id}` // /v1/site/{id}
  })
}

/**
 * 创建站点
 * POST /v1/site
 */
export const v1CreateSite = (data: CreateSiteParams): Promise<IResponse> => {
  return request.post({
    url: BASE_URL.slice(0, -1), // 移除末尾的斜杠，变成 /v1/site
    data
  })
}

/**
 * 更新站点
 * PUT /v1/site
 */
export const v1UpdateSite = (data: UpdateSiteParams): Promise<IResponse> => {
  return request.put({
    url: BASE_URL.slice(0, -1), // 移除末尾的斜杠，变成 /v1/site
    data
  })
}

/**
 * 删除站点
 * DELETE /v1/site/{id}
 */
export const v1DeleteSite = (id: number): Promise<IResponse> => {
  return request.delete({
    url: `${BASE_URL}${id}` // /v1/site/{id}
  })
}
