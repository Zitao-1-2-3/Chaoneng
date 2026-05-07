<script setup lang="tsx">
import { ref, nextTick, computed, watch } from 'vue'
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

// 常量定义
const AGENT_LEVELS = [
  { label: '一级代理', value: 1 },
  { label: '二级代理', value: 2 },
  { label: '三级代理', value: 3 }
] as const

const DEFAULT_PRICE_ID = 3
const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 20
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// 表单状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const originalData = ref<AgentFormData>({} as AgentFormData)
const emailValue = ref('')

interface AgentFormData {
  id?: number | string
  username: string
  email: string
  password: string
  gift_bandwidth?: number
  status?: number
  price_id?: number
}

const { required, lengthRange } = useValidator()
const { formRegister, formMethods } = useForm()
const { formRegister: formRegister2, formMethods: formMethods2 } = useForm()

// 监听 emailValue 变化，同步到表单字段
watch(emailValue, (newValue) => {
  if (!isEdit.value) {
    formMethods.setValues({ email: newValue })
  }
})

// 辅助函数：获取列宽
const getColSpan = (fullWidth: boolean = false) => (fullWidth || isEdit.value ? 24 : 12)

// 辅助函数：仅在新增模式应用规则
const addModeOnly = <T,>(rules: T): T | [] => (isEdit.value ? [] : rules)

// 表单配置
const agentFormSchema = computed<FormSchema[]>(() => {
  const schema: FormSchema[] = [
    {
      field: 'username',
      label: '代理名称',
      component: 'Input' as const,
      componentProps: {
        placeholder: isEdit.value ? '' : '请输入代理名称',
        disabled: isEdit.value
      },
      colProps: { span: getColSpan() }
    }
  ]

  if (!isEdit.value) {
    schema.push({
      field: 'price_id',
      label: '代理等级',
      component: 'Select' as const,
      componentProps: {
        placeholder: '请选择代理等级',
        options: AGENT_LEVELS
      },
      colProps: { span: 12 }
    })
  }

  schema.push({
    field: 'password',
    label: {
      text: isEdit.value ? '登录密码(留空不修改)' : '登录密码',
      tips: '请输入最低不少于8位字符的密码'
    },
    component: 'InputPassword' as const,
    componentProps: {
      placeholder: isEdit.value ? '留空则不修改密码' : '请输入登录密码'
    },
    colProps: { span: getColSpan() }
  })

  if (!isEdit.value) {
    schema.push({
      field: 'email',
      label: '联系方式',
      component: 'Input' as const,
      componentProps: {
        placeholder: '请输入邮箱'
      },
      colProps: { span: 12 },
      formItemProps: {
        rules: [required('联系方式不能为空')],
        slots: {
          default: () => <EmailInput v-model={emailValue.value} style={{ width: '100%' }} />
        }
      }
    })
  }

  return schema
})

// 是否赠送带宽配置
const giftBandwidthSchema = computed<FormSchema>(() => ({
  field: 'gift_bandwidth',
  label: '是否赠送带宽',
  component: 'RadioGroup' as const,
  componentProps: {
    options: [
      { label: '开启', value: 1 },
      { label: '关闭', value: 0 }
    ]
  }
}))

// 表单验证规则
const formRules = computed<FormRules>(() => {
  const passwordRules = [
    lengthRange({
      min: PASSWORD_MIN_LENGTH,
      max: PASSWORD_MAX_LENGTH,
      message: `密码长度需为${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位`
    }),
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

  const emailRules = [
    {
      validator: (_rule: any, value: any, callback: any) => {
        // 使用传入的 value 参数或 emailValue.value
        const emailToCheck = value || emailValue.value

        if (!emailToCheck) {
          callback(new Error('联系方式不能为空'))
          return
        }

        // 检查是否包含中文
        if (/[\u4e00-\u9fa5]/.test(emailToCheck)) {
          callback(new Error('联系方式不能包含中文'))
          return
        }

        if (!EMAIL_REGEX.test(emailToCheck)) {
          callback(new Error('请输入正确的邮箱格式'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]

  return {
    username: addModeOnly([required('代理名称不能为空')]),
    price_id: addModeOnly([required('请选择代理等级')]),
    password: isEdit.value ? passwordRules : [required('登录密码不能为空'), ...passwordRules],
    email: addModeOnly(emailRules)
  }
})

const dialogTitle = computed(() => (isEdit.value ? '修改密码' : '新增代理'))

// 辅助函数：验证表单
const validateForm = (formInstance: any): Promise<boolean> => {
  return new Promise((resolve) => {
    formInstance.validate((valid: boolean) => resolve(valid))
  })
}

// 打开对话框
async function openDialog(mode: 'add' | 'edit' = 'add', data: Partial<AgentFormData> = {}) {
  isEdit.value = mode === 'edit'
  dialogVisible.value = true
  originalData.value = data as AgentFormData
  emailValue.value = data.email || ''

  await nextTick()

  const formValues = {
    username: data.username || '',
    password: '',
    price_id: data.price_id ?? DEFAULT_PRICE_ID,
    email: data.email || '',
    gift_bandwidth: data.gift_bandwidth ?? 0
  }

  setTimeout(async () => {
    try {
      await formMethods.setValues(formValues)
      if (!isEdit.value) {
        await formMethods2.setValues({ gift_bandwidth: formValues.gift_bandwidth })
      }
    } catch (error) {
      console.error('设置表单值失败:', error)
    }
  }, 100)
}

// 提交表单
async function onSubmit() {
  try {
    const elFormInstance = await formMethods.getElFormExpose()
    const valid1 = await validateForm(elFormInstance)

    let valid2 = true
    if (!isEdit.value) {
      const elFormInstance2 = await formMethods2.getElFormExpose()
      valid2 = await validateForm(elFormInstance2)
    }

    if (!valid1 || !valid2) {
      ElMessage.error('请填写完整信息')
      return
    }

    const formData1 = await formMethods.getFormData<AgentFormData>()

    const formData: AgentFormData = isEdit.value
      ? formData1
      : {
          ...formData1,
          ...(await formMethods2.getFormData<AgentFormData>()),
          email: emailValue.value
        }

    await (isEdit.value ? handleEdit(formData) : handleAdd(formData))

    emits('success', {
      type: isEdit.value ? 'edit' : 'add',
      data: formData
    })
    dialogVisible.value = false
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
    email: emailValue.value,
    password: formData.password,
    price_id: formData.price_id ?? DEFAULT_PRICE_ID,
    gift_bandwidth: formData.gift_bandwidth === 1
  }
  await addAgentApi(payload)
  ElMessage.success('新增代理成功')
}

// 处理编辑
async function handleEdit(formData: AgentFormData) {
  const payload: UpdateAgentPayload = {
    id: originalData.value.id!,
    email: originalData.value.email,
    gift_bandwidth: originalData.value.gift_bandwidth === 1,
    status: originalData.value.status,
    price_id: originalData.value.price_id
  }

  if (formData.password) {
    payload.password = formData.password
  }

  await updateAgentApi(payload)
  ElMessage.success('密码修改成功')
}

defineExpose({ openDialog })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" @onOk="onSubmit">
    <!-- 主表单 -->
    <Form
      @register="formRegister"
      :schema="agentFormSchema"
      :rules="formRules"
      :showActionButtonGroup="false"
      :label-width="isEdit ? 180 : 120"
      :isCol="true"
    />

    <!-- 是否赠送带宽 - 仅在新增模式显示 -->
    <Form
      v-if="!isEdit"
      @register="formRegister2"
      :schema="[giftBandwidthSchema]"
      :rules="{}"
      :showActionButtonGroup="false"
      :label-width="120"
      :isCol="false"
    />

    <div v-if="!isEdit" class="gift-bandwidth-description">
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
  padding-left: 120px;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}
</style>
