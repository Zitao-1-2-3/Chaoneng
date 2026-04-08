<script setup lang="tsx">
import { ref, nextTick, computed } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  addAgentApi,
  updateAgentApi,
  type AddAgentPayload,
  type UpdateAgentPayload
} from '@/api/agent/list'
import EmailInput from './EmailInput.vue'

const emits = defineEmits(['success', 'error'])

// 表单状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const originalData = ref<AgentFormData>({} as AgentFormData)
const emailValue = ref('')
const emailError = ref('') // 邮箱错误信息

interface AgentFormData {
  id?: number | string
  username: string
  email: string
  password: string
  gift_bandwidth?: number
  status?: number
}

const { required, lengthRange } = useValidator()
const { formRegister, formMethods } = useForm()
const { formRegister: formRegister2, formMethods: formMethods2 } = useForm()

// 表单配置
const agentFormSchema = computed<FormSchema[]>(() => {
  const baseSchema: FormSchema[] = []

  // 代理名称字段 - 新增时可编辑，编辑时只读
  baseSchema.push({
    field: 'username',
    label: '代理名称',
    component: 'Input' as const,
    componentProps: {
      placeholder: isEdit.value ? '' : '请输入代理名称',
      disabled: isEdit.value // 编辑模式下禁用
    }
  })

  // 登录密码
  baseSchema.push({
    field: 'password',
    label: {
      text: isEdit.value ? '登录密码(留空不修改)' : '登录密码',
      tips: '请输入最低不少于8位字符的密码'
    },
    component: 'InputPassword' as const,
    componentProps: {
      placeholder: isEdit.value ? '留空则不修改密码' : '请输入登录密码'
    }
  })

  return baseSchema
})

// 是否赠送带宽的单独配置
const giftBandwidthSchema = computed<FormSchema>(() => ({
  field: 'gift_bandwidth',
  label: '是否赠送带宽',
  component: 'RadioGroup' as const,
  componentProps: {
    options: [
      { label: '开启', value: 1 },
      { label: '关闭', value: 0 }
    ]
  },
  colProps: {
    span: 24
  }
}))

const formRules = computed<FormRules>(() => ({
  ...(isEdit.value ? {} : { username: [required('代理名称不能为空')] }),
  password: isEdit.value
    ? [
        lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' }),
        {
          validator: (_rule: any, value: any, callback: any) => {
            if (value && /^\d+$/.test(value)) {
              callback(new Error('密码不能为纯数字'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    : [
        required('登录密码不能为空'),
        lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' }),
        {
          validator: (_rule: any, value: any, callback: any) => {
            if (value && /^\d+$/.test(value)) {
              callback(new Error('密码不能为纯数字'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
}))

const dialogTitle = computed(() => (isEdit.value ? '编辑代理' : '新增代理'))

// 验证邮箱
function validateEmail() {
  emailError.value = ''

  if (!emailValue.value) {
    emailError.value = '联系方式不能为空'
    return false
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(emailValue.value)) {
    emailError.value = '请输入正确的邮箱格式'
    return false
  }

  return true
}

// 打开对话框
async function openDialog(mode: 'add' | 'edit' = 'add', data: Partial<AgentFormData> = {}) {
  isEdit.value = mode === 'edit'
  dialogVisible.value = true
  originalData.value = data as AgentFormData
  emailValue.value = data.email || ''
  emailError.value = '' // 清空错误信息

  await nextTick()

  const formValues = {
    username: data.username || '', // 编辑时显示代理名称
    password: '',
    gift_bandwidth: data.gift_bandwidth ?? 0
  }

  setTimeout(async () => {
    try {
      await formMethods.setValues(formValues)
      await formMethods2.setValues({ gift_bandwidth: formValues.gift_bandwidth })
    } catch (error) {
      console.error('设置表单值失败:', error)
    }
  }, 100)
}

// 提交表单
async function onSubmit() {
  try {
    // 验证第一个表单（代理名称和登录密码）
    const elFormInstance = await formMethods.getElFormExpose()

    // 验证第二个表单（是否赠送带宽）
    const elFormInstance2 = await formMethods2.getElFormExpose()

    // 先验证邮箱，设置错误状态
    const emailValid = validateEmail()

    // 验证两个表单
    const valid1 = await new Promise<boolean>((resolve) => {
      elFormInstance.validate((valid) => {
        resolve(valid)
      })
    })

    const valid2 = await new Promise<boolean>((resolve) => {
      elFormInstance2.validate((valid) => {
        resolve(valid)
      })
    })

    if (valid1 && valid2 && emailValid) {
      // 所有验证都通过
      const formData1 = await formMethods.getFormData<AgentFormData>()
      const formData2 = await formMethods2.getFormData<AgentFormData>()

      const formData = {
        ...formData1,
        ...formData2,
        email: emailValue.value
      }

      if (isEdit.value) {
        await handleEdit(formData)
      } else {
        await handleAdd(formData)
      }

      emits('success', {
        type: isEdit.value ? 'edit' : 'add',
        data: formData
      })
      dialogVisible.value = false
    } else {
      // 有字段验证失败
      ElMessage.error('请填写完整信息')
    }
  } catch (error) {
    console.error('表单提交失败:', error)
    ElMessage.error('操作失败，请稍后重试')
    emits('error', {
      type: isEdit.value ? 'edit' : 'add',
      error
    })
  }
}

// 处理新增
async function handleAdd(formData: AgentFormData) {
  const payload: AddAgentPayload = {
    username: formData.username,
    email: formData.email,
    password: formData.password,
    gift_bandwidth: formData.gift_bandwidth === 1 // 转换为 boolean
  }
  await addAgentApi(payload)
  ElMessage.success('新增代理成功')
}

// 处理编辑
async function handleEdit(formData: AgentFormData) {
  const giftBandwidthBoolean = formData.gift_bandwidth === 1

  const payload: UpdateAgentPayload = {
    id: originalData.value.id!,
    email: formData.email,
    gift_bandwidth: giftBandwidthBoolean,
    status: originalData.value.status
  }

  // 只有输入了密码才更新密码
  if (formData.password) {
    payload.password = formData.password
  }

  console.log('提交更新代理，参数:', payload)
  await updateAgentApi(payload)
  ElMessage.success('编辑代理成功')
}

defineExpose({ openDialog })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" @onOk="onSubmit">
    <!-- 代理名称和登录密码 -->
    <Form
      @register="formRegister"
      :schema="agentFormSchema"
      :rules="formRules"
      :showActionButtonGroup="false"
      :label-width="isEdit ? '180px' : '120px'"
    />

    <!-- 自定义邮箱输入 -->
    <div class="custom-form-item" :class="{ 'edit-mode': isEdit }">
      <div class="form-item-label">
        <span class="required-mark">*</span>
        联系方式
      </div>
      <div class="form-item-content">
        <div class="email-wrapper" :class="{ 'has-error': emailError }">
          <EmailInput v-model="emailValue" @blur="validateEmail" />
        </div>
        <div v-if="emailError" class="error-message">{{ emailError }}</div>
      </div>
    </div>

    <!-- 是否赠送带宽 -->
    <Form
      @register="formRegister2"
      :schema="[giftBandwidthSchema]"
      :rules="{}"
      :showActionButtonGroup="false"
      :label-width="isEdit ? '180px' : '120px'"
    />

    <div class="gift-bandwidth-description">
      <p class="description-text">说明：开启状态，购买按笔数/托管两种类型订单，赠送 400点 带宽</p>
    </div>

    <template #footer>
      <BaseButton type="primary" @click="onSubmit">提交</BaseButton>
    </template>
  </Dialog>
</template>

<style scoped>
.gift-bandwidth-description {
  margin-top: 16px;
  margin-bottom: 16px;
}

.description-text {
  padding-left: 120px; /* 与表单标签宽度对齐 */
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

/* 编辑模式下的描述文本 */
.edit-mode ~ .gift-bandwidth-description .description-text {
  padding-left: 180px;
}

.custom-form-item {
  display: flex;
  width: 48.4%; /* 限制宽度为50%，与代理名称和登录密码保持一致 */
  margin-bottom: 22px; /* 与 el-form-item 的默认间距保持一致 */
  margin-left: 8px; /* 向左偏移，与 Form 组件对齐 */
  font-size: 14px;
}

.form-item-label {
  width: 120px;
  padding-right: 12px;
  font-size: 14px;
  line-height: 32px;
  color: var(--el-text-color-regular);
  text-align: right;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 编辑模式下的标签宽度 */
.custom-form-item.edit-mode .form-item-label {
  width: 180px;
}

.required-mark {
  margin-right: 4px;
  color: var(--el-color-danger);
}

.form-item-content {
  flex: 1;
  min-width: 0;
}

.email-wrapper {
  width: 100%;
}

.email-wrapper.has-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.email-wrapper.has-error :deep(.el-select .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.error-message {
  padding-top: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}
</style>
