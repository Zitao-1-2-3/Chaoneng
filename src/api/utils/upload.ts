import request from '@/axios'

// 后端直连地址 (用于文件上传,绕过 Netlify Functions 的 6MB 限制)
const BACKEND_DIRECT_URL = 'http://47.84.135.181:8888'

/**
 * 创建文件上传请求 (直连后端)
 * 注意: 需要后端配置 CORS 允许来自 Netlify 域名的请求
 */
const createUploadRequest = (url: string, data: FormData) => {
  return request.post({
    url,
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // 直接连接后端,绕过 Netlify Functions
    baseURL: BACKEND_DIRECT_URL
  })
}

export const upload = (data: any) => {
  return createUploadRequest('/v1/bot/common/upload', data)
}

export const uploadImage = (data: any) => {
  return createUploadRequest('/v1/image/upload', data)
}

/**
 * 上传文件（图片/视频）- 新接口
 * @param data FormData 对象，包含 file 字段
 * @returns Promise 返回 { code, data: { filename, url }, msg }
 */
export const uploadFile = (data: FormData) => {
  return createUploadRequest('/v1/file', data)
}

/**
 * 上传文件（图片/视频）- v2 接口（运营端）
 * @param data FormData 对象，包含 file 字段
 * @returns Promise 返回 { code, data: { filename, url }, msg }
 */
export const uploadFileV2 = (data: FormData) => {
  return createUploadRequest('/v2/file', data)
}
