/**
 * 路由预加载工具
 * 用于在代理端登录时预加载路由资源，提升登录后的页面加载速度
 */

class RoutePreloader {
  private abortController: AbortController | null = null
  private isPreloading = false
  private preloadedChunks = new Set<string>()

  /**
   * 开始预加载代理端路由
   */
  startPreload() {
    // 只在代理端执行预加载
    const systemType = import.meta.env.VITE_SYSTEM_TYPE
    if (systemType === 'Management') {
      console.log('[预加载] 运营端不执行预加载')
      return
    }

    if (this.isPreloading) {
      console.log('[预加载] 已在预加载中，跳过')
      return
    }

    this.isPreloading = true
    this.abortController = new AbortController()

    console.log('[预加载] 开始预加载代理端路由资源')

    // 预加载核心路由组件
    this.preloadCoreRoutes()
  }

  /**
   * 暂停预加载
   */
  pausePreload() {
    if (this.abortController) {
      console.log('[预加载] 暂停预加载')
      this.abortController.abort()
      this.abortController = null
    }
    this.isPreloading = false
  }

  /**
   * 恢复预加载
   */
  resumePreload() {
    if (!this.isPreloading) {
      console.log('[预加载] 恢复预加载')
      this.startPreload()
    }
  }

  /**
   * 预加载核心路由
   */
  private async preloadCoreRoutes() {
    // 代理端核心路由列表（按优先级排序）
    const coreRoutes = [
      // 1. 首页/工作台
      () => import('@/views/Dashboard/Workplace.vue'),

      // 2. 订单管理（高频访问）
      () => import('@/views/OrderManage/recharge_order/index.vue'),
      () => import('@/views/OrderManage/energy_order/index.vue'),
      () => import('@/views/OrderManage/exchange_order/index.vue'),

      // 3. 机器人管理
      () => import('@/views/Bot_manage/bot_list/index.vue'),

      // 4. 用户管理
      () => import('@/views/UserGroup/user_list/index.vue'),

      // 5. 其他常用页面
      () => import('@/views/HostedList/index.vue'),
      () => import('@/views/AccountManage/account_list/index.vue'),
      () => import('@/views/DataStatistics/bot_summary/index.vue')
    ]

    // 使用 requestIdleCallback 在浏览器空闲时预加载
    this.preloadInIdle(coreRoutes)
  }

  /**
   * 在浏览器空闲时预加载
   */
  private async preloadInIdle(routes: Array<() => Promise<any>>) {
    for (const route of routes) {
      // 检查是否被中止
      if (this.abortController?.signal.aborted) {
        console.log('[预加载] 预加载已中止')
        break
      }

      // 使用 requestIdleCallback 或 setTimeout
      await this.waitForIdle()

      try {
        await route()
        console.log('[预加载] 成功预加载一个路由组件')
      } catch (error: any) {
        // 忽略预加载错误，不影响正常流程
        if (error?.name !== 'AbortError') {
          console.warn('[预加载] 预加载失败:', error)
        }
      }
    }

    console.log('[预加载] 所有核心路由预加载完成')
    this.isPreloading = false
  }

  /**
   * 等待浏览器空闲
   */
  private waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 1000 })
      } else {
        setTimeout(resolve, 100)
      }
    })
  }

  /**
   * 使用 link 标签预加载资源（备用方案）
   */
  private prefetchWithLink(href: string) {
    if (this.preloadedChunks.has(href)) {
      return
    }

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    link.as = 'script'

    document.head.appendChild(link)
    this.preloadedChunks.add(href)
  }

  /**
   * 清理预加载状态
   */
  cleanup() {
    this.pausePreload()
    this.preloadedChunks.clear()
  }
}

// 导出单例
export const routePreloader = new RoutePreloader()
