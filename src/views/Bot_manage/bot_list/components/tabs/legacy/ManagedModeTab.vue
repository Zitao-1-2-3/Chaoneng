<template>
  <div>
    <Form labelPosition="top" :isCol="true" :schema="managedModeSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, defineProps, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

// 定义 props 来接收 agentPrices
const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

// 使用 computed 来安全地访问嵌套属性
const computedAgentPrices = computed(() => props.agentPrices || {})

// 表单相关
const { formRegister, formMethods } = useForm()

// 托管模式价格表单
const managedModeSchema = computed<FormSchema[]>(() => {
  const cost65000Key = 'manage_price_65000'
  const cost65000Price = computedAgentPrices.value[cost65000Key]
  const cost65000Text =
    cost65000Price !== undefined ? `（成本: ${cost65000Price} TRX/笔）` : '（成本: N/A）'

  const cost131000Key = 'manage_price_13100'
  const cost131000Price = computedAgentPrices.value[cost131000Key]
  const cost131000Text =
    cost131000Price !== undefined ? `（成本: ${cost131000Price} TRX/笔）` : '（成本: N/A）'

  return [
    {
      field: 'price_trx_65000',
      component: 'InputNumber' as const,
      label: `65000能量价格 ${cost65000Text}`,
      componentProps: {
        placeholder: '请输入65000能量价格',
        min: 0,
        precision: 2
      },
      formItemProps: {
        rules: [{ required: true, message: '65000能量价格是必填项' }]
      }
    },
    {
      field: 'price_trx_131000',
      component: 'InputNumber' as const,
      label: `131000能量价格 ${cost131000Text}`,
      componentProps: {
        placeholder: '请输入131000能量价格',
        min: 0,
        precision: 2
      },
      formItemProps: {
        rules: [{ required: true, message: '131000能量价格是必填项' }]
      }
    }
  ]
})

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
