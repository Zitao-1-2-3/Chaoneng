import request from '@/axios'

interface BlackListParams {
  page: number
  page_size: number
}

interface BlackListItem {
  id: number
}
// 获取黑名单列表
export const getBlackListApi = (params: BlackListParams) => {
  return request.get<{ list: BlackListItem[]; totalCount: number }>({
    url: '/v1/bot/tg_user/black_list/list',
    params
  })
}
