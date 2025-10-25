<template>
  <Dialog v-model="visible" :title="dialogTitle">
    <Form :schema="baseFormSchema" @register="formRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { addAgentPriceApi, updateAgentPriceApi } from '@/api/marketing/agent_price'
import type { AddPriceParams, UpdatePriceParams, AgentPriceVO } from '@/api/marketing/agent_price'

// 类型定义 - 匹配后端 snake_case 结构
interface FormData extends Omit<AddPriceParams, 'status'> {
  id?: number
  // status: number | string
}

interface OpenParams {
  mode: 'add' | 'edit'
  data?: Partial<AgentPriceVO>
}

// 类型映射 (更新为正确映射)
const priceTypeMap = {
  // 1闪租 2托管 3按笔数 4闪兑 5按天数 6激活
  1: '闪租',
  2: '托管',
  3: '按笔数',
  4: '闪兑',
  5: '按天数',
  6: '首次激活'
}
const priceTypeOptions = Object.entries(priceTypeMap).map(([value, label]) => ({
  label,
  value: Number(value)
}))

const emit = defineEmits(['success'])
const visible = ref(false)
const submitting = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const currentData = ref<Partial<AgentPriceVO>>({}) // 存储原始数据
const { required } = useValidator()
const { formRegister, formMethods } = useForm()
const { getFormData, setValues, getElFormExpose } = formMethods
const selectedPriceType = ref<number | string>('')

// 弹窗标题
const dialogTitle = computed(() => {
  return formMode.value === 'add' ? '新增价格配置' : '编辑价格配置'
})

// 表单基础配置
const baseFormSchema = reactive<FormSchema[]>([
  {
    field: 'price_type',
    component: 'Select',
    label: '产品类型：',
    componentProps: {
      placeholder: '请选择产品类型',
      options: priceTypeOptions, // 使用上面定义的选项
      // 监听类型变化，更新 selectedPriceType
      onChange: (value: number | string) => {
        selectedPriceType.value = value
        updateFormSchemaVisibility(value) // 动态更新字段可见性
      },
      disabled: true
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'price_trx',
    component: 'InputNumber',
    label: 'TRX价格/费率：', // 统一标签，具体含义看类型
    hidden: true, // 默认隐藏
    componentProps: {
      placeholder: '请输入价格或百分比',
      precision: 2
      // precision 等根据类型动态设置可能更佳，暂用通用设置
      // ... 其他 InputNumber props
    }
    // required 规则也应动态添加
  },
  {
    field: 'price_trx_65000',
    component: 'InputNumber',
    label: '65000价格（TRX）：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_trx_131000',
    component: 'InputNumber',
    label: '131000能量价格（TRX）：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_day_1',
    component: 'InputNumber',
    label: '1天价格：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_day_3',
    component: 'InputNumber',
    label: '3天价格：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_day_7',
    component: 'InputNumber',
    label: '7天价格：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_day_15',
    component: 'InputNumber',
    label: '15天价格：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  },
  {
    field: 'price_day_30',
    component: 'InputNumber',
    label: '30天价格：',
    hidden: true,
    componentProps: {
      // ... InputNumber props
    }
  }
  // {
  //   field: 'status',
  //   component: 'RadioGroup',
  //   label: '状态：',
  //   value: 1,
  //   componentProps: {
  //     options: [
  //       { label: '启用', value: 1 },
  //       { label: '禁用', value: 2 }
  //     ]
  //   },
  //   formItemProps: {
  //     rules: [required()]
  //   }
  // }
]) as FormSchema[]

// 根据产品类型更新表单字段的可见性和规则 (更新逻辑)
const updateFormSchemaVisibility = (priceType: number | string) => {
  const type = Number(priceType)
  baseFormSchema.forEach((item) => {
    let isVisible = false
    let isRequired = false
    const rules: FormItemRule[] = []

    switch (item.field) {
      case 'price_trx':
        // 类型 1(闪租), 3(按笔数), 4(闪兑), 6(激活) 显示 (移除类型 2 托管)
        isVisible = [1, 3, 4, 6].includes(type)
        isRequired = isVisible
        item.label = type === 4 ? '闪兑费率(%)：' : type === 6 ? '激活单价(TRX)：' : 'TRX价格/笔：'
        if (item.componentProps) {
          item.componentProps.placeholder = type === 4 ? '请输入百分比, 如 5' : '请输入TRX价格'
        }
        break
      case 'price_trx_65000':
      case 'price_trx_131000':
        // 类型 2(托管) 显示
        isVisible = type === 2
        isRequired = isVisible
        item.componentProps.precision = 2
        break
      case 'price_day_1':
      case 'price_day_3':
      case 'price_day_7':
      case 'price_day_15':
        // 类型 5(按天数) 显示
        isVisible = type === 5
        isRequired = isVisible
        item.componentProps.precision = 2
        break
      default:
        // price_type, status 总是可见
        isVisible = ![
          'price_trx',
          'price_trx_65000',
          'price_trx_131000',
          'price_day_1',
          'price_day_3',
          'price_day_7',
          'price_day_15'
        ].includes(item.field)
    }

    item.hidden = !isVisible
    if (isRequired) {
      rules.push(required())
    }
    item.formItemProps = { ...(item.formItemProps || {}), rules: rules }
  })
}

// 打开弹窗
const open = async (params: OpenParams) => {
  formMode.value = params.mode
  visible.value = true
  currentData.value = params.data || {}

  await nextTick() // 确保 DOM 更新

  try {
    const elForm = await getElFormExpose() // 使用 getElFormExpose
    if (elForm) {
      await elForm.resetFields() // 直接调用 elForm 上的方法
    } else {
      console.warn('获取 elForm 实例失败，无法重置表单')
    }
  } catch (e) {
    console.error('调用 resetFields 时出错:', e)
  }

  // 先设置 price_type 的值，并触发 schema 更新
  const initialPriceType = currentData.value.price_type || ''
  selectedPriceType.value = initialPriceType
  updateFormSchemaVisibility(initialPriceType)

  // 等待 schema 更新应用
  await nextTick()
  setValues({
    price_type: initialPriceType,
    price_trx: currentData.value.price_trx ?? null,
    price_trx_65000: currentData.value.price_trx_65000 ?? null,
    price_trx_131000: currentData.value.price_trx_131000 ?? null,
    price_day_1: currentData.value.price_day_1 ?? null,
    price_day_3: currentData.value.price_day_3 ?? null,
    price_day_7: currentData.value.price_day_7 ?? null,
    price_day_15: currentData.value.price_day_15 ?? null
    // status: currentData.value.status === undefined ? 1 : Number(currentData.value.status)
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    const elForm = await getElFormExpose() // 使用 getElFormExpose
    if (!elForm) {
      console.error('无法获取表单实例')
      ElMessage.error('无法提交，表单实例获取失败')
      return
    }

    // --- 调试日志 --- >
    const currentFormData = await getFormData<FormData>()
    console.log('准备校验的表单数据:', JSON.parse(JSON.stringify(currentFormData)))
    console.log('当前的表单 Schema (含规则):', JSON.parse(JSON.stringify(baseFormSchema)))
    // < --- 调试日志 ---

    // 直接调用 elForm 上的 validate 方法
    await elForm.validate() // 如果校验失败会 reject
    console.log('表单校验通过')

    // 校验通过后继续执行
    await submitLogic(currentFormData)
  } catch (invalidFieldsOrError) {
    // 捕获 validate 失败 (reject) 或其他错误
    if (
      invalidFieldsOrError &&
      typeof invalidFieldsOrError === 'object' &&
      Object.keys(invalidFieldsOrError).length > 0
    ) {
      // 检查是否是包含校验错误的非空对象
      console.log('表单校验未通过')
      console.error('校验失败的字段:', invalidFieldsOrError)
      ElMessage.error('表单校验失败，请检查红色标记的字段')
    } else {
      console.error('表单处理或提交过程中发生错误:', invalidFieldsOrError)
      // 如果 invalidFieldsOrError 不是预期的错误对象，也打印出来
      console.error('捕获到的非校验错误或空对象:', invalidFieldsOrError)
      ElMessage.error('操作失败，请稍后重试')
    }
  } finally {
    // submitting 状态在 submitLogic 中处理
  }
}

// 封装提交逻辑
const submitLogic = async (formData: FormData) => {
  submitting.value = true
  try {
    const submitData = {
      price_type: Number(formData.price_type),
      price_trx: Number(formData.price_trx) || 0,
      price_trx_65000: Number(formData.price_trx_65000) || 0,
      price_trx_131000: Number(formData.price_trx_131000) || 0,
      price_day_1: Number(formData.price_day_1) || 0,
      price_day_3: Number(formData.price_day_3) || 0,
      price_day_7: Number(formData.price_day_7) || 0,
      price_day_15: Number(formData.price_day_15) || 0
      // status: Number(formData.status)
    }

    if (formMode.value === 'add') {
      await addAgentPriceApi(submitData as AddPriceParams)
      ElMessage.success('新增成功')
    } else {
      const updatePayload: UpdatePriceParams = {
        ...submitData,
        id: Number(currentData.value.id)
      }
      await updateAgentPriceApi(updatePayload)
      ElMessage.success('更新成功')
    }
    visible.value = false
    emit('success')
  } catch (apiError) {
    console.error('API 调用失败:', apiError)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 暴露 open 方法
defineExpose({ open })
</script>
