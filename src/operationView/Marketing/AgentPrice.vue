<template>
  <div class="app-container">
    <div v-loading="loading" class="price-cards-container">
      <!-- 动态渲染代理卡片 -->
      <el-card v-for="agent in priceList" :key="agent.id" shadow="never" class="agent-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="agent-level">{{ getAgentLevelName(agent.id) }}</span>
              <el-text type="info" size="small" class="update-time">
                最后更新：{{ formatTime(agent.id) }}
              </el-text>
            </div>
            <div class="header-actions">
              <!-- 查看模式：显示"刷新"和"修改"按钮 -->
              <template v-if="!editModeMap[agent.id]">
                <el-button size="default" @click="handleRefresh"> 刷新 </el-button>
                <el-button type="primary" size="default" @click="handleEdit(agent.id)">
                  修改
                </el-button>
              </template>
              <!-- 编辑模式：显示"保存"和"取消"按钮 -->
              <template v-else>
                <el-button size="default" @click="handleCancel(agent.id)"> 取消 </el-button>
                <el-button
                  type="primary"
                  size="default"
                  :disabled="!hasChanges(agent.id)"
                  @click="handleSave(agent.id)"
                >
                  保存
                </el-button>
              </template>
            </div>
          </div>
        </template>

        <div class="price-items-grid">
          <!-- 第一行：托管 - 按时间 - 闪兑 -->
          <div class="row-first">
            <!-- 托管 -->
            <div class="price-item-card">
              <div class="item-title">托管</div>
              <div class="item-content">
                <div class="time-row">
                  <span class="time-label">65k</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].hosting_65k"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].hosting_65k }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">131k</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].hosting_131k"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].hosting_131k }}</span>
                  <span class="unit">TRX</span>
                </div>
              </div>
            </div>

            <!-- 按时间 -->
            <div class="price-item-card time-card">
              <div class="item-title">按时间</div>
              <div class="item-content time-grid">
                <div class="time-row">
                  <span class="time-label">1小时</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_1h"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_1h }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">1天</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_1d"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_1d }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">3天</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_3d"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_3d }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">7天</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_7d"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_7d }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">15天</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_15d"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_15d }}</span>
                  <span class="unit">TRX</span>
                </div>
                <div class="time-row">
                  <span class="time-label">30天</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="formDataMap[agent.id].time_30d"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ formDataMap[agent.id].time_30d }}</span>
                  <span class="unit">TRX</span>
                </div>
              </div>
            </div>

            <!-- 闪兑 -->
            <div class="price-item-card">
              <div class="item-title">闪兑</div>
              <div class="item-content">
                <div class="time-row">
                  <span class="time-label">TRX→USDT</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="getTrx2UsdtDisplay(agent.id).value"
                    :precision="2"
                    :step="1"
                    :min="0"
                    :max="100"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ getTrx2UsdtDisplay(agent.id).value }}</span>
                  <span class="unit">%</span>
                </div>
                <div class="time-row">
                  <span class="time-label">USDT→TRX</span>
                  <el-input-number
                    v-if="editModeMap[agent.id]"
                    v-model="getUsdt2TrxDisplay(agent.id).value"
                    :precision="2"
                    :step="1"
                    :min="0"
                    :max="100"
                    size="small"
                    controls-position="right"
                  />
                  <span v-else class="value-text">{{ getUsdt2TrxDisplay(agent.id).value }}</span>
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 第二行：闪租 - 按笔数 - 首次激活 - 批量下单 - 机器人价格 -->
          <div class="row-second">
            <!-- 闪租 -->
            <div class="price-item-card">
              <div class="item-title">闪租</div>
              <div class="item-content single-input">
                <el-input-number
                  v-if="editModeMap[agent.id]"
                  v-model="formDataMap[agent.id].flash"
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  size="small"
                  controls-position="right"
                />
                <span v-else class="value-text">{{ formDataMap[agent.id].flash }}</span>
                <span class="unit">TRX</span>
              </div>
            </div>

            <!-- 按笔数 -->
            <div class="price-item-card">
              <div class="item-title">按笔数</div>
              <div class="item-content single-input">
                <el-input-number
                  v-if="editModeMap[agent.id]"
                  v-model="formDataMap[agent.id].stroke"
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  size="small"
                  controls-position="right"
                />
                <span v-else class="value-text">{{ formDataMap[agent.id].stroke }}</span>
                <span class="unit">TRX</span>
              </div>
            </div>

            <!-- 首次激活 -->
            <div class="price-item-card">
              <div class="item-title">首次激活</div>
              <div class="item-content single-input">
                <el-input-number
                  v-if="editModeMap[agent.id]"
                  v-model="formDataMap[agent.id].active"
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  size="small"
                  controls-position="right"
                />
                <span v-else class="value-text">{{ formDataMap[agent.id].active }}</span>
                <span class="unit">TRX</span>
              </div>
            </div>

            <!-- 批量下单 -->
            <div class="price-item-card">
              <div class="item-title">批量下单</div>
              <div class="item-content single-input">
                <el-input-number
                  v-if="editModeMap[agent.id]"
                  v-model="formDataMap[agent.id].batch_flash"
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  size="small"
                  controls-position="right"
                />
                <span v-else class="value-text">{{ formDataMap[agent.id].batch_flash }}</span>
                <span class="unit">TRX</span>
              </div>
            </div>

            <!-- 机器人价格 -->
            <div class="price-item-card">
              <div class="item-title">机器人价格</div>
              <div class="item-content single-input">
                <el-input-number
                  v-if="editModeMap[agent.id]"
                  v-model="formDataMap[agent.id].bot_fee"
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  size="small"
                  controls-position="right"
                />
                <span v-else class="value-text">{{ formDataMap[agent.id].bot_fee }}</span>
                <span class="unit">TRX</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
import { v2GetPriceList, v2UpdateSystemPrice } from '@/api/marketing/agent_price'
import type { V1PriceListResponse } from '@/api/marketing/agent_price_types'

// 加载状态
const loading = ref(false)

// 代理价格列表数据
const priceList = ref<V1PriceListResponse[]>([])

// 编辑模式映射 - 记录每个代理是否处于编辑模式
const editModeMap = reactive<Record<number, boolean>>({})

// 获取代理级别名称
const getAgentLevelName = (id: number) => {
  const levelMap: Record<number, string> = {
    1: '一级代理',
    2: '二级代理',
    3: '三级代理',
    4: '四级代理',
    5: '五级代理',
    6: '六级代理',
    7: '七级代理',
    8: '八级代理',
    9: '九级代理',
    10: '十级代理',
    11: '十一级代理'
  }
  return levelMap[id] || `${id}级代理`
}

// 表单数据映射 - 每个代理级别一个表单
const formDataMap = reactive<Record<number, any>>({})

// 获取指定代理的闪兑显示值
const getTrx2UsdtDisplay = (agentId: number) => {
  return computed({
    get: () => {
      const formData = formDataMap[agentId]
      if (!formData) return 0
      return Number((formData.trx_2_usdt * 100).toFixed(2))
    },
    set: (val) => {
      if (formDataMap[agentId]) {
        formDataMap[agentId].trx_2_usdt = Number((val / 100).toFixed(4))
      }
    }
  })
}

const getUsdt2TrxDisplay = (agentId: number) => {
  return computed({
    get: () => {
      const formData = formDataMap[agentId]
      if (!formData) return 0
      return Number((formData.usdt_2_trx * 100).toFixed(2))
    },
    set: (val) => {
      if (formDataMap[agentId]) {
        formDataMap[agentId].usdt_2_trx = Number((val / 100).toFixed(4))
      }
    }
  })
}

// 检查指定代理是否有修改
const hasChanges = (agentId: number) => {
  const original = priceList.value.find((item) => item.id === agentId)
  const formData = formDataMap[agentId]

  if (!original || !formData) return false

  return (
    Number(formData.active) !== Number(original.active) ||
    Number(formData.time_1h) !== Number(original.time_1h) ||
    Number(formData.time_1d) !== Number(original.time_1d) ||
    Number(formData.time_3d) !== Number(original.time_3d) ||
    Number(formData.time_7d) !== Number(original.time_7d) ||
    Number(formData.time_15d) !== Number(original.time_15d) ||
    Number(formData.time_30d) !== Number(original.time_30d) ||
    Number(formData.stroke) !== Number(original.stroke) ||
    Number(formData.flash) !== Number(original.flash) ||
    Number(formData.hosting_65k) !== Number(original.hosting_65k) ||
    Number(formData.hosting_131k) !== Number(original.hosting_131k) ||
    Number(formData.trx_2_usdt) !== Number(original.trx_2_usdt) ||
    Number(formData.usdt_2_trx) !== Number(original.usdt_2_trx) ||
    Number(formData.bot_fee) !== Number(original.bot_fee) ||
    Number(formData.batch_flash) !== Number(original.batch_flash || 0)
  )
}

// 进入编辑模式
const handleEdit = (agentId: number) => {
  editModeMap[agentId] = true
}

// 刷新数据
const handleRefresh = async () => {
  await loadPriceData()
  ElMessage.success('刷新成功')
}

// 取消编辑
const handleCancel = (agentId: number) => {
  // 恢复原始数据
  const original = priceList.value.find((item) => item.id === agentId)
  if (original) {
    formDataMap[agentId] = {
      active: Number(original.active),
      time_1h: Number(original.time_1h),
      time_1d: Number(original.time_1d),
      time_3d: Number(original.time_3d),
      time_7d: Number(original.time_7d),
      time_15d: Number(original.time_15d),
      time_30d: Number(original.time_30d),
      stroke: Number(original.stroke),
      flash: Number(original.flash),
      hosting_65k: Number(original.hosting_65k),
      hosting_131k: Number(original.hosting_131k),
      trx_2_usdt: Number(original.trx_2_usdt),
      usdt_2_trx: Number(original.usdt_2_trx),
      bot_fee: Number(original.bot_fee),
      batch_flash: Number(original.batch_flash || 0)
    }
  }
  // 退出编辑模式
  editModeMap[agentId] = false
}

// 格式化时间
const formatTime = (agentId: number) => {
  const agent = priceList.value.find((item) => item.id === agentId)
  if (!agent || !agent.updated_at) return '-'
  const date = new Date(agent.updated_at * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 加载价格数据
const loadPriceData = async () => {
  loading.value = true
  try {
    const res = await v2GetPriceList({
      current_page: 1,
      order: 'created_at ASC',
      page_size: 3
    })

    // 后端返回的数据在 data.list 中
    priceList.value = res.data.list || []

    // 为每个代理级别初始化表单数据
    priceList.value.forEach((item) => {
      // 初始化编辑模式为 false
      editModeMap[item.id] = false

      formDataMap[item.id] = {
        active: Number(item.active),
        time_1h: Number(item.time_1h),
        time_1d: Number(item.time_1d),
        time_3d: Number(item.time_3d),
        time_7d: Number(item.time_7d),
        time_15d: Number(item.time_15d),
        time_30d: Number(item.time_30d),
        stroke: Number(item.stroke),
        flash: Number(item.flash),
        hosting_65k: Number(item.hosting_65k),
        hosting_131k: Number(item.hosting_131k),
        trx_2_usdt: Number(item.trx_2_usdt),
        usdt_2_trx: Number(item.usdt_2_trx),
        bot_fee: Number(item.bot_fee),
        batch_flash: Number(item.batch_flash || 0)
      }
    })
  } catch (error) {
    console.error('加载价格数据失败:', error)
    ElMessage.error('加载价格数据失败')
  } finally {
    loading.value = false
  }
}

// 保存修改
const handleSave = async (agentId: number) => {
  const formData = formDataMap[agentId]
  if (!formData) {
    ElMessage.warning('没有可保存的数据')
    return
  }

  loading.value = true
  try {
    await v2UpdateSystemPrice({
      id: agentId,
      active: formData.active,
      time_1h: formData.time_1h,
      time_1d: formData.time_1d,
      time_3d: formData.time_3d,
      time_7d: formData.time_7d,
      time_15d: formData.time_15d,
      time_30d: formData.time_30d,
      stroke: formData.stroke,
      flash: formData.flash,
      hosting_65k: formData.hosting_65k,
      hosting_131k: formData.hosting_131k,
      trx_2_usdt: formData.trx_2_usdt,
      usdt_2_trx: formData.usdt_2_trx,
      bot_fee: formData.bot_fee,
      batch_flash: formData.batch_flash
    })

    ElMessage.success('保存成功')
    // 退出编辑模式
    editModeMap[agentId] = false
    // 重新加载数据
    await loadPriceData()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadPriceData()
})

// 组件激活时重新加载数据（用于 keep-alive 缓存的组件）
onActivated(() => {
  loadPriceData()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.price-cards-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.agent-card {
  width: 100%;
}

.agent-card :deep(.el-card__body) {
  padding: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.agent-level {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.update-time {
  font-size: 13px;
}

.value-text {
  display: inline-block;
  max-width: 100px;
  min-width: 60px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-align: center;
  flex-shrink: 0;
}

.price-items-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 12px;
  contain: layout;
}

.row-first {
  display: contents;
}

.row-first > .price-item-card:nth-child(1) {
  grid-column: 1 / 2;
}

.row-first > .price-item-card:nth-child(2) {
  grid-column: 2 / 5;
}

.row-first > .price-item-card:nth-child(3) {
  grid-column: 5 / 6;
}

.row-second {
  display: contents;
}

.price-item-card {
  display: flex;
  padding: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  flex-direction: column;
  contain: layout style;
}

.item-title {
  padding-bottom: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.item-content.time-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 12px;
}

.item-content.single-input {
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-label {
  min-width: 65px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.unit {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}

:deep(.el-input-number) {
  width: auto;
  max-width: 140px;
  flex: 1;
}

:deep(.el-input-number--small) {
  width: auto;
  max-width: 120px;
  flex: 1;
}

:deep(.el-input-number--small .el-input__inner) {
  text-align: center;
}

/* 优化性能 */
* {
  box-sizing: border-box;
}

.agent-card {
  contain: layout style;
}
</style>
