export interface UserLoginType {
  username: string
  password: string
}

export interface UserType {
  username: string
  password?: string // 改为可选
  permissions?: string[]
  role?: string
  roleId?: string
  name?: string // 用户名
  role_ID?: number // 角色ID
  role_name?: string // 角色名称
  created_at?: number // 创建时间
}

/**
 * 获取用户信息接口返回的数据类型
 */
export interface UserInfoResponse {
  permissions: string[] // 权限列表
  name: string // 用户名
  role_ID: number // 角色ID
  role_name: string // 角色名称
  created_at: number // 创建时间
}

export interface PhoneRegisterParams {
  phone: string
  password: string
  verify_code: string
}

export interface EmailRegisterParams {
  username: string
  email: string
  password: string
  verify_code: string
}

export type PasswordLoginParams =
  | {
      username: string
      password: string
    }
  | {
      encrypted: string
    }

export interface VerifyCodeLoginParams {
  username: string
  verify_code: string
}

/**
 * 修改密码参数（代理用户，通过邮箱验证码重置）
 * 接口路径：POST /v1/user/changepasswd
 */
export interface ChangePasswordParams {
  email: string // 邮箱
  password: string // 新密码
  verify_code: string // 验证码
}

/**
 * 修改密码参数（运营用户，需登录）
 */
export interface ChangeManagePasswordParams {
  password: string // 原密码
  new_password: string // 新密码
}

export interface EmailCodeParams {
  email: string
  channel: 'login' | 'register' | 'change_passwd'
}

export interface PhoneCodeParams {
  country_code?: string
  mobile: string
  channel: 'login' | 'register' | 'change_passwd'
}

export interface LoginResponse {
  code: string
  data: {
    token: string // token字符串
    expirated_at?: number // token过期时间（Unix时间戳-秒）- 注意：后端拼写为 expirated_at
    expired_at?: number // 兼容正确拼写
  }
  msg: string
  trace: {
    destIp: string
    id: string
    srcIp: string
    timestamp: number
  }
}
