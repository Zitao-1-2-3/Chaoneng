import { ref } from 'vue'

export interface Position {
  row: number
  col: number
}

export function useDraggable<T = any>() {
  // 是否正在拖拽中
  const isDragging = ref(false)
  // 当前拖拽的元素信息
  const dragItem = ref<T | null>(null)

  // 拖拽结束处理
  const handleDragEnd = () => {
    isDragging.value = false
    dragItem.value = null
  }

  return {
    isDragging,
    dragItem,
    handleDragEnd
  }
}
