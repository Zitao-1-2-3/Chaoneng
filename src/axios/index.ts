import service from './service'
import { CONTENT_TYPE } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'

const request = <T = any>(option: AxiosConfig) => {
  const { url, method, params, data, headers, responseType } = option

  const userStore = useUserStoreWithOut()
  return service.request<T>({
    url: url,
    method,
    params,
    data: data,
    responseType: responseType,
    headers: {
      'Content-Type': CONTENT_TYPE,
      [userStore.getTokenKey ?? 'Authorization']: userStore.getToken ?? '',
      ...headers
    },
    // 传递 skipErrorHandler 配置
    skipErrorHandler: (option as any).skipErrorHandler
  } as any)
}

export default {
  get: <T = any>(option: AxiosConfig) => {
    return request<IResponse<T>>({ method: 'get', ...option })
  },
  post: <T = any>(option: AxiosConfig) => {
    return request<IResponse<T>>({ method: 'post', ...option })
  },
  delete: <T = any>(option: AxiosConfig) => {
    return request<IResponse<T>>({ method: 'delete', ...option })
  },
  put: <T = any>(option: AxiosConfig) => {
    return request<IResponse<T>>({ method: 'put', ...option })
  },
  cancelRequest: (url: string | string[]) => {
    return service.cancelRequest(url)
  },
  cancelAllRequest: () => {
    return service.cancelAllRequest()
  }
}
