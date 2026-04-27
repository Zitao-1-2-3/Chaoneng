<template>
  <Dialog v-model="dialogVisible" title="高级设置" width="850px" @close="handleClose">
    <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem prop="period">
            <template #label>
              <ElTooltip content="设置消息重复发送的周期，0表示只发送一次" placement="top">
                <span class="cursor-help">
                  发送周期 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElInputNumber
              v-model="formData.period"
              :min="0"
              :max="8760"
              :step="1"
              controls-position="right"
              placeholder="小时数"
              style="width: 100%"
              class="period-input-center"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem prop="sent_at">
            <template #label>
              <ElTooltip content="选择消息发送的具体时间，不选择则立即发送" placement="top">
                <span class="cursor-help">
                  发送时间 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElDatePicker
              v-model="formData.sent_at"
              type="datetime"
              placeholder="选择发送时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              clearable
              :disabled-date="(time) => time.getTime() < Date.now()"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem prop="delete_sent">
            <template #label>
              <ElTooltip content="是否删除上一次发送的消息" placement="top">
                <span class="cursor-help">
                  删除上次消息 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElSwitch
              v-model="formData.delete_sent"
              :active-value="true"
              :inactive-value="false"
              active-text="是"
              inactive-text="否"
              inline-prompt
              style="

--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <BaseButton @click="handleClose">取消</BaseButton>
      <BaseButton type="primary" @click="handleConfirm" :loading="loading">确定</BaseButton>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import {
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElSwitch,
  ElDatePicker,
  ElMessage,
  ElTooltip,
  ElRow,
  ElCol
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { v1UpdateGroupMessage } from '@/api/tgUser'

interface Props {
  modelValue: boolean
  rowData?: any
}
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  rowData: undefined
})
const emit = defineEmits<Emits>()
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const loading = ref(false)
const formData = reactive({
  period: 0,
  sent_at: '',
  delete_sent: false
})
const formRules: FormRules = {
  period: [
    { required: true, message: '请输入发送周期', trigger: 'blur' },
    { type: 'number', min: 0, max: 8760, message: '发送周期范围为 0-8760 小时', trigger: 'blur' }
  ]
}
// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
    if (val && props.rowData) {
      // 初始化表单数据，将 1/2 转换为 true/false
      // 如果 period 为 null 或 4294967295，则显示为 0（只发一次）
      const periodValue = props.rowData.period
      formData.period = periodValue === null || periodValue === 4294967295 ? 0 : periodValue || 0
      formData.delete_sent = props.rowData.delete_sent === 1

      // 处理发送时间
      if (props.rowData.sent_at) {
        // 如果是时间戳（秒），转换为日期字符串
        if (typeof props.rowData.sent_at === 'number') {
          const timestamp =
            props.rowData.sent_at < 10000000000
              ? props.rowData.sent_at * 1000
              : props.rowData.sent_at
          formData.sent_at = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ')
        } else {
          formData.sent_at = props.rowData.sent_at
        }
      } else {
        formData.sent_at = ''
      }
    }
  },
  { immediate: true }
)
// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})
const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}
const handleConfirm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    if (!props.rowData?.id) {
      ElMessage.error('缺少消息ID')
      return
    }
    loading.value = true
    // 处理发送时间
    let sentAtTimestamp: number
    if (formData.sent_at) {
      sentAtTimestamp = Math.floor(new Date(formData.sent_at).getTime() / 1000)
    } else {
      sentAtTimestamp = Math.floor(Date.now() / 1000)
    }
    // 调用更新接口，将 boolean 转换为 1/2
    // 如果 period 为 0，则传递 4294967295（表示只发一次）
    const periodValue = formData.period === 0 ? 4294967295 : formData.period
    const res = await v1UpdateGroupMessage({
      id: props.rowData.id,
      period: periodValue,
      sent_at: sentAtTimestamp,
      delete_sent: formData.delete_sent ? 1 : 2
    })
    if (res.code === '000000') {
      ElMessage.success('更新成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error((res as any).msg || '更新失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新失败:', error)
      ElMessage.error(error.message || '更新失败')
    }
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
/* 发送周期输入框居中 */
:deep(.period-input-center .el-input__inner) {
  text-align: center;
}

.cursor-help {
  cursor: help;
}

/* 防止内容溢出 */
:deep(.el-form) {
  overflow-x: hidden;
}

:deep(.el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

:deep(.el-col) {
  padding-right: 10px !important;
  padding-left: 10px !important;
}

/* 确保日期选择器不超出 */
:deep(.el-date-editor) {
  width: 100% !important;
  max-width: 100%;
}
</style>
