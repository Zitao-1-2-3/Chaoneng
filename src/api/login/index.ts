import request from '@/axios'
import type {
  UserType,
  UserInfoResponse,
  PhoneRegisterParams,
  EmailRegisterParams,
  PasswordLoginParams,
  VerifyCodeLoginParams,
  ChangePasswordParams,
  ChangeManagePasswordParams,
  EmailCodeParams,
  PhoneCodeParams,
  LoginResponse
} from './types'
import { isManagementSystem } from '@/utils/system'
import { encryptAESCTR } from '@/utils/encrypt'

interface RoleParams {
  roleName: string
}

const isManagement = isManagementSystem()
// 旧的API接口，保留供兼容
export const loginApi = (data: UserType): Promise<IResponse<UserType>> => {
  // TODO：需要修改为后端接口
  return request.post({ url: '/mock/user/login', data })
}

export const loginOutApi = (): Promise<IResponse> => {
  return request.get({ url: '/mock/user/loginOut' })
}

export const getUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    code: string
    data: {
      list: UserType[]
      total: number
    }
  }>({ url: '/mock/user/list', params })
}

export const getAdminRoleApi = (
  params: RoleParams
): Promise<IResponse<AppCustomRouteRecordRaw[]>> => {
  return request.get({ url: '/mock/role/list', params })
}

export const getTestRoleApi = (params: RoleParams): Promise<IResponse<string[]>> => {
  return request.get({ url: '/mock/role/list2', params })
}

// 新的API接口

// 注册相关API
/**
 * 手机号注册
 * @param data 注册参数
 */
export const phoneRegisterApi = (data: PhoneRegisterParams): Promise<IResponse> => {
  return request.post({ url: '/v1/user/phone/register', data })
}

/**
 * 邮箱注册
 * @param data 注册参数
 */
export const emailRegisterApi = (data: EmailRegisterParams): Promise<IResponse> => {
  return request.post({ url: '/v1/user/email/register', data })
}

// 登录相关API
/**
 * 账号密码登录
 * @param data 登录参数
 */
export const passwordLoginApi = (
  data: PasswordLoginParams & { verify_code?: string; code_id?: string }
): Promise<IResponse<LoginResponse>> => {
  let url = '/v1/user/login'
  if (!isManagement) {
    url = '/manage/user/login'
  }
  // 整体序列化加密，iv 拼接在密文前16位
  console.log('data', JSON.stringify(data))
  const encrypted = encryptAESCTR(JSON.stringify(data))
  return request.post({ url, data: { data: encrypted } })
}

/**
 * 账号验证码登录
 * @param data 登录参数
 */
export const verifyCodeLoginApi = (
  data: VerifyCodeLoginParams
): Promise<IResponse<LoginResponse>> => {
  return request.post({ url: '/v1/user/verify/login', data })
}

/**
 * 退出登录
 */
export const logoutApi = (): Promise<IResponse> => {
  let url = '/v1/user/logout'
  if (!isManagement) {
    url = '/manage/user/logout'
  }
  return request.post({ url })
}

// 修改密码相关API
/**
 * 修改密码
 * @param data 修改密码参数
 */
export const changePasswordApi = (data: ChangePasswordParams): Promise<IResponse> => {
  return request.post({ url: '/v1/user/changepasswd', data })
}

/**
 * 修改密码（运营用户，需登录）
 * 接口路径：POST /v2/manage/user/changepasswd
 * 参数：password (原密码), new_password (新密码)
 */
export const changeManagePasswordApiV2 = (data: ChangeManagePasswordParams): Promise<IResponse> => {
  return request.post({ url: '/v2/manage/user/changepasswd', data })
}

// 验证码相关API
/**
 * 发送邮箱验证码
 * @param data 发送验证码参数
 */
export const sendEmailCodeApi = (data: EmailCodeParams): Promise<IResponse> => {
  return request.post({ url: '/user/email/code', data })
}

/**
 * 发送手机验证码
 * @param data 发送验证码参数
 */
export const sendPhoneCodeApi = (data: PhoneCodeParams): Promise<IResponse> => {
  return request.post({ url: '/v1/user/phone/code', data })
}

/**
 * 获取图形验证码
 */
export const getCaptchaApi = (): Promise<IResponse<{ id: string; data: string }>> => {
  return request.get({ url: '/v1/user/captcha/captcha' })
}

/**
 * 获取用户信息
 */
export const getUserInfoApi = (): Promise<IResponse<UserInfoResponse>> => {
  return request.get({ url: '/v2/manage/user/use_info' })
}
