import axios, { AxiosError } from 'axios'
import { defaultRequestInterceptors, defaultResponseInterceptors } from './config'
import { AxiosInstance, InternalAxiosRequestConfig, RequestConfig, AxiosResponse } from './types'
import { ElMessage } from 'element-plus'
import { REQUEST_TIMEOUT } from '@/constants'
import qs from 'qs'
// Remove system store import
// import { useAppStore } from '@/store/modules/app' // Keep app store if used elsewhere, remove if not
// import { useSystemStore } from '@/store/modules/system'

export const PATH_URL = import.meta.env.VITE_API_BASE_PATH

const abortControllerMap: Map<string, AbortController> = new Map()

const axiosInstance: AxiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: PATH_URL, // 如果使用mock，则不使用API基础路径
  // 配置参数序列化：数组参数序列化为 kinds=1&kinds=2 格式
  paramsSerializer: {
    serialize: (params) => {
      return qs.stringify(params, { arrayFormat: 'repeat' })
    }
  }
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const controller = new AbortController()
  const originalUrl = config.url || ''

  // --- 处理 keyboards 参数：确保只传递 ID 数组 ---
  if (config.data && config.data.keyboards && Array.isArray(config.data.keyboards)) {
    config.data.keyboards = config.data.keyboards
      .map((item: any) => {
        // 如果是对象，提取 id 属性
        if (typeof item === 'object' && item !== null) {
          return Number(item.id || item)
        }
        // 如果是数字或字符串，直接转换
        return Number(item)
      })
      .filter((id: number) => !isNaN(id) && id > 0)
  }

  // --- Mock 逻辑判断 ---
  const MOCK_LIST = (import.meta.env.VITE_MOCK_LIST || '').split(',')
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'
  const isMockRequest = useMock && MOCK_LIST.some((item) => item && originalUrl.includes(item)) // 确保 item 非空

  if (isMockRequest) {
    // 如果是 Mock 请求, 修改 URL 并设置 baseURL 为空
    config.url = '/mock' + originalUrl
    config.baseURL = ''
  } else {
    // --- 非 Mock 请求: 添加 API 版本前缀 ---
    const systemType = import.meta.env.VITE_SYSTEM_TYPE
    // 根据环境变量 VITE_SYSTEM_TYPE 决定前缀
    const prefix = systemType === 'Management' ? '/v1' : '/v2'
    const currentUrl = config.url || '' // 获取当前 config 中的 url

    // 如果当前 url 没有 /v1 或 /v2 前缀, 则添加

    if (
      !currentUrl.includes('/public') &&
      !currentUrl.startsWith('/v1') &&
      !currentUrl.startsWith('/v2')
    ) {
      config.url = `${prefix}${currentUrl}`
    }
    // 可选: 如果已有 *错误* 的前缀, 可以加日志警告
    else if (
      (systemType === 'Management' && currentUrl.startsWith('/v2')) ||
      (systemType !== 'Management' && currentUrl.startsWith('/v1'))
    ) {
      console.warn(`请求 URL [${currentUrl}] 可能包含错误的版本前缀 (当前系统: ${systemType})`)
    }
  }

  // --- 设置 AbortController ---
  const finalUrl = config.url || '' // 使用最终确定的 URL
  config.signal = controller.signal
  abortControllerMap.set(finalUrl, controller)

  return config
})

// Response interceptor remains the same (handles abort cleanup)
axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => {
    const url = res.config.url || ''
    abortControllerMap.delete(url)
    return res
  },
  (error: AxiosError) => {
    console.log('err： ' + error) // for debug
    const url = error.config?.url || ''
    if (url) {
      abortControllerMap.delete(url)
    }
    ElMessage.error('网络错误，稍后重试')
    return Promise.reject(error)
  }
)

// Apply default interceptors (assuming they don't depend on Pinia)
axiosInstance.interceptors.request.use(defaultRequestInterceptors)
axiosInstance.interceptors.response.use(defaultResponseInterceptors)

// Export the configured instance
// The service object might need adjustment if its methods relied on the prefix being added here
const service = {
  request: (config: RequestConfig): Promise<AxiosResponse> => {
    // Keep explicit Promise type
    return new Promise((resolve, reject) => {
      // Apply per-request interceptors if provided
      if (config.interceptors?.requestInterceptors) {
        config = config.interceptors.requestInterceptors(config as InternalAxiosRequestConfig)
      }

      axiosInstance
        .request(config) // Use the globally configured axiosInstance
        .then((res) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  },
  cancelRequest: (url: string | string[]) => {
    const urlList = Array.isArray(url) ? url : [url]
    for (const _url of urlList) {
      abortControllerMap.get(_url)?.abort()
      abortControllerMap.delete(_url)
    }
  },
  cancelAllRequest() {
    for (const [_, controller] of abortControllerMap) {
      controller.abort()
    }
    abortControllerMap.clear()
  }
}

// Export both the instance (for adding interceptors later) and the service object
export { axiosInstance }
export default service
