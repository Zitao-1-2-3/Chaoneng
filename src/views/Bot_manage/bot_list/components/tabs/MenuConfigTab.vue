<template>
  <div class="menu-config-container" v-loading="loading" loading-text="加载中...">
    <!-- 启用区域 -->
    <div class="enabled-section">
      <div class="section-header">
        <span class="section-title">启用的菜单</span>
        <span class="section-tip">拖拽到下方禁用</span>
      </div>
      <div
        class="menu-preview"
        @dragover="handlePreviewDragOver"
        @dragleave="handlePreviewDragLeave"
        @drop="handlePreviewDrop"
      >
        <div v-if="keyboardLayout.length === 0 && !loading" class="empty-tip">暂无启用的菜单</div>
        <el-row v-else :gutter="20">
          <template v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex">
            <el-col :span="item?.span || 24" v-for="(item, colIndex) in row" :key="colIndex">
              <div
                v-if="item"
                class="menu-item"
                :class="{ 'is-dragging': isDragging && dragItem?.menu_name === item?.menu_name }"
                draggable="true"
                @dragstart="(e) => handleEnabledItemDragStart(item, rowIndex, colIndex, e)"
                @dragend="handleDragEnd"
                @dragover="handleEnabledItemDragOver"
                @drop="(e) => handleEnabledItemDrop(e, rowIndex, colIndex)"
              >
                <el-button type="info" class="menu-button">
                  {{ item.menu_name }}
                </el-button>
              </div>
            </el-col>
          </template>
        </el-row>
      </div>
    </div>

    <!-- 禁用区域 -->
    <div class="disabled-section-wrapper">
      <div class="section-header">
        <span class="section-title">禁用的菜单</span>
        <span class="section-tip">拖拽到上方启用</span>
      </div>
      <div
        class="disabled-section"
        :class="{ 'drag-over': isOverDisabledZone }"
        @dragover="handleDisabledZoneDragOver"
        @dragenter="handleDisabledZoneDragEnter"
        @dragleave="handleDisabledZoneDragLeave"
        @drop="handleDisabledZoneDrop"
      >
        <div v-if="disabledMenus.length === 0 && !loading" class="empty-tip">暂无禁用的菜单</div>
        <div v-else class="disabled-menu-list">
          <div
            v-for="item in disabledMenus"
            :key="item.menu_name"
            class="disabled-menu-item"
            :class="{ 'is-dragging': isDragging && dragItem?.menu_name === item?.menu_name }"
            draggable="true"
            @dragstart="(e) => handleDisabledItemDragStart(item, e)"
            @dragend="handleDragEnd"
          >
            <el-button type="info" plain class="disabled-menu-button">
              {{ item.menu_name }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { getBotMenuList, batchUpdateBotMenu } from '@/api/bot_menu'
import type { BotMenuItem, UpdateBotMenuItemParams } from '@/api/bot_menu/types'
import { useDraggable } from '@/hooks/event/useDraggable'

// 扩展 BotMenuItem 类型以支持拖拽和显示
interface MenuItemWithExtras extends BotMenuItem {
  span?: number
  _fromEnabled?: boolean
  _fromDisabled?: boolean
}

type MenuLayout = (MenuItemWithExtras | null)[][]

// Props
interface Props {
  botId: number
}

const props = defineProps<Props>()

// 常量定义
const COLUMN_COUNT = 3
const TOTAL_SPAN = 24

// 状态管理
const loading = ref(false)
const keyboardLayout = ref<MenuLayout>([])
const disabledMenus = ref<MenuItemWithExtras[]>([])
const originalMenuList = ref<BotMenuItem[]>([])
const isOverDisabledZone = ref(false)
const dragStartPosition = ref<{ row: number; col: number } | null>(null)

// ==================== 工具函数 ====================

/**
 * 收集布局中所有非空菜单项
 * @param layout 网格布局
 * @returns 菜单项数组
 */
const collectMenuItems = (layout: MenuLayout): MenuItemWithExtras[] => {
  return layout.flat().filter((item): item is MenuItemWithExtras => item !== null)
}

/**
 * 将菜单项数组转换为网格布局
 * 自动计算每行的 span 值以实现响应式布局
 * @param items 菜单项数组
 * @returns 网格布局（二维数组）
 */
const compactLayout = (items: MenuItemWithExtras[]): MenuLayout => {
  if (items.length === 0) return []

  const rowCount = Math.ceil(items.length / COLUMN_COUNT)
  const layout: MenuLayout = Array.from({ length: rowCount }, () => Array(COLUMN_COUNT).fill(null))

  items.forEach((item, index) => {
    const row = Math.floor(index / COLUMN_COUNT)
    const col = index % COLUMN_COUNT
    layout[row][col] = item
  })

  // 计算每行的 span 值，确保均匀分布
  return layout.map((row) => {
    const validCount = row.filter((item) => item !== null).length
    const span = validCount > 0 ? TOTAL_SPAN / validCount : 0
    return row.map((item) => (item ? { ...item, span } : null))
  })
}

/**
 * 将菜单列表转换为键盘布局
 * 分离启用和禁用的菜单，并按 order_num 排序
 * @param list 原始菜单列表
 * @returns 网格布局（仅包含启用的菜单）
 */
const convertToKeyboardLayout = (list: BotMenuItem[]): MenuLayout => {
  originalMenuList.value = [...list]

  // 分离启用和禁用的菜单 (status: 1=启用, 2=禁用)
  const enabledList = list
    .filter((item) => item.status === 1)
    .sort((a, b) => b.order_num - a.order_num)

  const disabledList = list
    .filter((item) => item.status === 2)
    .sort((a, b) => b.order_num - a.order_num)

  // 设置禁用菜单列表
  disabledMenus.value = disabledList

  // 使用 compactLayout 构建启用菜单的网格布局
  return compactLayout(enabledList)
}

// ==================== API 调用 ====================

/**
 * 获取菜单数据
 */
const fetchMenuData = async () => {
  try {
    loading.value = true
    await nextTick()
    const response = await getBotMenuList({ bot_id: props.botId })

    if (!response.data) {
      console.warn('菜单数据为空')
      keyboardLayout.value = []
      disabledMenus.value = []
      return
    }

    keyboardLayout.value = convertToKeyboardLayout(response.data)
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败，请刷新重试')
    keyboardLayout.value = []
    disabledMenus.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 保存菜单配置
 */
const saveMenuConfig = async () => {
  try {
    loading.value = true

    // 收集所有菜单项
    const enabledItems = collectMenuItems(keyboardLayout.value)
    const allItems = [...enabledItems, ...disabledMenus.value]

    if (allItems.length === 0) {
      ElMessage.warning('没有可保存的菜单项')
      return false
    }

    // 构建批量更新参数
    const updateParams: UpdateBotMenuItemParams[] = allItems.map((item) => ({
      id: item.id,
      menu_name: item.menu_name,
      order_num: item.order_num,
      status: item.status
    }))

    // 批量更新
    await batchUpdateBotMenu({
      bot_id: props.botId,
      menus: updateParams
    })

    ElMessage.success('菜单配置保存成功')

    // 重新获取最新数据
    await fetchMenuData()

    return true
  } catch (error) {
    console.error('保存菜单配置失败:', error)
    ElMessage.error('保存失败，请检查网络后重试')
    return false
  } finally {
    loading.value = false
  }
}

// ==================== 拖拽逻辑 ====================

const {
  isDragging,
  dragItem,
  handleDragEnd: originalHandleDragEnd
} = useDraggable<MenuItemWithExtras>()

// 包装 handleDragEnd 以确保总是重置状态
const handleDragEnd = () => {
  originalHandleDragEnd()
  resetDragState()
}

/**
 * 启用区域：开始拖拽
 */
const handleEnabledItemDragStart = (
  item: MenuItemWithExtras,
  rowIndex: number,
  colIndex: number,
  e: DragEvent
) => {
  if (!e.dataTransfer) return

  isDragging.value = true
  dragItem.value = { ...item, _fromEnabled: true } as MenuItemWithExtras
  dragStartPosition.value = { row: rowIndex, col: colIndex }

  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData(
    'text/plain',
    JSON.stringify({ fromEnabled: true, menu_name: item.menu_name })
  )
}

/**
 * 启用区域：拖拽悬停
 * 接受从启用区域和禁用区域的拖拽
 */
const handleEnabledItemDragOver = (e: DragEvent) => {
  if (!isDragging.value || !dragItem.value) return

  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

/**
 * 启用区域：放置
 * 处理两种情况：
 * 1. 从禁用区域拖到启用区域（启用菜单）
 * 2. 在启用区域内拖拽（排序）
 */
const handleEnabledItemDrop = (e: DragEvent, targetRow: number, targetCol: number) => {
  e.preventDefault()

  if (!isDragging.value || !dragItem.value) {
    resetDragState()
    return
  }

  const isFromDisabled = (dragItem.value as any)._fromDisabled
  const isFromEnabled = (dragItem.value as any)._fromEnabled

  // 情况1：从禁用区域拖到启用区域
  if (isFromDisabled) {
    const itemToEnable = dragItem.value
    const itemMenuName = itemToEnable.menu_name

    // 从禁用列表中移除（使用 menu_name 识别）
    const indexToRemove = disabledMenus.value.findIndex((item) => item.menu_name === itemMenuName)
    if (indexToRemove === -1) {
      resetDragState()
      return
    }

    disabledMenus.value.splice(indexToRemove, 1)

    // 添加到启用列表，保持原来的 order_num，只改变 status
    const allEnabledItems = collectMenuItems(keyboardLayout.value)
    allEnabledItems.push({
      ...itemToEnable,
      status: 1 // 只改变状态为启用
    })

    // 按 order_num 从大到小排序后重新布局
    allEnabledItems.sort((a, b) => b.order_num - a.order_num)
    keyboardLayout.value = compactLayout(allEnabledItems)

    resetDragState()
    return
  }

  // 情况2：在启用区域内拖拽排序
  if (isFromEnabled && dragStartPosition.value) {
    const { row: startRow, col: startCol } = dragStartPosition.value

    // 拖到同一位置，不处理
    if (startRow === targetRow && startCol === targetCol) {
      resetDragState()
      return
    }

    // 收集所有启用的菜单项
    const allEnabledItems = collectMenuItems(keyboardLayout.value)
    const draggedItem = allEnabledItems.find((item) => item.menu_name === dragItem.value!.menu_name)
    const targetItem = keyboardLayout.value[targetRow]?.[targetCol]

    if (!draggedItem || !targetItem) {
      resetDragState()
      return
    }

    // 交换 order_num（只在启用区域内互换时交换）
    const tempOrderNum = draggedItem.order_num
    draggedItem.order_num = targetItem.order_num
    targetItem.order_num = tempOrderNum

    // 重新排序并布局（从大到小排序）
    allEnabledItems.sort((a, b) => b.order_num - a.order_num)
    keyboardLayout.value = compactLayout(allEnabledItems)

    resetDragState()
  }
}

/**
 * 重置拖拽状态
 * 清除所有拖拽相关的临时状态
 */
const resetDragState = () => {
  isDragging.value = false
  dragItem.value = null
  dragStartPosition.value = null
  isOverDisabledZone.value = false
}

/**
 * 禁用区域：拖拽悬停
 */
const handleDisabledZoneDragOver = (e: DragEvent) => {
  if (!isDragging.value || !(dragItem.value as any)?._fromEnabled) return

  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

/**
 * 禁用区域：进入
 */
const handleDisabledZoneDragEnter = (e: DragEvent) => {
  if (!isDragging.value || !(dragItem.value as any)?._fromEnabled) return

  e.preventDefault()
  isOverDisabledZone.value = true
}

/**
 * 禁用区域：离开
 */
const handleDisabledZoneDragLeave = (e: DragEvent) => {
  const target = e.currentTarget as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement
  if (target && !target.contains(relatedTarget)) {
    isOverDisabledZone.value = false
  }
}

/**
 * 禁用区域：放置（启用→禁用）
 * 保持原有 order_num，只改变 status
 */
const handleDisabledZoneDrop = (e: DragEvent) => {
  e.preventDefault()
  isOverDisabledZone.value = false

  if (!dragItem.value || !(dragItem.value as any)._fromEnabled) {
    resetDragState()
    return
  }

  const itemToDisable = dragItem.value
  const itemMenuName = itemToDisable.menu_name

  // 从启用列表中移除（使用 menu_name 识别）
  const allEnabledItems = collectMenuItems(keyboardLayout.value)
  const itemIndex = allEnabledItems.findIndex((item) => item.menu_name === itemMenuName)

  if (itemIndex === -1) {
    resetDragState()
    return
  }

  const updatedEnabledItems = allEnabledItems.filter((item) => item.menu_name !== itemMenuName)

  // 添加到禁用列表，保持原来的 order_num，只改变 status
  disabledMenus.value.push({
    ...itemToDisable,
    status: 2 // 只改变状态为禁用
  })

  // 按 order_num 从大到小排序禁用列表
  disabledMenus.value.sort((a, b) => b.order_num - a.order_num)

  // 重新布局启用区域
  keyboardLayout.value = compactLayout(updatedEnabledItems)

  resetDragState()
}

/**
 * 禁用区域：开始拖拽
 */
const handleDisabledItemDragStart = (item: MenuItemWithExtras, e: DragEvent) => {
  if (!e.dataTransfer) return

  isDragging.value = true
  dragItem.value = { ...item, _fromDisabled: true } as MenuItemWithExtras

  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData(
    'text/plain',
    JSON.stringify({ fromDisabled: true, menu_name: item.menu_name })
  )
}

/**
 * 预览区域：拖拽悬停
 */
const handlePreviewDragOver = (e: DragEvent) => {
  if (!isDragging.value || !dragItem.value) return

  const isFromDisabled = (dragItem.value as any)._fromDisabled
  const isFromEnabled = (dragItem.value as any)._fromEnabled

  if (isFromDisabled || isFromEnabled) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }
}

/**
 * 预览区域：离开
 */
const handlePreviewDragLeave = (e: DragEvent) => {
  e.preventDefault()
  // 预留：可以在这里添加视觉反馈
}

/**
 * 预览区域：放置（禁用→启用）
 * 保持原有 order_num，只改变 status
 */
const handlePreviewDrop = (e: DragEvent) => {
  e.preventDefault()

  if (!isDragging.value || !dragItem.value) {
    resetDragState()
    return
  }

  const isFromDisabled = (dragItem.value as any)._fromDisabled

  if (!isFromDisabled) {
    // 启用区域内部拖拽，不在这里处理
    resetDragState()
    return
  }

  const itemToEnable = dragItem.value
  const itemMenuName = itemToEnable.menu_name

  // 从禁用列表中移除（使用 menu_name 识别）
  const indexToRemove = disabledMenus.value.findIndex((item) => item.menu_name === itemMenuName)
  if (indexToRemove === -1) {
    resetDragState()
    return
  }

  disabledMenus.value.splice(indexToRemove, 1)

  // 添加到启用列表，保持原来的 order_num，只改变 status
  const allEnabledItems = collectMenuItems(keyboardLayout.value)
  allEnabledItems.push({
    ...itemToEnable,
    status: 1 // 只改变状态为启用
  })

  // 按 order_num 从大到小排序后重新布局
  allEnabledItems.sort((a, b) => b.order_num - a.order_num)
  keyboardLayout.value = compactLayout(allEnabledItems)

  resetDragState()
}

defineExpose({ fetchMenuData, saveMenuConfig })
</script>

<style scoped>
.menu-config-container {
  position: relative;
  min-height: 400px;
}

:deep(.el-loading-mask) {
  z-index: 1000;
  border-radius: 8px;
}

/* 启用区域样式 */
.enabled-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #f0f2f5;
  border-left: 3px solid #67c23a;
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #67c23a;
}

.section-tip {
  font-size: 14px;
  font-weight: bold;
  color: #000;
}

.menu-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 150px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border: 2px dashed #d0d7de;
  border-radius: 8px;
  transition: all 0.3s;
}

.menu-preview.drag-over {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #67c23a;
  box-shadow: 0 0 20px rgb(103 194 58 / 20%);
}

.menu-item {
  height: 100%;
  min-height: 36px;
  padding: 0 8px;
  margin-bottom: 12px;
  cursor: move;
  transition: all 0.3s;
}

.menu-button {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  word-break: break-all;
  white-space: normal;
  pointer-events: none;
  cursor: move;
  border-radius: 6px;
  transition: all 0.3s;
}

.menu-item:hover .menu-button {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.is-dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

/* 禁用区域样式 */
.disabled-section-wrapper {
  margin-top: 20px;
}

.disabled-section {
  display: flex;
  min-height: 120px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border: 2px dashed #d0d7de;
  border-radius: 8px;
  transition: all 0.3s;
}

.disabled-section.drag-over {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-color: #f56c6c;
  box-shadow: 0 0 20px rgb(245 108 108 / 20%);
}

.disabled-section-wrapper .section-header {
  border-left-color: #f56c6c;
}

.disabled-section-wrapper .section-title {
  color: #f56c6c;
}

.disabled-menu-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.disabled-menu-item {
  cursor: move;
  transition: all 0.3s;
}

.disabled-menu-item:hover {
  transform: translateY(-2px);
}

.disabled-menu-item.is-dragging {
  opacity: 0.5;
}

.disabled-menu-button {
  height: 32px;
  padding: 6px 12px;
  font-size: 13px;
  pointer-events: none;
  cursor: move;
  border-radius: 4px;
  transition: all 0.3s;
}

.disabled-menu-item:hover .disabled-menu-button {
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  padding: 0;
  font-size: 13px;
  color: #909399;
}
</style>
