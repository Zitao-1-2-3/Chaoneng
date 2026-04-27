import { ref } from 'vue'
import { MenuItem, MenuLayout } from '@/api/menu_list/types'

export interface Position {
  row: number
  col: number
}

export interface DraggableOptions {
  // 放置元素后的回调，返回新的排序结果
  onDragEnd?: (
    newLayout: MenuLayout,
    oldLayout: MenuLayout,
    startPos: Position,
    endPos: Position
  ) => void
  // 开始拖拽时的回调
  onDragStart?: (item: MenuItem, position: Position) => void
  // 拖拽中的回调
  onDragging?: (event: DragEvent) => void
}

export function useDraggable(options: DraggableOptions = {}) {
  // 是否正在拖拽中
  const isDragging = ref(false)
  // 当前拖拽的元素信息
  const dragItem = ref<MenuItem | null>(null)
  // 拖拽开始位置
  const dragStartPosition = ref<Position | null>(null)

  // 开始拖拽处理
  const handleDragStart = (
    item: MenuItem,
    rowIndex: number,
    colIndex: number,
    event: DragEvent
  ) => {
    if (!item) return

    isDragging.value = true
    dragItem.value = item
    dragStartPosition.value = { row: rowIndex, col: colIndex }

    // 设置拖拽时的透明度
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      // 创建一个透明的拖拽图像
      const dragImage = document.createElement('div')
      dragImage.style.width = '1px'
      dragImage.style.height = '1px'
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, 0, 0)

      // 存储拖拽位置信息
      event.dataTransfer.setData(
        'text/plain',
        JSON.stringify({
          row: rowIndex,
          col: colIndex
        })
      )
    }

    // 调用外部传入的拖拽开始回调
    if (options.onDragStart) {
      options.onDragStart(item, { row: rowIndex, col: colIndex })
    }
  }

  // 拖拽中处理
  const handleDragging = (event: DragEvent) => {
    if (!isDragging.value) return

    if (options.onDragging) {
      options.onDragging(event)
    }
  }

  // 拖拽放置区域处理
  const handleDragOver = (event: DragEvent) => {
    if (!isDragging.value) return

    // 允许放置
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  // 拖拽进入元素
  const handleDragEnter = (event: DragEvent) => {
    if (!isDragging.value) return
    event.preventDefault()
  }

  // 处理拖拽放置
  const handleDrop = (rowIndex: number, colIndex: number, layout: MenuLayout, event: DragEvent) => {
    if (!isDragging.value || !dragStartPosition.value) return

    event.preventDefault()

    // 保存拖拽前的布局
    const oldLayout = JSON.parse(JSON.stringify(layout))

    // 获取拖拽的开始位置
    const { row: startRow, col: startCol } = dragStartPosition.value
    const endPos = { row: rowIndex, col: colIndex }

    // 如果拖到了同一个位置，则不处理
    if (startRow === rowIndex && startCol === colIndex) {
      isDragging.value = false
      dragItem.value = null
      dragStartPosition.value = null
      return
    }

    // 创建新布局并交换位置
    const newLayout = JSON.parse(JSON.stringify(layout))

    // 保存被拖拽的项和目标位置项
    const draggedItem = newLayout[startRow][startCol]
    const targetItem = newLayout[rowIndex][colIndex]

    // 如果有目标项，则交换sort值
    if (targetItem) {
      const tempSort = draggedItem.order_num
      draggedItem.order_num = targetItem.order_num
      targetItem.order_num = tempSort

      // 交换位置
      newLayout[startRow][startCol] = targetItem
      newLayout[rowIndex][colIndex] = draggedItem
    } else {
      // 如果目标位置为空，则计算新的sort值
      const newSort = rowIndex * 3 + colIndex + 1
      draggedItem.order_num = newSort

      // 移动到新位置
      newLayout[startRow][startCol] = null
      newLayout[rowIndex][colIndex] = draggedItem
    }

    // 调用拖拽结束回调
    if (options.onDragEnd) {
      options.onDragEnd(newLayout, oldLayout, dragStartPosition.value, endPos)
    }

    // 重置拖拽状态
    isDragging.value = false
    dragItem.value = null
    dragStartPosition.value = null
  }

  // 拖拽结束处理
  const handleDragEnd = () => {
    isDragging.value = false
    dragItem.value = null
    dragStartPosition.value = null
  }

  return {
    isDragging,
    dragItem,
    handleDragStart,
    handleDragging,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleDragEnd
  }
}
