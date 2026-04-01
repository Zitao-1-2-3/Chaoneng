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
import { ref, reactive, computed, nextTick } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { addAgentPriceApi, v2UpdateSystemPrice } from '@/api/marketing/agent_price'

// 类型定义 - 匹配后端 snake_case 结构
interface FormData {
  id?: number
  price_type?: number | string
  price_trx?: number | null
  price_usdt?: number | null
  price_trx_65000?: number | null
  price_trx_131000?: number | null
  price_day_1?: number | null
  price_day_3?: number | null
  price_day_7?: number | null
  price_day_15?: number | null
  price_day_30?: number | null
}

interface AgentPriceVO {
  id?: number
  price_type?: number | string
  price_trx?: number | string
  price_usdt?: number | string
  price_trx_65000?: number | string
  price_trx_131000?: number | string
  price_day_1?: number | string
  price_day_3?: number | string
  price_day_7?: number | string
  price_day_15?: number | string
  price_day_30?: number | string
}

interface OpenParams {
  mode: 'add' | 'edit'
  data?: Partial<AgentPriceVO>
  fullData?: any // 保存完整的原始数据（V2SystemPriceResponse）
}

// 类型映射 (更新为正确映射)
const priceTypeMap = {
  1: '首次激活',
  2: '按天数',
  3: '闪兑',
  4: '按笔数',
  5: '托管',
  6: '闪租'
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
const fullOriginalData = ref<any>(null) // 存储完整的原始数据（V2SystemPriceResponse）
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
    field: 'price_usdt',
    component: 'InputNumber',
    label: '闪兑费率(U-T)：',
    hidden: true,
    componentProps: {
      placeholder: '请输入百分比, 如 0.14',
      precision: 2
    }
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
        // 类型 1(首次激活), 3(闪兑), 4(按笔数), 6(闪租) 显示
        isVisible = [1, 3, 4, 6].includes(type)
        isRequired = isVisible
        item.label =
          type === 1 ? '激活单价(TRX)：' : type === 3 ? '闪兑费率(U-T)：' : 'TRX价格/笔：'
        if (item.componentProps) {
          item.componentProps.placeholder = type === 3 ? '请输入百分比, 如 10.5' : '请输入TRX价格'
        }
        break
      case 'price_usdt':
        // 类型 3(闪兑) 显示
        isVisible = type === 3
        isRequired = false // price_usdt 是可选的
        item.label = '闪兑费率(T-U)：'
        if (item.componentProps) {
          item.componentProps.placeholder = '请输入百分比, 如 0.14'
        }
        break
      case 'price_trx_65000':
      case 'price_trx_131000':
        // 类型 5(托管) 显示
        isVisible = type === 5
        isRequired = isVisible
        if (item.componentProps) {
          item.componentProps.precision = 2
        }
        break
      case 'price_day_1':
      case 'price_day_3':
      case 'price_day_7':
      case 'price_day_15':
      case 'price_day_30':
        // 类型 2(按天数) 显示
        isVisible = type === 2
        isRequired = isVisible
        if (item.componentProps) {
          item.componentProps.precision = 2
        }
        break
      default:
        // price_type, status 总是可见
        isVisible = ![
          'price_trx',
          'price_usdt',
          'price_trx_65000',
          'price_trx_131000',
          'price_day_1',
          'price_day_3',
          'price_day_7',
          'price_day_15',
          'price_day_30'
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
  fullOriginalData.value = params.fullData || null // 保存完整的原始数据

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
    price_usdt: currentData.value.price_usdt ?? null,
    price_trx_65000: currentData.value.price_trx_65000 ?? null,
    price_trx_131000: currentData.value.price_trx_131000 ?? null,
    price_day_1: currentData.value.price_day_1 ?? null,
    price_day_3: currentData.value.price_day_3 ?? null,
    price_day_7: currentData.value.price_day_7 ?? null,
    price_day_15: currentData.value.price_day_15 ?? null,
    price_day_30: currentData.value.price_day_30 ?? null
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

    const currentFormData = await getFormData<FormData>()

    // 直接调用 elForm 上的 validate 方法
    await elForm.validate() // 如果校验失败会 reject

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
      ElMessage.error('表单校验失败，请检查红色标记的字段')
    } else {
      console.error('表单处理或提交过程中发生错误:', invalidFieldsOrError)
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
    if (formMode.value === 'edit') {
      // 编辑模式：使用新接口 v2UpdateSystemPrice
      if (!fullOriginalData.value) {
        ElMessage.error('缺少原始数据，无法更新')
        return
      }

      // 构建只包含 id 和要修改字段的对象
      const updatedPrice: any = {
        id: fullOriginalData.value.id
      }

      // 根据 price_type 只添加需要修改的字段
      const priceType = Number(formData.price_type)
      switch (priceType) {
        case 1: // 首次激活
          updatedPrice.flash = formData.price_trx
          break
        case 2: // 按天数/小时
          updatedPrice.time_1d = formData.price_day_1
          updatedPrice.time_3d = formData.price_day_3
          updatedPrice.time_7d = formData.price_day_7
          updatedPrice.time_15d = formData.price_day_15
          updatedPrice.time_30d = formData.price_day_30
          break
        case 3: // 闪兑
          updatedPrice.usdt_2_trx = formData.price_trx // U兑T费率
          updatedPrice.trx_2_usdt = formData.price_usdt // T兑U费率
          break
        case 4: // 按笔数
          updatedPrice.stroke = formData.price_trx
          break
        case 5: // 托管
          updatedPrice.hosting_65k = formData.price_trx_65000
          updatedPrice.hosting_131k = formData.price_trx_131000
          break
        case 6: // 闪租
          updatedPrice.stroke = formData.price_trx
          break
      }

      // 调用新的更新接口
      console.log('=== 代理价格配置 - 提交更新 ===')
      console.log('价格类型:', priceType, `(${priceTypeMap[priceType]})`)
      console.log('完整提交参数:', JSON.stringify(updatedPrice, null, 2))
      console.log('修改的字段:', formData)

      await v2UpdateSystemPrice(updatedPrice)

      ElMessage.success('更新成功')
    } else {
      // 新增模式：使用旧接口
      const submitData: any = {
        price_type: Number(formData.price_type),
        price_trx: Number(formData.price_trx) || 0,
        price_trx_65000: Number(formData.price_trx_65000) || 0,
        price_trx_131000: Number(formData.price_trx_131000) || 0,
        price_day_1: Number(formData.price_day_1) || 0,
        price_day_3: Number(formData.price_day_3) || 0,
        price_day_7: Number(formData.price_day_7) || 0,
        price_day_15: Number(formData.price_day_15) || 0,
        price_day_30: Number(formData.price_day_30) || 0
      }

      // 如果是闪兑类型(4)，且 price_usdt 有值，则添加到提交数据中
      if (
        submitData.price_type === 4 &&
        formData.price_usdt !== null &&
        formData.price_usdt !== undefined
      ) {
        submitData.price_usdt = Number(formData.price_usdt) || 0
      }

      await addAgentPriceApi(submitData)
      ElMessage.success('新增成功')
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
