<template>
  <Dialog v-model="dialogVisible" title="机器人配置" width="1200px" max-height="600px">
    <div v-loading="loading">
      <ElTabs v-model="activeTab" @tab-change="handleTabChange">
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

        <ElTabPane label="价格配置" name="priceConfig">
          <PriceConfigTab ref="priceConfigTabRef" :cost-prices="costPrices" />
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
import { ref } from 'vue'
import { ElButton, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { useBotConfigV1 } from './composables/useBotConfigV1'

// 导入各标签页组件
import BotInfoTab from './tabs/BotInfoTab.vue'
import PaymentTab from './tabs/PaymentTab.vue'
import PriceConfigTab from './tabs/PriceConfigTab.vue'

// 组件引用
const botInfoTabRef = ref()
const paymentTabRef = ref()
const priceConfigTabRef = ref()

// 使用新的机器人配置组合函数 V1（使用 v1 新接口）
const {
  dialogVisible,
  activeTab,
  currentBot,
  tgStatus,
  syncing,
  loading,
  submitting,
  costPrices,
  syncTgStatus,
  loadTabConfig,
  submitTabConfig
} = useBotConfigV1()

const emit = defineEmits(['success', 'close'])

// 收集表单方法
const getFormMethods = () => {
  return {
    botInfo: botInfoTabRef.value?.formMethods,
    payment: paymentTabRef.value?.formMethods,
    priceConfig: priceConfigTabRef.value?.formMethods
  }
}

// Tab切换处理
const handleTabChange = async (tabName: string) => {
  console.log('切换到标签页:', tabName)
  if (!currentBot.value.id) {
    console.warn('currentBot.value.id 不存在')
    return
  }

  // 等待组件渲染完成
  await new Promise((resolve) => setTimeout(resolve, 50))

  const formMethods = getFormMethods()
  console.log('获取到的 formMethods:', formMethods)
  const currentFormMethod = formMethods[tabName]
  console.log('当前标签页的 formMethod:', currentFormMethod)

  if (!currentFormMethod) {
    console.warn(`Tab ${tabName} 的formMethods未找到`)
    return
  }

  // 使用新的加载函数
  console.log('准备调用 loadTabConfig')
  await loadTabConfig(currentBot.value.id, tabName, currentFormMethod)
  console.log('loadTabConfig 调用完成')
}

// 打开弹窗
const open = async (botInfo: Record<string, any>) => {
  currentBot.value = botInfo || {}
  dialogVisible.value = true
  activeTab.value = 'botInfo'

  if (!botInfo || !botInfo.id) {
    ElMessage.error('机器人信息不完整')
    return
  }

  // 等待组件加载完成
  await new Promise((resolve) => setTimeout(resolve, 100))

  // 加载当前tab的配置信息
  const formMethods = getFormMethods()
  if (formMethods.botInfo) {
    await loadTabConfig(botInfo.id, 'botInfo', formMethods.botInfo)
  }
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
  emit('close')
}

// 提交表单
const submit = async () => {
  if (submitting.value) return

  const formMethods = getFormMethods()
  const currentFormMethod = formMethods[activeTab.value]

  if (!currentFormMethod) {
    ElMessage.warning('表单未找到')
    return
  }

  // 使用新的提交函数
  const success = await submitTabConfig(activeTab.value, currentFormMethod)

  if (success) {
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
