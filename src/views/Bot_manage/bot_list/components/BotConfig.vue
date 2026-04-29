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

        <ElTabPane label="福利配置" name="welfareConfig">
          <WelfareConfigTab ref="welfareConfigTabRef" />
        </ElTabPane>

        <ElTabPane label="菜单配置" name="menuConfig">
          <MenuConfigTab ref="menuConfigTabRef" :bot-id="currentBot.id || 0" />
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
import WelfareConfigTab from './tabs/WelfareConfigTab.vue'
import MenuConfigTab from './tabs/MenuConfigTab.vue'

// 组件引用
const botInfoTabRef = ref()
const paymentTabRef = ref()
const priceConfigTabRef = ref()
const welfareConfigTabRef = ref()
const menuConfigTabRef = ref()

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
    priceConfig: priceConfigTabRef.value?.formMethods,
    welfareConfig: welfareConfigTabRef.value?.formMethods
  }
}

const handleTabChange = async (tabName: string) => {
  if (tabName === 'menuConfig') {
    await new Promise((resolve) => setTimeout(resolve, 50))
    await menuConfigTabRef.value?.fetchMenuData()
    return
  }

  if (!currentBot.value.id) {
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 50))

  const formMethods = getFormMethods()
  const currentFormMethod = formMethods[tabName]

  if (!currentFormMethod) {
    return
  }

  await loadTabConfig(currentBot.value.id, tabName, currentFormMethod)
}

const open = async (botInfo: Record<string, any>) => {
  currentBot.value = botInfo || {}
  dialogVisible.value = true
  activeTab.value = 'botInfo'

  if (!botInfo || !botInfo.id) {
    ElMessage.error('机器人信息不完整')
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 100))

  const formMethods = getFormMethods()
  if (formMethods.botInfo) {
    await loadTabConfig(botInfo.id, 'botInfo', formMethods.botInfo)
  }
}

const close = () => {
  dialogVisible.value = false
  emit('close')
}

const submit = async () => {
  if (submitting.value) return

  // 如果是菜单配置标签页，调用菜单配置的保存方法
  if (activeTab.value === 'menuConfig') {
    submitting.value = true
    try {
      const success = await menuConfigTabRef.value?.saveMenuConfig()
      if (success) {
        emit('success')
      }
    } finally {
      submitting.value = false
    }
    return
  }

  const formMethods = getFormMethods()
  const currentFormMethod = formMethods[activeTab.value]

  if (!currentFormMethod) {
    ElMessage.warning('表单未找到')
    return
  }

  // 调用提交配置的方法
  const success = await submitTabConfig(activeTab.value, currentFormMethod)

  if (success) {
    emit('success')
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.el-tabs__nav {
  margin-bottom: 20px;
}

.el-tabs__content {
  padding: 0 10px;
}
</style>
