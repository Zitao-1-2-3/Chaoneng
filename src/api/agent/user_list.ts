import request from '@/axios'

type UserListQueryParams = {
  query?: string
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
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
