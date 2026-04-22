import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  const permissionStore = usePermissionStoreWithOut()
  const appStore = useAppStoreWithOut()
  const userStore = useUserStoreWithOut()

  if (userStore.getUserInfo) {
    // 双重检查：同时验证 Pinia store 和 localStorage
    const storeExpiredAt = userStore.getTokenExpiredAt

    // 从 localStorage 读取原始数据进行二次验证
    let localExpiredAt: number | null = null
    try {
      const localStorageData = localStorage.getItem('user')
      if (localStorageData) {
        const userData = JSON.parse(localStorageData)
        localExpiredAt = userData.tokenExpiredAt
      }
    } catch (e) {
      console.error('[路由守卫] localStorage 数据解析失败:', e)
    }

    // 使用两者中较早的过期时间（更严格的验证）
    // 如果 store 和 localStorage 不一致，说明可能被篡改，使用更严格的值
    const expiredAt =
      storeExpiredAt && localExpiredAt
        ? Math.min(storeExpiredAt, localExpiredAt)
        : storeExpiredAt || localExpiredAt

    if (expiredAt) {
      const now = Math.floor(Date.now() / 1000) // 当前时间（秒）
      if (now >= expiredAt) {
        console.log('[路由守卫] Token已过期，自动退出登录')
        ElMessage.warning('登录已过期，请重新登录')
        userStore.logout()
        next(`/login?redirect=${to.path}`)
        return
      }
    }

    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (permissionStore.getIsAddRouters) {
        // 检查路由是否存在
        if (to.matched.length === 0) {
          console.log('🚫 路由不存在，跳转到 404:', to.path)
          next('/404')
          return
        }
        next()
        return
      }

      // 开发者可根据实际情况进行修改
      const roleRouters = userStore.getRoleRouters || []

      // 是否使用动态路由
      if (appStore.getDynamicRouter) {
        await (appStore.serverDynamicRouter
          ? permissionStore.generateRoutes('server', roleRouters as AppCustomRouteRecordRaw[])
          : permissionStore.generateRoutes('frontEnd', roleRouters as string[]))
      } else {
        await permissionStore.generateRoutes('static')
      }

      // 批量添加路由，减少循环次数
      const addRouters = permissionStore.getAddRouters

      // 确保路由列表不为空
      if (addRouters.length === 0) {
        console.error('路由生成失败：addRouters 为空')
        next('/login')
        return
      }

      addRouters.forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw)
      })

      permissionStore.setIsAddRouters(true)
      const redirectPath = from.query.redirect || to.path
      const redirect = decodeURIComponent(redirectPath as string)
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
      next(nextData)
    }
  } else {
    if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
    }
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
