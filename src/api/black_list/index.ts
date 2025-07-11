import request from '@/axios'

export interface BlackListParams {
  current_page: number
  page_size: number
  address?: string // 添加 address 参数用于搜索
}

export interface BlackListItem {
  id: number
  address: string
  create_time: number | string // 与Vue文件中的类型保持一致
}

// 获取黑名单列表
export const getBlackListApi = (params: BlackListParams) => {
  return request.get<{ list: BlackListItem[]; totalCount: number }>({
    url: '/v1/order/count_black/list', // 更新URL
    params
  })
}

// 添加黑名单
export const addBlackListApi = (data: { address: string }) => {
  return request.post<BlackListItem>({
    // 假设成功后返回新的item
    url: '/v1/order/count_black/add',
    data
  })
}

// 删除黑名单
export const deleteBlackListApi = (data: { id: number | string }) => {
  return request.post({
    // 后端接口是 POST
    url: '/v1/order/count_black/delete',
    data
  })
}
