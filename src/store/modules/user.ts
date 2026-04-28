import { defineStore } from 'pinia'
import { store } from '../index'
import { UserLoginType, UserType } from '@/api/login/types'
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { logoutApi } from '@/api/login'
import { useTagsViewStore } from './tagsView'
import { usePermissionStoreWithOut } from './permission'
import router from '@/router'

interface UserState {
  userInfo?: UserType
  tokenKey: string
  token: string
  tokenExpiredAt?: number // Token 过期时间（Unix 时间戳-秒）
  roleRouters?: string[] | AppCustomRouteRecordRaw[]
  rememberMe: boolean
  loginInfo?: UserLoginType
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    return {
      userInfo: undefined,
      tokenKey: 'Authorization',
      token: '',
      tokenExpiredAt: undefined,
      roleRouters: undefined,
      // 记住我
      rememberMe: true,
      loginInfo: undefined
    }
  },
  getters: {
    getTokenKey(): string {
      return this.tokenKey
    },
    getToken(): string {
      return this.token
    },
    getTokenExpiredAt(): number | undefined {
      return this.tokenExpiredAt
    },
    getUserInfo(): UserType | undefined {
      return this.userInfo
    },
    getRoleRouters(): string[] | AppCustomRouteRecordRaw[] | undefined {
      return this.roleRouters
    },
    getRememberMe(): boolean {
      return this.rememberMe
    },
    getLoginInfo(): UserLoginType | undefined {
      return this.loginInfo
    },
    isSuperAdmin(): boolean {
      return !!this.userInfo?.permissions?.includes('*')
    }
  },
  actions: {
    setTokenKey(tokenKey: string) {
      this.tokenKey = tokenKey
    },
    setToken(token: string) {
      this.token = token
    },
    setTokenExpiredAt(expiredAt?: number) {
      this.tokenExpiredAt = expiredAt
    },
    setUserInfo(userInfo?: UserType) {
      this.userInfo = userInfo
    },
    setRoleRouters(roleRouters: string[] | AppCustomRouteRecordRaw[]) {
      this.roleRouters = roleRouters
    },
    logoutConfirm() {
      const { t } = useI18n()
      ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
        .then(async () => {
          // 调用退出登录API，无论成功失败都执行reset
          await logoutApi().catch(() => {})
          // 无论API是否成功，都清除本地状态并跳转到登录页
          this.reset()
        })
        .catch(() => {})
    },
    reset() {
      const tagsViewStore = useTagsViewStore()
      const permissionStore = usePermissionStoreWithOut()

      // 清除标签页
      tagsViewStore.delAllViews()

      // 清除用户信息
      this.setToken('')
      this.setTokenExpiredAt(undefined)
      this.setUserInfo(undefined)
      this.setRoleRouters([])

      // 重置路由状态
      permissionStore.setIsAddRouters(false)

      // 清除所有localStorage缓存
      const storageKeys = [
        'app',
        'lock',
        'permission',
        'tagsView',
        'user',
        'locale',
        'dynamicRouterPath'
      ]
      storageKeys.forEach((key) => localStorage.removeItem(key))

      // 跳转到登录页
      router.replace('/login').catch(() => {
        // 如果路由跳转失败，强制刷新页面到登录页
        window.location.href = '/#/login'
      })
    },
    logout() {
      this.reset()
    },
    setRememberMe(rememberMe: boolean) {
      this.rememberMe = rememberMe
    },
    setLoginInfo(loginInfo: UserLoginType | undefined) {
      this.loginInfo = loginInfo
    }
  },
  persist: true
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
