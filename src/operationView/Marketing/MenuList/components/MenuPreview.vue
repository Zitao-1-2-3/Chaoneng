<script setup lang="tsx">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { getBotMenuList } from '@/api/menu_list'
import type { BotMenuItem } from '@/api/menu_list/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

// 预览弹窗显示状态
const previewVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 加载状态
const loading = ref(false)

// 菜单列表
const menuList = ref<BotMenuItem[]>([])

// 常量定义
const COLUMN_COUNT = 3
const TOTAL_SPAN = 24

// 扩展菜单项类型
interface MenuItemWithExtras extends BotMenuItem {
  span?: number
}

type MenuLayout = (MenuItemWithExtras | null)[][]

// 启用的菜单（按 order_num 从大到小排序）
const enabledMenus = computed(() => {
  return menuList.value
    .filter((item) => item.status === 1)
    .sort((a, b) => b.order_num - a.order_num)
})

// 禁用的菜单（按 order_num 从大到小排序）
const disabledMenus = computed(() => {
  return menuList.value
    .filter((item) => item.status === 2)
    .sort((a, b) => b.order_num - a.order_num)
})

// 将启用的菜单转换为网格布局
const keyboardLayout = computed<MenuLayout>(() => {
  const items = enabledMenus.value
  if (items.length === 0) return []

  const rowCount = Math.ceil(items.length / COLUMN_COUNT)
  const layout: MenuLayout = Array.from({ length: rowCount }, () => Array(COLUMN_COUNT).fill(null))

  items.forEach((item, index) => {
    const row = Math.floor(index / COLUMN_COUNT)
    const col = index % COLUMN_COUNT
    layout[row][col] = item
  })

  // 计算每行的 span
  return layout.map((row) => {
    const validCount = row.filter((item) => item !== null).length
    const span = validCount > 0 ? TOTAL_SPAN / validCount : 0
    return row.map((item) => (item ? { ...item, span } : null))
  })
})

// 获取菜单列表
const fetchMenuList = async () => {
  try {
    loading.value = true
    const response = await getBotMenuList({ bot_id: 0 })
    if (response.code === '000000' && response.data) {
      menuList.value = Array.isArray(response.data) ? response.data : []
    } else {
      menuList.value = []
    }
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error('获取菜单列表失败')
    menuList.value = []
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('update:modelValue', false)
}

// 监听弹窗显示状态变化
watch(
  () => previewVisible.value,
  (newVal) => {
    if (newVal) {
      fetchMenuList()
    }
  }
)
</script>

<template>
  <Dialog v-model="previewVisible" title="菜单预览" width="900px" @close="handleClose">
    <div class="menu-preview-container" v-loading="loading" loading-text="加载中...">
      <!-- 启用区域 -->
      <div class="enabled-section">
        <div class="section-header">
          <span class="section-title">启用的菜单</span>
          <span class="section-count">{{ enabledMenus.length }} 个</span>
        </div>
        <div class="menu-preview">
          <div v-if="keyboardLayout.length === 0 && !loading" class="empty-tip">
            暂无启用的菜单
          </div>
          <el-row v-else :gutter="20">
            <template v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex">
              <el-col :span="item?.span || 24" v-for="(item, colIndex) in row" :key="colIndex">
                <div v-if="item" class="menu-item">
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
          <span class="section-count">{{ disabledMenus.length }} 个</span>
        </div>
        <div class="disabled-section">
          <div v-if="disabledMenus.length === 0 && !loading" class="empty-tip">
            暂无禁用的菜单
          </div>
          <div v-else class="disabled-menu-list">
            <div v-for="item in disabledMenus" :key="item.id" class="disabled-menu-item">
              <el-button type="info" plain class="disabled-menu-button">
                {{ item.menu_name }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.menu-preview-container {
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

.section-count {
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
  border-radius: 6px;
  transition: all 0.3s;
}

.menu-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
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
  transition: all 0.3s;
}

.disabled-menu-item:hover {
  transform: translateY(-2px);
}

.disabled-menu-button {
  height: 32px;
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.3s;
}

.disabled-menu-button:hover {
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
