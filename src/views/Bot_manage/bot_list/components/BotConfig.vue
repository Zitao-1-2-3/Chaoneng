<template>
  <Dialog v-model="dialogVisible" title="机器人配置" width="1200px" max-height="600px">
    <div v-loading="loading">
      <ElTabs v-model="activeTab" @change="handleTabChange">
        <ElTabPane label="机器人信息" name="botInfo">
          <BotInfoTab
            ref="botInfoTabRef"
            :tg-status="tgStatus"
            :syncing="syncing"
            @sync-tg-status="syncTgStatus"
          />
        </ElTabPane>

        <ElTabPane label="收款配置" name="payment">
          <PaymentTab ref="paymentTabRef" />
        </ElTabPane>

        <ElTabPane label="时间能量价格" name="timeEnergy">
          <TimeEnergyTab ref="timeEnergyTabRef" :agent-prices="agentPrices" />
        </ElTabPane>

        <ElTabPane label="笔数能量价格" name="countEnergy">
          <CountEnergyTab ref="countEnergyTabRef" :agent-prices="agentPrices" />
        </ElTabPane>

        <ElTabPane label="托管模式价格" name="managedMode">
          <ManagedModeTab ref="managedModeTabRef" :agent-prices="agentPrices" />
        </ElTabPane>

        <ElTabPane label="批量下单价格" name="batchOrder">
          <BatchOrderTab ref="batchOrderTabRef" :agent-prices="agentPrices" />
        </ElTabPane>

        <ElTabPane label="闪兑配置" name="flashExchange">
          <FlashExchangeTab ref="flashExchangeTabRef" :agent-prices="agentPrices" />
        </ElTabPane>

        <ElTabPane label="福利板块" name="welfarePrice">
          <WelfarePriceTab ref="welfarePriceTabRef" :agent-prices="agentPrices" />
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="close" :disabled="submitting">取消</ElButton>
        <ElButton type="primary" @click="submit" :loading="submitting">保存配置</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElButton, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { useBotConfig, useFormValidation } from './composables'

// 导入各标签页组件
import BotInfoTab from './tabs/BotInfoTab.vue'
import PaymentTab from './tabs/PaymentTab.vue'
import TimeEnergyTab from './tabs/TimeEnergyTab.vue'
import CountEnergyTab from './tabs/CountEnergyTab.vue'
import ManagedModeTab from './tabs/ManagedModeTab.vue'
import BatchOrderTab from './tabs/BatchOrderTab.vue'
import FlashExchangeTab from './tabs/FlashExchangeTab.vue'
import WelfarePriceTab from './tabs/WelfarePriceTab.vue'

// 组件引用
const botInfoTabRef = ref()
const paymentTabRef = ref()
const timeEnergyTabRef = ref()
const countEnergyTabRef = ref()
const managedModeTabRef = ref()
const batchOrderTabRef = ref()
const flashExchangeTabRef = ref()
const welfarePriceTabRef = ref()

// 使用机器人配置组合函数
const {
  dialogVisible,
  activeTab,
  currentBot,
  tgStatus,
  syncing,
  loading,
  submitting,
  agentPrices,
  syncTgStatus,
  loadBotAllConfigs,
  submitConfig
} = useBotConfig()

// 添加tab切换处理函数
const handleTabChange = async (tabName: string) => {
  console.log('切换到标签页:', tabName)
  if (!currentBot.value.id) return

  const formMethods = getFormMethods()
  const currentFormMethod = formMethods[tabName]
  console.log('currentFormMethod', currentFormMethod)
  // 检查formMethods是否存在
  if (!currentFormMethod) {
    console.warn(`Tab ${tabName} 的formMethods未找到`)
    return
  }

  loading.value = true
  try {
    // 直接加载数据，不再检查是否有数据
    await loadBotAllConfigs(currentBot.value.id, { [tabName]: currentFormMethod })
  } catch (error) {
    console.error(`加载 ${tabName} 数据失败:`, error)
    ElMessage.error(`加载${tabName}配置失败，请重试`)
  } finally {
    loading.value = false
  }
}

// 监听tab变化
watch(activeTab, (newTab) => {
  handleTabChange(newTab)
})

const emit = defineEmits(['success', 'close'])

// TG状态同步
const handleSyncTgStatus = () => {
  syncTgStatus()
}

// 收集表单方法
const getFormMethods = () => {
  return {
    botInfo: botInfoTabRef.value?.formMethods,
    payment: paymentTabRef.value?.formMethods,
    timeEnergy: timeEnergyTabRef.value?.formMethods,
    countEnergy: countEnergyTabRef.value?.formMethods,
    managedMode: managedModeTabRef.value?.formMethods,
    batchOrder: batchOrderTabRef.value?.formMethods,
    flashExchange: flashExchangeTabRef.value?.formMethods,
    welfarePrice: welfarePriceTabRef.value?.formMethods
  }
}

// 打开弹窗
const open = async (botInfo: Record<string, any>) => {
  // 先设置一些基本信息，避免闪烁
  currentBot.value = botInfo || {}
  dialogVisible.value = true
  activeTab.value = 'botInfo'

  if (!botInfo || !botInfo.id) {
    ElMessage.error('机器人信息不完整')
    return
  }

  // 等待组件加载完成
  await new Promise((resolve) => setTimeout(resolve, 100))

  // 只加载当前tab的配置信息
  const formMethods = getFormMethods()
  await loadBotAllConfigs(botInfo.id, { botInfo: formMethods.botInfo })
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
  emit('close')
}

// 提交表单
const submit = async () => {
  if (submitting.value) return

  // 获取当前活动的表单
  let currentFormMethod

  switch (activeTab.value) {
    case 'botInfo':
      currentFormMethod = botInfoTabRef.value?.formMethods
      break
    case 'payment':
      currentFormMethod = paymentTabRef.value?.formMethods
      break
    case 'timeEnergy':
      currentFormMethod = timeEnergyTabRef.value?.formMethods
      break
    case 'countEnergy':
      currentFormMethod = countEnergyTabRef.value?.formMethods
      break
    case 'managedMode':
      currentFormMethod = managedModeTabRef.value?.formMethods
      break
    case 'batchOrder':
      currentFormMethod = batchOrderTabRef.value?.formMethods
      break
    case 'flashExchange':
      currentFormMethod = flashExchangeTabRef.value?.formMethods
      break
    case 'welfarePrice':
      currentFormMethod = welfarePriceTabRef.value?.formMethods
      break
  }

  if (!currentFormMethod) return

  // 验证当前标签页的表单
  const currentForm = await currentFormMethod.getElFormExpose()
  const valid = await currentForm.validate().catch(() => false)

  if (!valid) {
    ElMessage.warning('表单验证失败，请检查填写内容')
    return
  }

  // 构建表单方法对象，只包含当前激活的表单
  const formMethodsToSubmit = {
    [activeTab.value]: currentFormMethod
  }

  // 提交当前激活的表单配置，传递表单类型
  console.log('提交配置:', activeTab.value)
  const success = await submitConfig(formMethodsToSubmit, activeTab.value)

  if (success) {
    // dialogVisible.value = false
    emit('success')
  }
}

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
/* 改进标签页样式 */
.el-tabs__nav {
  margin-bottom: 20px;
}

.el-tabs__content {
  padding: 0 10px;
}
</style>
