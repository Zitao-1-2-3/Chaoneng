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

const emits = defineEmits(['success', 'error'])

// 表单状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const originalData = ref<AgentFormData>({} as AgentFormData)

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

// 表单配置
const agentFormSchema = computed<FormSchema[]>(() => [
  ...(isEdit.value
    ? []
    : [
        {
          field: 'username',
          label: '代理名称',
          component: 'Input' as const,
          componentProps: {
            placeholder: '请输入代理名称'
          }
        }
      ]),
  {
    field: 'email',
    label: '联系方式',
    component: 'Input' as const,
    componentProps: {
      placeholder: '请输入联系方式'
    }
  },
  {
    field: 'password',
    label: {
      text: isEdit.value ? '登录密码(留空不修改)' : '登录密码',
      tips: '请输入最低不少于8位字符的密码'
    },
    component: 'InputPassword' as const,
    componentProps: {
      placeholder: isEdit.value ? '留空则不修改密码' : '请输入登录密码'
    }
  },
  {
    field: 'gift_bandwidth',
    label: '是否赠送带宽',
    component: 'RadioGroup' as const,
    componentProps: {
      options: [
        { label: '开启', value: 1 },
        { label: '关闭', value: 0 }
      ]
    },
    defaultValue: 0,
    colProps: {
      span: 24
    }
  }
])

const formRules = computed<FormRules>(() => ({
  ...(isEdit.value ? {} : { username: [required('代理名称不能为空')] }),
  email: [required('联系方式不能为空')],
  password: isEdit.value
    ? [lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' })]
    : [
        required('登录密码不能为空'),
        lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' })
      ]
}))

const dialogTitle = computed(() => (isEdit.value ? '编辑代理' : '新增代理'))

// 打开对话框
async function openDialog(mode: 'add' | 'edit' = 'add', data: Partial<AgentFormData> = {}) {
  isEdit.value = mode === 'edit'
  dialogVisible.value = true
  originalData.value = data as AgentFormData

  await nextTick()

  // 设置表单值
  await formMethods.setValues({
    username: isEdit.value ? '' : '',
    email: data.email || '',
    password: '',
    gift_bandwidth: data.gift_bandwidth ?? 0
  })
}

// 提交表单
async function onSubmit() {
  try {
    const elFormInstance = await formMethods.getElFormExpose()

    await elFormInstance.validate(async (valid) => {
      if (valid) {
        const formData = await formMethods.getFormData<AgentFormData>()

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
      }
    })
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
    gift_bandwidth: formData.gift_bandwidth
  }
  await addAgentApi(payload)
  ElMessage.success('新增代理成功')
}

// 处理编辑
async function handleEdit(formData: AgentFormData) {
  const payload: UpdateAgentPayload = {
    id: originalData.value.id!,
    username: originalData.value.username,
    email: formData.email,
    gift_bandwidth: formData.gift_bandwidth,
    status: originalData.value.status
  }

  // 只有输入了密码才更新密码
  if (formData.password) {
    payload.password = formData.password
  }

  await updateAgentApi(payload)
  ElMessage.success('编辑代理成功')
}

defineExpose({ openDialog })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" @onOk="onSubmit">
    <Form
      @register="formRegister"
      :schema="agentFormSchema"
      :rules="formRules"
      :showActionButtonGroup="false"
      label-width="180px"
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
  padding-left: 180px; /* 与表单标签宽度对齐 */
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}
</style>
