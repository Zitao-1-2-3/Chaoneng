import request from '@/axios'
import { isManagementSystem } from '@/utils/system'

const isManagement = isManagementSystem()
/**
 * 客服数据项接口
 */
export interface CustomerServiceItem {
  id: number | string
  tg_name: string // TG用户名称
  status: number // 状态：1-启用，2-禁用
  create_time?: string // 创建时间
  update_time?: string // 更新时间
}

/**
 * 客服查询参数
 */
export interface CustomerServiceQueryParams {
  query?: string // 关键字
  status?: number | string // 状态
  current_page?: number
  page_size?: number
}

/**
 * 添加客服参数
 */
export interface AddCustomerServiceParams {
  tg_name: string // TG用户名称
  status: number // 状态：1-启用，2-禁用
}

/**
 * 修改客服参数
 */
export interface UpdateCustomerServiceParams {
  id: number // 客服ID
  tg_name: string // TG用户名称
  status: number // 状态：1-启用，2-禁用
}

/**
 * 客服列表响应
 */
interface CustomerServiceListResponseData {
  list: CustomerServiceItem[]
  totalCount: number
}

/**
 * 获取客服列表
 * @param params 查询参数
 * @returns Promise<IResponse<CustomerServiceListResponseData>>
 */
export const getCustomerServiceListApi = (
  params: CustomerServiceQueryParams
): Promise<IResponse<CustomerServiceListResponseData>> => {
  const url = isManagement ? '/v1/user/customer/list' : '/v2/manage/customer/list'
  return request.get({ url, params })
}

/**
 * 添加客服
 * @param data 添加参数
 * @returns Promise<IResponse>
 */
export const addCustomerServiceApi = (data: AddCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/customer/add', data })
}

/**
 * 修改客服
 * @param data 修改参数
 * @returns Promise<IResponse>
 */
export const updateCustomerServiceApi = (data: UpdateCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/customer/update', data })
}
