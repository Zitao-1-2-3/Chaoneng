<template>
  <div>
    <Form
      :isCol="true"
      labelPosition="top"
      :schema="countEnergySchema"
      @register="formRegister"
      :gridColumns="3"
    />
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

// 笔数能量价格表单
const countEnergySchema = reactive<FormSchema[]>([
  {
    field: 'count_price_trx',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]能量TRX价格：'
      // tips: '只支持整数'
    },
    componentProps: {
      placeholder: '请输入TRX价格',
      min: 0,
      precision: 2,
      remark: () => {
        const costKey = 'count_price'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本价: {costPrice !== undefined ? `${costPrice} TRX` : 'N/A'}</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '能量TRX价格是必填项' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'count_price_usdt',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]能量USDT价格：',
      tips: '只支持保留一位小数'
    },
    componentProps: {
      placeholder: '请输入USDT价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '能量USDT价格是必填项' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'notifyUser',
    component: 'Switch' as const,
    label: '地址笔数变更通知(用户)：',
    hidden: true,
    value: false,
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'notifyGroupOwner',
    component: 'Switch' as const,
    label: '地址笔数变更通知(群主)：',
    hidden: true,
    value: false,
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'notifyAdmin',
    component: 'Switch' as const,
    label: '地址笔数变更通知(机器人管理员)：',
    hidden: true,
    value: false,
    componentProps: {
      disabled: true
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
