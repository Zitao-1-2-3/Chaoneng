import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout } from '@/utils/routerHelper'
import { NO_RESET_WHITE_LIST } from '@/constants'

// Import route modules
import baseRoutes from './modules/base'
import operationRoutes from './modules/operation'
import managementRoutes from './modules/management'

// 获取环境变量中的系统类型
const systemType = import.meta.env.VITE_SYSTEM_TYPE || 'Management'

// Keep the root route definition here
const rootRoute: AppRouteRecordRaw = {
  path: '/',
  component: Layout,
  redirect: systemType === 'Management' ? '/bot_manage/bot_list' : '/exchange_rate/index',
  name: 'Root',
  meta: {
    hidden: true
  }
}

// Construct the constantRouterMap using the root route and the imported base routes
export const constantRouterMap: AppRouteRecordRaw[] = [rootRoute, ...baseRoutes]

// Final routes array construction logic using imported modules
let finalManagementRoutes = managementRoutes
const finalOperationRoutes = operationRoutes

if (systemType === 'Management') {
  finalManagementRoutes = managementRoutes.filter((item) => item.path !== '/data_statistics')
} else {
  // Add any necessary filtering for operationRoutes here if needed
  // finalOperationRoutes = operationRoutes.filter((item) => item.path !== '/some_path')
}

let routes: AppRouteRecordRaw[] = []
if (systemType === 'Management') {
  // Combine constant routes with filtered management routes (exclude asyncCommonRoutes)
  routes = [...constantRouterMap, ...finalManagementRoutes]
} else {
  // Combine constant routes with filtered operation routes (exclude asyncCommonRoutes)
  routes = [...constantRouterMap, ...finalOperationRoutes]
}

// The 404 route is usually added dynamically by the permission store,
// so it doesn't need to be explicitly added here unless the permission logic changes.

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: routes as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
