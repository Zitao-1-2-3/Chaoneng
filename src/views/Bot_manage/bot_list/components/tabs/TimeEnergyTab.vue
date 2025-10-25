<template>
  <div>
    <Form
      labelPosition="top"
      :schema="timeEnergySchema"
      @register="formRegister"
      :gridColumns="3"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, defineProps, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

const computedAgentPrices = computed(() => props.agentPrices || {})

const { formRegister, formMethods } = useForm()

const timeEnergySchema = reactive<FormSchema[]>([
  {
    field: 'flash_price',
    component: 'InputNumber' as const,
    label: {
      text: '【1小时】能量闪租价格（TRX ）（1笔6.5W能量）',
      tips: '最多支持保留一位小数，注意：此为1笔65000能量价格，不要设置0.1结尾的价格，避免和笔数价格冲突'
    },
    componentProps: {
      placeholder: '请输入时间能量价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'flash_rent_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '时间能量价格是必填项' }]
    },
    colProps: {
      span: 12
    }
  },

  // 闪租地址转账价格flash_addr_price
  {
    field: 'flash_addr_price',
    component: 'InputNumber' as const,
    label: '闪租地址转账价格',
    componentProps: {
      placeholder: '请输入闪租地址转账价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'flash_rent_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '闪租地址转账价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'flash_time_max_num',
    component: 'InputNumber' as const,
    hidden: true,
    label: {
      text: '【1小时】能量闪租最大倍数',
      tips: '如果转账金额超过设置的倍数 * 单价，则不发货'
    },
    componentProps: {
      placeholder: '请输入倍数',
      precision: 2
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'day_1_price',
    component: 'InputNumber' as const,
    label: '1天租赁价格',
    componentProps: {
      placeholder: '请输入1天租赁价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'day_1_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '1天租赁价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'day_3_price',
    component: 'InputNumber' as const,
    label: '3天租赁价格',
    componentProps: {
      placeholder: '请输入3天租赁价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'day_3_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '3天租赁价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'day_7_price',
    component: 'InputNumber' as const,
    label: '7天租赁价格',
    componentProps: {
      placeholder: '请输入7天租赁价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'day_7_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '7天租赁价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'day_15_price',
    component: 'InputNumber' as const,
    label: '15天租赁价格',
    componentProps: {
      placeholder: '请输入15天租赁价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'day_15_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '15天租赁价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'day_30_price',
    component: 'InputNumber' as const,
    label: '30天租赁价格',
    componentProps: {
      placeholder: '请输入30天租赁价格',
      min: 0,
      precision: 1,
      remark: () => {
        const costKey = 'day_30_price'
        const costPrice = computedAgentPrices.value[costKey]
        return costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '30天租赁价格不能为空' }]
    },
    colProps: {
      span: 12
    }
  }
])

defineExpose({
  formMethods
})
</script>
