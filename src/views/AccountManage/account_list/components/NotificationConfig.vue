<template>
  <div class="notification-config-section">
    <h3 class="text-lg font-semibold mb-2">代理消息提醒配置</h3>

    <div class="flex justify-center">
      <ElForm :model="form" label-width="100px" class="max-w-2xl">
        <!-- 余额不足提醒 -->
        <ElFormItem label="余额不足提醒">
          <div class="flex items-center gap-4 w-full">
            <ElSwitch v-model="form.enabled" />
            <ElInput
              v-model="form.threshold"
              placeholder="请输入提醒阈值"
              class="flex-1"
              :disabled="!form.enabled"
            >
              <template #append>TRX</template>
            </ElInput>
          </div>
          <div class="text-sm text-gray-500 mt-1"> 当账户TRX余额低于该阈值时，将发送提醒通知 </div>
        </ElFormItem>

        <!-- TG账号 -->
        <ElFormItem label="TG账号">
          <ElInput
            v-model="form.tgAccount"
            placeholder="请输入TG用户账户ID"
            :disabled="!form.enabled"
          />
          <div class="text-sm text-gray-500 mt-1"> 将发送给Telegram账户ID提醒账户 </div>
        </ElFormItem>

        <!-- 操作按钮 -->
        <ElFormItem label=" ">
          <div class="flex gap-2 justify-end w-full">
            <ElButton @click="handleReset">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSave"> 保存 </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElForm, ElFormItem, ElSwitch, ElInput, ElButton, ElMessage } from 'element-plus'

interface NotificationConfig {
  enabled: boolean
  threshold: string
  tgAccount: string
}

const props = defineProps<{
  accountId?: number
}>()

const emit = defineEmits<{
  saved: []
}>()

// 表单数据
const form = reactive<NotificationConfig>({
  enabled: false,
  threshold: '',
  tgAccount: ''
})

// 保存状态
const saving = ref(false)

// 原始数据备份（用于取消时恢复）
const originalData = reactive<NotificationConfig>({
  enabled: false,
  threshold: '',
  tgAccount: ''
})

// 获取配置
const fetchConfig = async () => {
  if (!props.accountId) return

  try {
    // TODO: 调用获取配置接口
    // const response = await getNotificationConfigApi(props.accountId)
    // if (response && response.data) {
    //   form.enabled = response.data.enabled
    //   form.threshold = response.data.threshold
    //   form.tgAccount = response.data.tg_account
    //
    //   // 备份原始数据
    //   Object.assign(originalData, form)
    // }
  } catch (error) {
    console.error('获取消息提醒配置失败:', error)
  }
}

// 保存配置
const handleSave = async () => {
  if (form.enabled) {
    // 验证必填字段
    if (!form.threshold) {
      ElMessage.warning('请输入提醒阈值')
      return
    }
    if (!form.tgAccount) {
      ElMessage.warning('请输入TG账号')
      return
    }

    // 验证阈值是否为有效数字
    const thresholdNum = Number(form.threshold)
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      ElMessage.warning('请输入有效的提醒阈值')
      return
    }
  }

  saving.value = true
  try {
    // TODO: 调用保存接口
    // await saveNotificationConfigApi({
    //   account_id: props.accountId,
    //   enabled: form.enabled,
    //   threshold: form.threshold,
    //   tg_account: form.tgAccount
    // })

    ElMessage.success('保存成功')

    // 更新原始数据
    Object.assign(originalData, form)

    emit('saved')
  } catch (error) {
    console.error('保存消息提醒配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置配置
const handleReset = () => {
  // 恢复到原始数据
  Object.assign(form, originalData)
}

// 组件挂载时获取配置
onMounted(() => {
  fetchConfig()
})

// 暴露方法供父组件调用
defineExpose({
  fetchConfig
})
</script>

<style scoped>
.notification-config-section {
  padding: 12px;
  margin-top: 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}
</style>
