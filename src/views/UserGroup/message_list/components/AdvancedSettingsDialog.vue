<template>
  <Dialog v-model="dialogVisible" title="高级设置" width="850px" @close="handleClose">
    <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem prop="disable_period">
            <template #label>
              <ElTooltip
                content="开启后可设置消息周期发送，关闭后将禁止消息周期发送"
                placement="top"
              >
                <span class="cursor-help">
                  启用周期 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElSwitch
              v-model="formData.disable_period"
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
      <ElRow :gutter="20">
        <ElCol :span="12" v-if="formData.disable_period">
          <ElFormItem prop="period">
            <template #label>
              <ElTooltip content="设置消息重复发送的周期（小时），最小值为1小时" placement="top">
                <span class="cursor-help">
                  发送周期 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElInputNumber
              v-model="formData.period"
              :min="1"
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
          <ElFormItem prop="send_at">
            <template #label>
              <ElTooltip
                content="选择消息发送的具体时间，只能选择未来时间，不选择则立即发送"
                placement="top"
              >
                <span class="cursor-help">
                  发送时间 <span style="color: var(--el-color-primary)">ⓘ</span>
                </span>
              </ElTooltip>
            </template>
            <ElDatePicker
              v-model="formData.send_at"
              type="datetime"
              placeholder="选择发送时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              clearable
              :disabled-date="(time: Date) => time.getTime() < Date.now()"
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
  period: 1,
  send_at: '',
  delete_sent: false,
  disable_period: false
})
const formRules: FormRules = {
  period: [
    { required: true, message: '请输入发送周期', trigger: 'blur' },
    { type: 'number', min: 1, max: 8760, message: '发送周期范围为 1-8760 小时', trigger: 'blur' }
  ]
}
// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
    if (val && props.rowData) {
      // 初始化表单数据
      // period 逻辑：
      // - null 或 4294967295 = 只发一次(开关关闭)，period 显示为 1（但输入框隐藏）
      // - 其他值 = 启用周期(开关打开)，period 显示实际值
      const periodValue = props.rowData.period

      if (periodValue === null || periodValue === 4294967295) {
        // 只发一次 设为 1（输入框会被隐藏）
        formData.disable_period = false
        formData.period = 1
      } else {
        // 启用周期：开关打开，period 显示实际值
        formData.disable_period = true
        formData.period = periodValue >= 1 ? periodValue : 1
      }

      formData.delete_sent = props.rowData.delete_sent === 1

      // 处理发送时间
      if (props.rowData.send_at) {
        // 如果是时间戳（秒），转换为日期字符串
        if (typeof props.rowData.send_at === 'number') {
          const timestamp =
            props.rowData.send_at < 10000000000
              ? props.rowData.send_at * 1000
              : props.rowData.send_at
          // 使用本地时间而不是 UTC 时间
          const date = new Date(timestamp)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          formData.send_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        } else {
          formData.send_at = props.rowData.send_at
        }
      } else {
        formData.send_at = ''
      }
    }
  },
  { immediate: true }
)
// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 监听启用周期开关变化
watch(
  () => formData.disable_period,
  (newVal, oldVal) => {
    // 当从关闭切换到打开时，设置默认值为1
    if (newVal && !oldVal) {
      formData.period = 1
    }
    // 当开关打开时，确保值不小于1
    if (newVal && formData.period < 1) {
      formData.period = 1
    }
  }
)
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
    let sendAtTimestamp: number | undefined
    if (formData.send_at) {
      sendAtTimestamp = Math.floor(new Date(formData.send_at).getTime() / 1000)
      // 如果选择的时间是过去的时间，则不传递 send_at 字段
      const now = Math.floor(Date.now() / 1000)
      if (sendAtTimestamp < now) {
        sendAtTimestamp = undefined
      }
    }

    // 提交逻辑：
    // - 如果启用周期开关关闭（false），则传递 period = 4294967295
    // - 如果启用周期开关打开（true），则传递实际的 period 值（最小为1）
    let periodValue: number
    if (!formData.disable_period) {
      // 开关关闭 = 只发一次
      periodValue = 4294967295
    } else {
      // 开关打开 = 启用周期，传递实际值（确保最小为1）
      periodValue = formData.period >= 1 ? formData.period : 1
    }

    // 构建请求参数，只有当 sendAtTimestamp 有值时才传递
    const params: any = {
      id: props.rowData.id,
      period: periodValue,
      delete_sent: formData.delete_sent ? 1 : 2
    }

    // 只有当发送时间是未来时间时才传递
    if (sendAtTimestamp !== undefined) {
      params.send_at = sendAtTimestamp
    }

    const res = await v1UpdateGroupMessage(params)
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
