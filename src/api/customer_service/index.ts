import request from '@/axios'
import type {
  CustomerServiceItem,
  CustomerServiceQueryParams,
  CustomerServiceListResponse,
  CreateCustomerServiceParams,
  UpdateCustomerServiceParams,
  DeleteCustomerServiceParams,
  // 兼容性导入
  AddCustomerServiceParams,
  CustomerServiceListResponseData
} from './type'

// 重新导出类型
export type {
  CustomerServiceItem,
  CustomerServiceQueryParams,
  CustomerServiceListResponse,
  CreateCustomerServiceParams,
  UpdateCustomerServiceParams,
  DeleteCustomerServiceParams,
  AddCustomerServiceParams
} from './type'

// ==================== 新接口（v2） ====================

const CUSTOMER_SERVICE_BASE = '/v2/manage/customer/'

/**
 * 获取客服列表（新接口 v2）
 * 接口路径：GET /v2/manage/customer/list
 * @param params 查询参数
 */
export const getCustomerServiceListApi = (
  params: CustomerServiceQueryParams
): Promise<IResponse<CustomerServiceListResponse>> => {
  return request.get({ url: `${CUSTOMER_SERVICE_BASE}list`, params })
}

/**
 * 创建客服（新接口 v2）
 * 接口路径：POST /v2/manage/customer/add
 * @param data 创建参数
 */
export const createCustomerServiceApi = (data: CreateCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}add`, data })
}

/**
 * 更新客服信息（新接口 v2）
 * 接口路径：POST /v2/manage/customer/update
 * @param data 更新参数
 */
export const updateCustomerServiceApi = (data: UpdateCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}update`, data })
}

/**
 * 删除客服（新接口 v2）
 * 接口路径：POST /v2/manage/customer/del
 * @param data 删除参数
 */
export const deleteCustomerServiceApi = (data: DeleteCustomerServiceParams): Promise<IResponse> => {
  return request.post({ url: `${CUSTOMER_SERVICE_BASE}del`, data })
}

// ==================== 兼容性接口 ====================

/**
 * 添加客服（兼容旧接口名称）
 * @deprecated 请使用 createCustomerServiceApi 代替
 */
export const addCustomerServiceApi = createCustomerServiceApi
