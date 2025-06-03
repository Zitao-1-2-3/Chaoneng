<script setup lang="tsx">
import { ref, defineEmits, nextTick, computed } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import type { FormInstance as ElFormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import request from '@/axios'

const emits = defineEmits(['success', 'error'])

let dialogVisible = ref(false)
let AgentFormTitle = ref('新增代理')

interface AgentFormData {
  id?: number | string
  name: string
  contact: string
  password?: string
}

// API 调用函数
const addAgentApi = (data: Omit<AgentFormData, 'id'>) => {
  return request.post({ url: '/v2/manage/agent/add', data })
}

const updateAgentApi = (data: Partial<AgentFormData> & { id: number | string }) => {
  return request.post({ url: '/v2/manage/agent/edit', data })
}

const originalEditData = ref<Partial<AgentFormData>>({})

const initialFormValues: Omit<AgentFormData, 'id' | 'name'> = {
  contact: '',
  password: ''
}

const initialAddFormValues: Pick<AgentFormData, 'name' | 'contact' | 'password'> = {
  name: '',
  contact: '',
  password: ''
}

const { required, lengthRange } = useValidator()

// 使用 useForm hook
const { formRegister, formMethods } = useForm()

const agentFormSchema = computed<FormSchema[]>(() => {
  const schema: FormSchema[] = []
  if (AgentFormTitle.value === '新增代理') {
    schema.push(
      {
        field: 'name',
        label: '代理名称',
        component: 'Input' as any,
        componentProps: {
          placeholder: '请输入代理名称'
        }
      },
      {
        field: 'contact',
        label: '联系方式',
        component: 'Input' as any,
        componentProps: {
          placeholder: '请输入联系方式'
        }
      },
      {
        field: 'password',
        label: '登录密码',
        component: 'InputPassword' as any,
        componentProps: {
          placeholder: '请输入登录密码'
        }
      }
    )
  } else {
    schema.push(
      {
        field: 'contact',
        label: '联系方式',
        component: 'Input' as any,
        componentProps: {
          placeholder: '请输入联系方式'
        }
      },
      {
        field: 'password',
        label: '登录密码(留空不修改)',
        component: 'InputPassword' as any,
        componentProps: {
          placeholder: '留空则不修改密码'
        }
      }
    )
  }
  return schema
})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  if (AgentFormTitle.value === '新增代理') {
    rules.name = [required('代理名称不能为空')]
    rules.contact = [required('联系方式不能为空')]
    rules.password = [
      required('登录密码不能为空'),
      lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' })
    ]
  } else {
    rules.contact = [required('联系方式不能为空')]
    rules.password = [lengthRange({ min: 6, max: 20, message: '密码长度需为6-20位' })]
  }
  return rules
})

async function openDialog(mode: 'add' | 'edit' = 'add', data: Partial<AgentFormData> = {}) {
  AgentFormTitle.value = mode === 'add' ? '新增代理' : '编辑代理'
  dialogVisible.value = true
  originalEditData.value = mode === 'edit' ? { ...data } : {}

  await nextTick()

  // 使用 formMethods 来设置表单值
  if (mode === 'add') {
    await formMethods.setValues(initialAddFormValues)
  } else if (mode === 'edit' && data) {
    await formMethods.setValues({
      contact: data.contact || '',
      password: ''
    })
  }
}

async function onSubmit() {
  try {
    // 获取 ElForm 实例进行校验
    const elFormInstance = await formMethods.getElFormExpose()

    await elFormInstance.validate(async (valid) => {
      if (valid) {
        // 使用 formMethods.getFormData 获取表单数据
        const formDataToProcess = await formMethods.getFormData<Partial<AgentFormData>>()

        console.log('获取到的表单数据:', formDataToProcess)

        let finalSubmitData: Partial<AgentFormData> = {}

        if (AgentFormTitle.value === '编辑代理') {
          finalSubmitData.id = originalEditData.value.id
          // 代理名称在编辑模式下，通常从原始数据中获取，不在表单中编辑
          finalSubmitData.name = originalEditData.value.name
          finalSubmitData.contact = formDataToProcess.contact
          // 只有当密码字段有实际输入时（不为空），才将其包含在提交数据中
          if (formDataToProcess.password) {
            finalSubmitData.password = formDataToProcess.password
          }
        } else {
          // '新增代理' 模式
          // 新增模式下，名称、联系方式和密码都从表单数据中获取
          finalSubmitData.name = formDataToProcess.name
          finalSubmitData.contact = formDataToProcess.contact
          finalSubmitData.password = formDataToProcess.password
        }

        console.log('最终提交数据:', finalSubmitData)

        // 调用相应的 API
        try {
          if (AgentFormTitle.value === '新增代理') {
            await addAgentApi(finalSubmitData as Omit<AgentFormData, 'id'>)
            ElMessage.success('新增代理成功')
            emits('success', { type: 'add', data: finalSubmitData })
          } else {
            await updateAgentApi(
              finalSubmitData as Partial<AgentFormData> & { id: number | string }
            )
            ElMessage.success('编辑代理成功')
            emits('success', { type: 'edit', data: finalSubmitData })
          }

          // 关闭对话框
          dialogVisible.value = false
        } catch (apiError) {
          console.error(
            `代理${AgentFormTitle.value === '新增代理' ? '新增' : '编辑'}失败:`,
            apiError
          )
          ElMessage.error(`代理${AgentFormTitle.value === '新增代理' ? '新增' : '编辑'}失败`)
          emits('error', {
            type: AgentFormTitle.value === '新增代理' ? 'add' : 'edit',
            error: apiError
          })
        }
      } else {
        console.log('表单校验失败')
      }
    })
  } catch (error) {
    // 捕获并记录表单提交或校验过程中可能发生的任何错误
    console.error('表单提交或校验出错:', error)
    ElMessage.error('表单提交失败')
    emits('error', {
      type: AgentFormTitle.value === '新增代理' ? 'add' : 'edit',
      error
    })
  }
}

defineExpose({ openDialog })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="AgentFormTitle" @onOk="onSubmit">
    <Form
      @register="formRegister"
      :schema="agentFormSchema"
      :rules="formRules"
      :showActionButtonGroup="false"
      label-width="180px"
    />
    <template #footer>
      <BaseButton type="primary" @click="onSubmit">提交</BaseButton>
    </template>
  </Dialog>
</template>
