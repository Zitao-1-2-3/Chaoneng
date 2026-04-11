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

export const uploadImage = (data: any) => {
  return request.post({
    url: '/v1/image/upload',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
