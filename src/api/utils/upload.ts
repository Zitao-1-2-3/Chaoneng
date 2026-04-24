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

/**
 * 上传文件（图片/视频）- 新接口
 * @param data FormData 对象，包含 file 字段
 * @returns Promise 返回 { code, data: { filename, url }, msg }
 */
export const uploadFile = (data: FormData) => {
  return request.post({
    url: '/v1/file',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传文件（图片/视频）- v2 接口（运营端）
 * @param data FormData 对象，包含 file 字段
 * @returns Promise 返回 { code, data: { filename, url }, msg }
 */
export const uploadFileV2 = (data: FormData) => {
  return request.post({
    url: '/v2/file',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
