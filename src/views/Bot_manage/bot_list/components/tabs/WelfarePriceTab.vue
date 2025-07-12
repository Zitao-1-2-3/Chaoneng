<template>
  <div>
    <Form :isCol="true" labelPosition="top" :schema="welfarePriceSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, ref, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useFormValidation } from '../composables'

// 表单相关
const { formRegister, formMethods } = useForm()
const { required } = useFormValidation()

// 定义 props 来接收 agentPrices
const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})
// 使用 computed 来安全地访问嵌套属性
const computedAgentPrices = computed(() => props.agentPrices || {})

// 福利价格配置表单
const welfarePriceSchema = reactive<FormSchema[]>([
  {
    field: 'weal_address',
    component: 'Input' as const,
    label: '【福利】收款钱包地址：',
    componentProps: {
      placeholder: '请输入福利收款钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '福利收款钱包地址是必填项' }]
    }
  },
  {
    field: 'weal_price_trx',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]福利TRX价格：'
      // tips: '只支持整数'
    },
    componentProps: {
      placeholder: '请输入TRX价格',
      min: 0,
      precision: 2,
      remark: () => {
        const costKey = 'flash_rent_price'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本价: {costPrice !== undefined ? `${costPrice} TRX` : 'N/A'}</p>
          </>
        )
      },
      slots: { suffix: () => <span>TRX</span> }
    },
    formItemProps: {
      rules: [{ required: true, message: '福利TRX价格是必填项' }]
    }
  },
  {
    field: 'line',
    component: 'Divider' as const,
    label: '购买设置'
  },
  {
    field: 'hour_limit_count',
    component: 'InputNumber' as const,
    label: '每小时使用笔数：',
    componentProps: {
      placeholder: '请输入每小时使用笔数',
      min: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '每小时使用笔数是必填项' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'total_limit_count',
    component: 'InputNumber' as const,
    label: '总使用笔数：',
    componentProps: {
      placeholder: '请输入总使用笔数',
      min: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '总使用笔数是必填项' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'check_resource_status',
    component: 'Switch' as const,
    label: {
      text: '是否开启质押黑名单：',
      tips: '开启则有质押的地址无法代理能量'
    },
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>

<style scoped>
.el-form-item__label {
  font-size: 14px;
  line-height: 32px;
}
</style>
