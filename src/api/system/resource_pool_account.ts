import request from '@/axios'

// // ==================== 新接口 (主分支: /v2/pools) ====================

// /**
//  * 获取资源池数据 - 新接口
//  * @param params 查询参数
//  */
// export const getResourcePoolAccountListApi = (params: any) => {
//   return request.get({
//     url: '/v2/pools',
//     params
//   })
// }

// /**
//  * 创建资源池账号 - 新接口
//  * @param data 创建参数
//  */
// export const createResourcePoolAccountApi = (data: any) => {
//   return request.post({
//     url: '/v2/pools/create',
//     data
//   })
// }

// /**
//  * 更新资源池 - 新接口
//  * @param data 更新参数
//  */
// export const updateResourcePoolAccountApi = (data: any) => {
//   return request.post({
//     url: '/v2/pools/update',
//     data
//   })
// }

// ==================== 旧接口 (保留，后端接口有问题) ====================

/**
 * 获取资源池账户列表 - 旧接口
 */
export const getResourcePoolAccountListApi = (params: any) => {
  return request.get({
    url: '/manage/resource_pool/list',
    params
  })
}

/**
 * 创建资源池账户 - 旧接口
 */
export const createResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/add', data })
}

/**
 * 更新资源池账户 - 旧接口
 */
export const updateResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/update', data })
}

// ==================== 未重构的接口 (保持不变) ====================

/**
 * 删除资源池账户
 */
export const deleteResourcePoolAccountApi = (params: any) => {
  return request.post({ url: '/manage/resource_pool/delete', data: params })
}

/**
 * 批量删除资源池账户
 */
export const batchDeleteResourcePoolAccountApi = (data: any) => {
  return request.delete({ url: '/system/resource-pool-account/batch-delete', data })
}

/**
 * 修改资源池账户状态
 */
export const changeResourcePoolAccountStatusApi = (params: any) => {
  return request.post({ url: '/v2/manage/resource_pool/change', params })
}
