import request from '@/axios'

export const upload = (data: any) => {
  return request.post({
    url: '/v1/bot/common/upload',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
