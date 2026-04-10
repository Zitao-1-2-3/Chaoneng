<template>
  <div>
    <Form :schema="batchOrderSchema" @register="formRegister" :isCol="true" labelPosition="top" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, defineProps, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElInputNumber } from 'element-plus'

// 表单相关
const { formRegister, formMethods } = useForm()

// 批量下单价格表单
const batchOrderSchema = reactive<FormSchema[]>([
  {
    field: 'batch_energy_price',
    component: 'InputNumber' as const,
    label: '能量单价',
    componentProps: {
      placeholder: '请输入能量单价',
      min: 0,
      precision: 2,
      remark: () => {
        const costKey = 'flash_rent_price'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本为：{costPrice}TRX</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '能量单价是必填项' }]
    }
  },
  {
    field: 'batch_active_price',
    component: 'InputNumber' as const,
    label: '激活地址单价',
    componentProps: {
      placeholder: '请输入激活地址单价',
      precision: 2,
      remark: () => {
        const costKey = 'batch_active_price'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>激活成本为：{costPrice}TRX</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '激活地址单价是必填项' }]
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})

const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

const computedAgentPrices = computed(() => props.agentPrices || {})
console.log(computedAgentPrices.value, 'computedAgentPrices?')
</script>
