import request from '@/axios'
import type {
  CustomerServiceItem,
  CustomerServiceQueryParams,
  CustomerServiceListResponse,
  CreateCustomerServiceParams,
  UpdateCustomerServiceParams,
  DeleteCustomerServiceParams
} from './type'

export type {
  CustomerServiceItem,
  CustomerServiceQueryParams,
  CustomerServiceListResponse,
  CreateCustomerServiceParams,
  UpdateCustomerServiceParams,
  DeleteCustomerServiceParams
} from './type'

const USER_CUSTOMER_SERVICE_BASE = '/v1/user/customer/'

/**
 * 获取客服列表（代理端接口 v1）
 * GET /v1/user/customer/list
 */
export const getUserCustomerServiceListApi = (
  params: CustomerServiceQueryParams
): Promise<IResponse<CustomerServiceListResponse>> => {
  return request.get({ url: `${USER_CUSTOMER_SERVICE_BASE}list`, params })
}

const CUSTOMER_SERVICE_BASE = '/v2/manage/customer/'

/**
 * 获取客服列表（运营端接口 v2）
 * GET /v2/manage/customer/list
 */
export const getCustomerServiceListApi = (
  params: CustomerServiceQueryParams
): Promise<IResponse<CustomerServiceListResponse>> => {
  return request.get({ url: `${CUSTOMER_SERVICE_BASE}list`, params })
}

/**
 * 创建客服（新接口 v2）
 * POST /v2/manage/customer/add
 */
export const createCustomerServiceApi = (data: CreateCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}add`, data })
}

/**
 * 更新客服信息（新接口 v2）
 * POST /v2/manage/customer/update
 */
export const updateCustomerServiceApi = (data: UpdateCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}update`, data })
}

/**
 * 删除客服（新接口 v2）
 * POST /v2/manage/customer/del
 */
export const deleteCustomerServiceApi = (data: DeleteCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}del`, data })
}
