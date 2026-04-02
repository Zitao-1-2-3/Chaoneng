import request from '@/axios'
import type {
  AutoManageAddressListParams,
  AutoManageAddressItem,
  HostingListParamsV1,
  HostingListResponseV1,
  RemoveHostingParamsV1
} from './types'

// 导出类型定义
export * from './types'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/hosting/'

/**
 * 获取托管列表 - 新接口 v1
 * GET /v1/hosting/list
 */
export const v1GetHostingList = (
  params: HostingListParamsV1
): Promise<IResponse<HostingListResponseV1>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 删除托管地址 - 新接口 v1
 * POST /v1/hosting/remove
 */
export const v1RemoveHosting = (data: RemoveHostingParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}remove`,
    data
  })
}

// ========== 旧接口 ==========

// 获取tg用户智能托管地址列表
export const getAutoManageAddressListApi = (params: AutoManageAddressListParams) => {
  return request.get<{ list: AutoManageAddressItem[]; totalCount: number }>({
    url: '/v1/bot/tg_user/auto_manage/list',
    params
  })
}

// 取消智能托管地址
export const deleteAutoManageAddressApi = (id: number) => {
  return request.post<boolean>({
    // 假设返回boolean表示成功与否
    url: '/v1/bot/tg_user/auto_manage/delete',
    data: { id } // 通常POST删除会将ID放在body中
  })
}

// getBotOptionsForHostedListApi function removed as it's no longer used.
