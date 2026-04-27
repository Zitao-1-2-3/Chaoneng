<template>
  <div class="menu-config-container" v-loading="loading" loading-text="加载中...">
    <!-- 启用区域 -->
    <div class="enabled-section">
      <div class="section-header">
        <span class="section-title">启用的菜单</span>
        <span class="section-tip">拖到下方禁用</span>
      </div>
      <div
        class="menu-preview"
        @dragover="handlePreviewDragOver"
        @dragleave="handlePreviewDragLeave"
        @drop="handlePreviewDrop"
      >
        <el-row :gutter="20">
          <template v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex">
            <el-col :span="item?.span || 24" v-for="(item, colIndex) in row" :key="colIndex">
              <div
                v-if="item"
                class="menu-item"
                :class="{ 'is-dragging': isDragging && dragItem?.id === item?.id }"
              >
                <el-button
                  type="info"
                  class="menu-button"
                  draggable="true"
                  @dragstart="(e) => handleEnabledItemDragStart(item, e)"
                  @dragend="handleDragEnd"
                >
                  {{ item.text }}
                </el-button>
              </div>
            </el-col>
          </template>
        </el-row>
        <div v-if="keyboardLayout.length === 0 && !loading" class="empty-tip">暂无启用的菜单</div>
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
        <div class="disabled-menu-list">
          <div
            v-for="item in disabledMenus"
            :key="item.id"
            class="disabled-menu-item"
            :class="{ 'is-dragging': isDragging && dragItem?.id === item?.id }"
            draggable="true"
            @dragstart="(e) => handleDisabledItemDragStart(item, e)"
            @dragend="handleDragEnd"
          >
            <el-button type="info" plain class="disabled-menu-button">
              {{ item.text }}
            </el-button>
          </div>
          <div v-if="disabledMenus.length === 0" class="empty-tip">暂无禁用的菜单</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getMenuListApi, saveMenuApi } from '@/api/menu_list'
import { useDraggable } from '@/hooks/event/useDraggable'
import type { MenuItem, MenuLayout } from '@/api/menu_list/types'

// 接收 bot_id 作为 prop
const props = defineProps<{
  botId?: number
}>()

const loading = ref(false)
const keyboardLayout = ref<MenuLayout>([])
const disabledMenus = ref<MenuItem[]>([])
const originalMenuList = ref<MenuItem[]>([])
const isOverDisabledZone = ref(false)
const isOverEnabledZone = ref(false)

// 提取公共函数：压缩布局
const compactLayout = (items: MenuItem[]): MenuLayout => {
  if (items.length === 0) return []

  const columnCount = 3
  const rowCount = Math.ceil(items.length / columnCount)
  const layout: MenuLayout = Array(rowCount)
    .fill(null)
    .map(() => Array(columnCount).fill(null))

  items.forEach((item, index) => {
    const row = Math.floor(index / columnCount)
    const col = index % columnCount
    if (row < rowCount && col < columnCount) {
      layout[row][col] = item
    }
  })

  // 计算每行的 span
  return layout.map((row) => {
    const validItems = row.filter((item): item is MenuItem => item !== null)
    const span = validItems.length === 0 ? 0 : 24 / validItems.length
    return row.map((item) => (item ? { ...item, span } : null))
  })
}

// 提取公共函数：收集所有非空菜单项
const collectMenuItems = (layout: MenuLayout): MenuItem[] => {
  const items: MenuItem[] = []
  layout.forEach((row) => {
    row.forEach((item) => {
      if (item !== null) {
        items.push(item)
      }
    })
  })
  return items
}

const convertToKeyboardLayout = (list: MenuItem[]) => {
  originalMenuList.value = [...list]

  // 分离启用和禁用的菜单
  const enabledList = list.filter((item) => item.menu_type === 1 && item.status === 1)
  const disabledList = list.filter((item) => item.menu_type === 1 && item.status === 2)

  // 设置禁用菜单列表
  disabledMenus.value = disabledList
    .sort((a, b) => b.order_num - a.order_num)
    .map((item) => ({ ...item, text: item.menu_name }))

  // 构建启用菜单的网格布局
  const columnCount = 3
  const rowCount = Math.ceil(enabledList.length / columnCount)
  const layout: MenuLayout = Array(rowCount)
    .fill(null)
    .map(() => Array(columnCount).fill(null))

  enabledList
    .sort((a, b) => b.order_num - a.order_num)
    .forEach((item, index) => {
      if (!item || !item.menu_name) return
      const row = Math.floor(index / columnCount)
      const col = index % columnCount
      if (row < rowCount && col < columnCount) {
        layout[row][col] = { ...item, text: item.menu_name, span: 8 }
      }
    })

  for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
    const row = layout[rowIndex]
    const validItemCount = row.filter((item) => item !== null).length
    if (validItemCount > 0) {
      const span = 24 / validItemCount
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex] !== null) row[colIndex]!.span = span
      }
    }
  }
  return layout
}

const fetchMenuData = async () => {
  try {
    loading.value = true
    await nextTick()
    console.log('🔵 开始调用菜单列表API: getMenuListApi')
    const data = await getMenuListApi({})
    console.log('🟢 菜单列表API返回数据:', data)
    keyboardLayout.value = convertToKeyboardLayout(data.data.list || [])
  } catch (error) {
    console.error('🔴 获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败')
  } finally {
    loading.value = false
  }
}

const onDragEnd = (newLayout: MenuLayout) => {
  // 使用公共函数收集和压缩布局
  const allItems = collectMenuItems(newLayout)
  keyboardLayout.value = compactLayout(allItems)
}

const { isDragging, dragItem, handleDragEnd } = useDraggable({ onDragEnd })

// 处理启用区域按钮的拖拽开始（只能拖到禁用区域）
const handleEnabledItemDragStart = (item: MenuItem, e: DragEvent) => {
  isDragging.value = true
  dragItem.value = { ...item, _fromEnabled: true } as MenuItem // 添加标记

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ fromEnabled: true }))
  }
}

// 处理禁用区域的拖拽事件
const handleDisabledZoneDragOver = (e: DragEvent) => {
  if (!isDragging.value) return

  // 只接受从启用区域拖来的
  if ((dragItem.value as any)?._fromEnabled) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }
}

const handleDisabledZoneDragEnter = (e: DragEvent) => {
  if (!isDragging.value) return

  // 只接受从启用区域拖来的
  if ((dragItem.value as any)?._fromEnabled) {
    e.preventDefault()
    isOverDisabledZone.value = true
  }
}

const handleDisabledZoneDragLeave = (e: DragEvent) => {
  // 检查是否真的离开了禁用区域（而不是进入子元素）
  const target = e.currentTarget as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement
  if (target && !target.contains(relatedTarget)) {
    isOverDisabledZone.value = false
  }
}

const handleDisabledZoneDrop = async (e: DragEvent) => {
  e.preventDefault()
  isOverDisabledZone.value = false

  if (!dragItem.value) return

  // 只处理从启用区域拖来的（跨区域拖拽）
  if (!(dragItem.value as any)._fromEnabled) {
    console.log('⚠️ 禁用区域内部拖拽，不调用接口')
    return
  }

  const itemToDisable = dragItem.value

  // 立即调用接口保存状态
  try {
    loading.value = true
    const originalItem = originalMenuList.value.find((menu) => menu.id === itemToDisable.id)
    if (originalItem) {
      const payload = {
        id: originalItem.id,
        menu_name: originalItem.menu_name,
        menu_type: originalItem.menu_type,
        order_num: originalItem.order_num,
        status: 2, // 禁用
        inner_type: originalItem.inner_type,
        inner_value: originalItem.inner_value,
        callback_type: originalItem.callback_type || ''
      }
      console.log('🔵 从启用拖到禁用，调用 saveMenuApi:', payload)
      await saveMenuApi(payload)

      ElMessage.success(`已将"${itemToDisable.text}"禁用`)

      // 更新成功后重新获取列表
      console.log('🔄 更新成功，重新获取菜单列表')
      await fetchMenuData()
    }
  } catch (error) {
    console.error('🔴 禁用菜单失败:', error)
    ElMessage.error('禁用失败，请重试')
    // 失败时回滚
    await fetchMenuData()
  } finally {
    loading.value = false
  }
}

// 处理从禁用区域拖拽菜单
const handleDisabledItemDragStart = (item: MenuItem, e: DragEvent) => {
  isDragging.value = true
  dragItem.value = { ...item, _fromDisabled: true } as MenuItem // 添加标记

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ fromDisabled: true }))
  }
}

// 处理拖拽到预览区域空白处（只接受从禁用区域拖来的）
const handlePreviewDragOver = (e: DragEvent) => {
  if (!isDragging.value || !dragItem.value) return

  // 检查是否从禁用区域拖拽（通过 dragItem 的标记判断）
  if ((dragItem.value as any)._fromDisabled) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    isOverEnabledZone.value = true
  } else {
    // 如果不是从禁用区域拖来的，不允许放置
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none'
    }
  }
}

const handlePreviewDragLeave = (e: DragEvent) => {
  const target = e.currentTarget as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement
  if (target && !target.contains(relatedTarget)) {
    isOverEnabledZone.value = false
  }
}

const handlePreviewDrop = async (e: DragEvent) => {
  if (!isDragging.value || !dragItem.value) return

  e.preventDefault()
  isOverEnabledZone.value = false

  // 检查是否从禁用区域拖拽（通过 dragItem 的标记判断）
  const isFromDisabled = (dragItem.value as any)._fromDisabled

  if (!isFromDisabled) {
    // 如果不是从禁用区域拖来的，说明是启用区域内部拖拽，不调用接口
    console.log('⚠️ 启用区域内部拖拽，不调用接口')
    isDragging.value = false
    dragItem.value = null
    return
  }

  // 只处理从禁用区域拖来的（跨区域拖拽）
  const itemToEnable = dragItem.value

  // 立即调用接口保存状态
  try {
    loading.value = true
    const originalItem = originalMenuList.value.find((menu) => menu.id === itemToEnable.id)
    if (originalItem) {
      const payload = {
        id: originalItem.id,
        menu_name: originalItem.menu_name,
        menu_type: originalItem.menu_type,
        order_num: originalItem.order_num,
        status: 1, // 启用
        inner_type: originalItem.inner_type,
        inner_value: originalItem.inner_value,
        callback_type: originalItem.callback_type || ''
      }
      console.log('🔵 从禁用拖到启用，调用 saveMenuApi:', payload)
      await saveMenuApi(payload)

      ElMessage.success(`已将"${itemToEnable.text}"启用`)

      // 更新成功后重新获取列表
      console.log('🔄 更新成功，重新获取菜单列表')
      await fetchMenuData()
    }
  } catch (error) {
    console.error('🔴 启用菜单失败:', error)
    ElMessage.error('启用失败，请重试')
    // 失败时回滚
    await fetchMenuData()
  } finally {
    loading.value = false
    isDragging.value = false
    dragItem.value = null
  }
}

defineExpose({ fetchMenuData })
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
  border-left: 3px solid #909399;
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.section-tip {
  font-size: 12px;
  color: #909399;
}

.menu-preview {
  position: relative;
  min-height: 150px;
  padding: 15px;
  background-color: #f5f7fa;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.3s;
}

.menu-preview.drag-over {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.menu-preview.drag-from-enabled {
  background-color: #fdf6ec;
  border-color: #e6a23c;
}

.menu-item {
  height: 100%;
  min-height: 36px;
  padding: 0 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.menu-button {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  word-break: break-all;
  white-space: normal;
  cursor: move;
  border-radius: 6px;
  transition: all 0.3s;
}

.menu-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.is-dragging .menu-button {
  opacity: 0.5;
  transform: scale(0.95);
}

/* 禁用区域样式 */
.disabled-section-wrapper {
  margin-top: 20px;
}

.disabled-section {
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
  border-left-color: #c0c4cc;
}

.disabled-menu-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  padding: 5px;
}

.disabled-menu-item {
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
  cursor: move;
  border-radius: 4px;
  transition: all 0.3s;
}

.disabled-menu-button:hover {
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.empty-tip {
  padding: 30px 0;
  font-size: 13px;
  color: #909399;
  text-align: center;
}
</style>
