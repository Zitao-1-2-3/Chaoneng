import request from '@/axios'

type UserListQueryParams = {
  query?: string
  // Add other params if needed
}

export const getUserListApi = (params: UserListQueryParams) => {
  return request.get({
    url: '/manage/agent_bot/user_list',
    params
  })
}

export const exportUserListApi = (params: UserListQueryParams) => {
  return request.get({
    url: '/manage/agent_bot/user_export',
    params,
    responseType: 'blob'
  })
}
