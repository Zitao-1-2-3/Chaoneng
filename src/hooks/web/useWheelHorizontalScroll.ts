/**
 * 表格滚轮横向滚动 Hook
 *
 * 用于在表格上使用鼠标滚轮进行横向滚动
 *
 * @example
 * ```vue
 * <template>
 *   <div ref="tableWrapperRef">
 *     <Table ... />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { useWheelHorizontalScroll } from '@/hooks/web/useWheelHorizontalScroll'
 *
 * const tableWrapperRef = ref<HTMLElement | null>(null)
 * useWheelHorizontalScroll(tableWrapperRef)
 * </script>
 * ```
 */

import { onMounted, onBeforeUnmount, Ref } from 'vue'

export interface UseWheelHorizontalScrollOptions {
  /**
   * 滚动容器的选择器列表（按优先级尝试）
   * 默认会依次尝试：
   * - .el-scrollbar__wrap（Element Plus 新版滚动容器）
   * - .el-table__body-wrapper（Element Plus 老版表格滚动容器）
   */
  scrollSelectors?: string[]

  /**
   * 滚动速度倍数
   * @default 1
   */
  speed?: number

  /**
   * 是否在按住 Shift 时禁用（让浏览器原生横向滚动生效）
   * @default true
   */
  disableOnShift?: boolean
}

/**
 * 查找第一个具有横向滚动的容器
 */
function findHorizontalScrollContainer(
  wrapper: HTMLElement,
  selectors: string[]
): HTMLElement | null {
  for (const selector of selectors) {
    const elements = Array.from(wrapper.querySelectorAll<HTMLElement>(selector))
    for (const el of elements) {
      if (el.scrollWidth > el.clientWidth) {
        return el
      }
    }
  }
  return null
}

/**
 * 表格滚轮横向滚动
 * @param wrapperRef 包裹表格的容器元素引用
 * @param options 配置选项
 */
export function useWheelHorizontalScroll(
  wrapperRef: Ref<HTMLElement | null>,
  options: UseWheelHorizontalScrollOptions = {}
) {
  const {
    scrollSelectors = ['.el-scrollbar__wrap', '.el-table__body-wrapper'],
    speed = 1,
    disableOnShift = true
  } = options

  const handleWheelScroll = (e: WheelEvent) => {
    if (!wrapperRef.value) return

    // 如果用户按住 shift，浏览器本身已经会横向滚动，这里不重复处理
    if (disableOnShift && e.shiftKey) return

    // 查找第一个有横向滚动的容器
    const scrollWrapper = findHorizontalScrollContainer(wrapperRef.value, scrollSelectors)
    if (!scrollWrapper) return

    // 阻止默认的纵向滚动，转为横向
    e.preventDefault()
    scrollWrapper.scrollLeft += e.deltaY * speed
  }

  onMounted(() => {
    wrapperRef.value?.addEventListener('wheel', handleWheelScroll, { passive: false })
  })

  onBeforeUnmount(() => {
    wrapperRef.value?.removeEventListener('wheel', handleWheelScroll)
  })

  return {
    handleWheelScroll
  }
}
