import { defineStore } from 'pinia'
import { constantRouterMap } from '@/router'
import managementRoutes from '@/router/modules/management'
import operationRoutes from '@/router/modules/operation'
import {
  generateRoutesByFrontEnd,
  generateRoutesByServer,
  flatMultiLevelRoutes
} from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'
import { useUserStoreWithOut } from '@/store/modules/user'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'server' | 'frontEnd' | 'static',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<AppRouteRecordRaw[]> {
      return new Promise<AppRouteRecordRaw[]>((resolve) => {
        // 使用 setTimeout 将路由生成放到下一个事件循环，避免阻塞UI
        setTimeout(() => {
          const systemType = import.meta.env.VITE_SYSTEM_TYPE || 'Management'
          let baseDynamicRoutes: AppRouteRecordRaw[] = []

          const userStore = useUserStoreWithOut()

          if (systemType === 'Management') {
            baseDynamicRoutes = managementRoutes.filter((item) => item.path !== '/data_statistics')
          } else {
            if (userStore.isSuperAdmin) {
              baseDynamicRoutes = cloneDeep(operationRoutes)
            } else {
              const permissions = Array.isArray(userStore.getUserInfo?.permissions)
                ? userStore.getUserInfo.permissions
                : []
              // 使用 Set 优化权限查找性能
              const permissionSet = new Set(permissions)
              const filterRecursive = (
                routes: AppRouteRecordRaw[],
                allowedNames: Set<string>
              ): AppRouteRecordRaw[] => {
                return routes.filter((route) => {
                  const routeName = route.name as string
                  const hasRouteName = !!routeName
                  const hasAccess = !hasRouteName || allowedNames.has(routeName)

                  if (hasAccess && route.children && route.children.length > 0) {
                    route.children = filterRecursive(route.children, allowedNames)
                  }
                  const shouldKeep = hasAccess && (!route.children || route.children.length > 0)
                  return shouldKeep
                })
              }
              const clonedRoutes = cloneDeep(operationRoutes)
              baseDynamicRoutes = filterRecursive(clonedRoutes, permissionSet)
            }
          }
          console.log(baseDynamicRoutes, 'baseDynamicRoutes')
          let routerMap: AppRouteRecordRaw[] = []
          if (type === 'server') {
            routerMap = generateRoutesByServer(routers as AppCustomRouteRecordRaw[])
          } else if (type === 'frontEnd') {
            routerMap = generateRoutesByFrontEnd(baseDynamicRoutes, routers as string[])
          } else {
            routerMap = baseDynamicRoutes
          }

          const finalAddRouters = routerMap.concat([
            {
              path: '/:path(.*)*',
              redirect: '/404',
              name: '404Page',
              meta: {
                hidden: true,
                breadcrumb: false
              }
            }
          ])
          console.log('🔍 404 路由已添加:', finalAddRouters[finalAddRouters.length - 1])
          this.addRouters = finalAddRouters
          this.routers = cloneDeep(constantRouterMap).concat(routerMap)
          this.isAddRouters = true
          resolve(routerMap)
        }, 0)
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  },
  persist: {
    pick: ['routers', 'addRouters', 'menuTabRouters', 'isAddRouters'],
    storage: localStorage // 使用 localStorage 持久化路由配置
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
