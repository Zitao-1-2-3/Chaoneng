<script setup lang="tsx">
import { ref, computed, watch, nextTick } from 'vue'
import { ElRow, ElCol, ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { getMenuListApi, saveMenuApi } from '@/api/menu_list'
import { useDraggable } from '@/hooks/event/useDraggable'
import { MenuItem, MenuLayout, InnerCallback } from '@/api/menu_list/types'

// 定义预览内容区域的ref
const previewRef = ref<HTMLElement | null>(null)
// 加载状态
const loading = ref(false)

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

// 预览弹窗显示状态
const previewVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 菜单布局数据
const keyboardLayout = ref<MenuLayout>([])
// 原始菜单数据
const originalMenuList = ref<MenuItem[]>([])
// 是否有未保存的更改
const hasChanges = ref(false)

// 将一维数组转换为布局
const convertToKeyboardLayout = (list: MenuItem[]) => {
  // 保存原始数据
  originalMenuList.value = [...list]

  // 只过滤出类型为1的菜单项
  const filteredList = list.filter((item) => item.menu_type === 1 && item.status === 1)

  // 固定使用三列布局
  const columnCount = 3

  // 计算需要的行数
  const rowCount = Math.ceil(filteredList.length / columnCount)

  // 创建一个rowCount * columnCount的二维数组
  const layout: MenuLayout = Array(rowCount)
    .fill(null)
    .map(() => Array(columnCount).fill(null))

  // 根据sort值将菜单项放入对应位置
  filteredList
    .sort((a, b) => b.order_num - a.order_num)
    .forEach((item, index) => {
      if (!item || !item.menu_name) return

      const row = Math.floor(index / columnCount)
      const col = index % columnCount

      if (row < rowCount && col < columnCount) {
        layout[row][col] = {
          ...item,
          text: item.menu_name,
          // 先设置一个默认的span值，稍后会根据每行的实际情况重新计算
          span: 8
        }
      }
    })

  // 重新计算每行的span值，特别是最后一行的元素需要平分24的宽度
  for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
    const row = layout[rowIndex]
    // 计算当前行有多少个非空元素
    const validItemCount = row.filter((item) => item !== null).length

    if (validItemCount > 0) {
      // 每个元素平分24的宽度
      const span = 24 / validItemCount

      // 更新当前行每个元素的span值
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex] !== null) {
          row[colIndex]!.span = span
        }
      }
    }
  }

  console.log('过滤后的数据:', filteredList)
  console.log('布局数据:', layout)

  return layout
}

// 获取菜单数据
const fetchMenuData = async () => {
  try {
    // 设置加载状态
    loading.value = true

    // 确保DOM已更新并且previewRef已指向实际元素
    await nextTick()

    // 获取菜单数据
    const data = await getMenuListApi({})
    keyboardLayout.value = convertToKeyboardLayout(data.data.list || [])
    hasChanges.value = false
  } catch (error) {
    console.error('获取菜单预览失败:', error)
    ElMessage.error('获取菜单预览失败')
  } finally {
    // 无论成功或失败，都结束loading
    loading.value = false
  }
}

// 处理拖拽完成后的更新
const onDragEnd = (
  newLayout: MenuLayout,
  oldLayout: MenuLayout,
  startPos: { row: number; col: number },
  endPos: { row: number; col: number }
) => {
  // 更新布局并重新计算span值
  keyboardLayout.value = newLayout.map((row) => {
    const validItems = row.filter((item): item is MenuItem => item !== null)
    const span = validItems.length === 0 ? 0 : 24 / validItems.length
    return row.map((item) => (item ? { ...item, span } : null))
  })
  hasChanges.value = true
}

// 使用拖拽hook
const {
  isDragging,
  dragItem,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDrop,
  handleDragEnd
} = useDraggable({
  onDragEnd
})

// 保存菜单排序
const saveMenuOrder = async () => {
  if (!hasChanges.value) return

  try {
    // 设置加载状态
    loading.value = true

    // 从布局中提取更新后的菜单项
    const updatedMenuItems: Array<{ id: number; order_num: number }> = []

    // 计算菜单总数，用于反向排序（确保大数字在前面）
    const totalItems = keyboardLayout.value.length * 3

    for (let rowIndex = 0; rowIndex < keyboardLayout.value.length; rowIndex++) {
      const row = keyboardLayout.value[rowIndex]
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const item = row[colIndex]
        if (item) {
          // 修改计算逻辑，使数字大的在前面
          // 反向计算排序值，第一行第一个有最大的值
          const order_num = totalItems - (rowIndex * 3 + colIndex)
          updatedMenuItems.push({
            id: item.id,
            order_num
          })
        }
      }
    }

    // 准备保存请求数组
    const saveRequests = updatedMenuItems.map((item) => {
      // 查找原始数据
      const originalItem = originalMenuList.value.find((menu) => menu.id === item.id)
      // 确保originalItem存在，并且排序确实有变化才发送请求
      if (originalItem && originalItem.order_num !== item.order_num) {
        // 确保使用inner_value而不是value字段
        return saveMenuApi({
          id: originalItem.id,
          menu_name: originalItem.menu_name,
          menu_type: originalItem.menu_type,
          order_num: item.order_num,
          status: originalItem.status,
          inner_type: originalItem.inner_type,
          inner_value: originalItem.inner_value
        })
      }
      return Promise.resolve() // 如果没有变化，返回一个已解决的Promise
    })

    // 使用Promise.all并行处理所有保存请求
    const res = await Promise.all(saveRequests)
    console.log('res', res)

    ElMessage.success('菜单排序已保存')
    hasChanges.value = false

    // 重新获取最新数据
    await fetchMenuData()
  } catch (error) {
    console.error('保存菜单排序失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    // 结束加载状态
    loading.value = false
  }
}

// 监听弹窗显示状态变化
watch(
  () => previewVisible.value,
  (newVal) => {
    if (newVal) {
      fetchMenuData()
    }
  }
)

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <Dialog v-model="previewVisible" title="菜单预览" @close="handleClose">
    <div
      ref="previewRef"
      class="menu-preview"
      v-loading="loading"
      loading-text="加载中..."
      loading-background="#eeeeee7"
    >
      <el-row :gutter="20">
        <template v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex">
          <el-col :span="item?.span || 24" v-for="(item, colIndex) in row" :key="colIndex">
            <div
              v-if="item"
              class="menu-item"
              :class="{ 'is-dragging': isDragging && dragItem?.id === item?.id }"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @drop="(e) => handleDrop(rowIndex, colIndex, keyboardLayout, e)"
            >
              <el-button
                type="info"
                class="menu-button"
                draggable="true"
                @dragstart="(e) => handleDragStart(item, rowIndex, colIndex, e)"
                @dragend="handleDragEnd"
              >
                {{ item.text }}
              </el-button>
              <!-- <div 
                v-else 
                class="empty-slot"
                @dragover="handleDragOver"
                @dragenter="handleDragEnter"
                @drop="(e) => handleDrop(rowIndex, colIndex, keyboardLayout, e)"
              ></div> -->
            </div>
          </el-col>
        </template>
      </el-row>
    </div>
    <template #footer>
      <div class="preview-controls">
        <ElButton type="info" @click="handleClose"> 取消 </ElButton>
        <ElButton type="primary" @click="saveMenuOrder" :disabled="!hasChanges || loading">
          {{ loading ? '保存中...' : '保存排序' }}
        </ElButton>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.menu-preview {
  position: relative; /* 添加相对定位，使子元素可以参照它进行定位 */
  min-height: 300px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

/* 确保元素能接收loading遮罩 */
:deep(.el-loading-mask) {
  z-index: 1000;
  border-radius: 8px;
}

.menu-item {
  height: 100%;
  min-height: 48px;
  padding: 0 10px;
  margin-bottom: 20px;
}

.menu-button {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  font-size: 15px;
  word-break: break-all;
  white-space: normal;
  cursor: move;
  border-radius: 8px;
  transition: all 0.3s;
}

.menu-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.empty-slot {
  width: 100%;
  height: 48px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
}

.is-dragging .menu-button {
  opacity: 0.5;
}

.preview-controls {
  display: flex;
  margin-top: 20px;
  align-items: center;
  justify-content: flex-end;
}

.unsaved-changes-tip {
  margin-left: 10px;
  font-size: 14px;
  color: #e6a23c;
}
</style>
