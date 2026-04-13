<template>
  <div>
    <Form labelPosition="top" :schema="priceSchema" @register="formRegister" :gridColumns="2" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

const props = defineProps({
  costPrices: {
    type: Object,
    default: () => ({})
  }
})

const computedCostPrices = computed(() => props.costPrices || {})

const { formRegister, formMethods } = useForm()

// 创建成本价验证器
const createCostPriceValidator = (costPriceKey: string, fieldName: string) => {
  return {
    validator: (_rule: any, value: number, callback: any) => {
      const costPrice = computedCostPrices.value[costPriceKey]
      if (costPrice !== undefined && value < costPrice) {
        callback(new Error(`${fieldName}不能低于成本价 ${costPrice} TRX`))
      } else {
        callback()
      }
    },
    trigger: ['blur', 'change'] // 添加 change 触发器，实现实时验证
  }
}

// 价格配置表单 - 整合所有价格配置
const priceSchema = reactive<FormSchema[]>([
  // 闪租能量
  {
    field: 'divider_flash_energy',
    component: 'Divider' as const,
    label: '闪租能量',
    colProps: { span: 24 }
  },
  {
    field: 'flash_price',
    component: 'InputNumber' as const,
    label: '闪租能量',
    componentProps: {
      placeholder: '请输入闪租能量价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '闪租能量是必填项' },
        createCostPriceValidator('flash_rent_price', '闪租能量价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.flash_rent_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              闪租能量 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },

  // 时间能量
  {
    field: 'divider_time_energy',
    component: 'Divider' as const,
    label: '时间能量',
    colProps: { span: 24 }
  },
  {
    field: 'time_1h',
    component: 'InputNumber' as const,
    label: '1小时租赁',
    componentProps: {
      placeholder: '请输入1小时租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '1小时租赁不能为空' },
        createCostPriceValidator('flash_rent_price', '1小时租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.flash_rent_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              1小时租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'day_1_price',
    component: 'InputNumber' as const,
    label: '1天租赁',
    componentProps: {
      placeholder: '请输入1天租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '1天租赁不能为空' },
        createCostPriceValidator('day_1_price', '1天租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.day_1_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              1天租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'day_3_price',
    component: 'InputNumber' as const,
    label: '3天租赁',
    componentProps: {
      placeholder: '请输入3天租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '3天租赁不能为空' },
        createCostPriceValidator('day_3_price', '3天租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.day_3_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              3天租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'day_7_price',
    component: 'InputNumber' as const,
    label: '7天租赁',
    componentProps: {
      placeholder: '请输入7天租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '7天租赁不能为空' },
        createCostPriceValidator('day_7_price', '7天租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.day_7_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              7天租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'day_15_price',
    component: 'InputNumber' as const,
    label: '15天租赁',
    componentProps: {
      placeholder: '请输入15天租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '15天租赁不能为空' },
        createCostPriceValidator('day_15_price', '15天租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.day_15_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              15天租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'day_30_price',
    component: 'InputNumber' as const,
    label: '30天租赁',
    componentProps: {
      placeholder: '请输入30天租赁价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '30天租赁不能为空' },
        createCostPriceValidator('day_30_price', '30天租赁价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.day_30_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              30天租赁 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },

  // 笔数能量
  {
    field: 'divider_count_energy',
    component: 'Divider' as const,
    label: '笔数能量',
    colProps: { span: 24 }
  },
  {
    field: 'count_price_trx',
    component: 'InputNumber' as const,
    label: '[1笔]能量TRX',
    componentProps: {
      placeholder: '请输入TRX价格',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '能量TRX是必填项' },
        createCostPriceValidator('count_price', '能量TRX价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.count_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              [1笔]能量TRX <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'count_price_usdt',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]能量USDT',
      tips: '只支持保留一位小数'
    },
    componentProps: {
      placeholder: '请输入USDT价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '能量USDT是必填项' }]
    }
  },

  // 智能托管
  {
    field: 'divider_managed_mode',
    component: 'Divider' as const,
    label: '智能托管',
    colProps: { span: 24 }
  },
  {
    field: 'price_trx_65000',
    component: 'InputNumber' as const,
    label: '65000能量',
    componentProps: {
      placeholder: '请输入65000能量价格',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '65000能量是必填项' },
        createCostPriceValidator('manage_price_65000', '65000能量价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.manage_price_65000
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX/笔` : '成本价: N/A'
          return (
            <>
              65000能量 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'price_trx_131000',
    component: 'InputNumber' as const,
    label: '131000能量',
    componentProps: {
      placeholder: '请输入131000能量价格',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '131000能量是必填项' },
        createCostPriceValidator('manage_price_13100', '131000能量价格')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.manage_price_13100
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX/笔` : '成本价: N/A'
          return (
            <>
              131000能量 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },

  // 批量下单
  {
    field: 'divider_batch_order',
    component: 'Divider' as const,
    label: '批量下单',
    colProps: { span: 24 }
  },
  {
    field: 'batch_energy_price',
    component: 'InputNumber' as const,
    label: '能量单价',
    componentProps: {
      placeholder: '请输入能量单价',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '能量单价是必填项' },
        createCostPriceValidator('batch_energy_price', '能量单价')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.batch_energy_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              能量单价 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'batch_active_price',
    component: 'InputNumber' as const,
    label: '激活地址单价',
    componentProps: {
      placeholder: '请输入激活地址单价',
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '激活地址单价是必填项' },
        createCostPriceValidator('batch_active_price', '激活地址单价')
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.batch_active_price
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              激活地址单价 <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },

  // 闪兑配置
  {
    field: 'divider_flash_exchange',
    component: 'Divider' as const,
    label: '闪兑配置',
    colProps: { span: 24 }
  },
  {
    field: 'min_trx_balance',
    component: 'InputNumber' as const,
    label: {
      text: '最低账号余额（TRX）',
      tips: '当您的账号余额低于此值，兑换将会失效。请设置合理的值避免影响其他业务'
    },
    componentProps: {
      placeholder: '请输入最低余额',
      min: 0,
      precision: 2
    }
  },
  {
    field: 'profit_usdt_to_trx',
    component: 'InputNumber' as const,
    label: {
      text: 'USDT兑TRX利润（百分比）',
      tips: '例如，输入15，就是15%'
    },
    componentProps: {
      placeholder: '请输入利润金额',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '利润金额是必填项' }]
    }
  },
  {
    field: 'max_usdt_to_trx',
    component: 'InputNumber' as const,
    label: {
      text: 'USDT兑TRX可兑换上限',
      tips: '单次可兑换USDT上限(USDT兑换TRX)'
    },
    componentProps: {
      placeholder: '请输入兑换上限',
      min: 0,
      precision: 2
    }
  },
  {
    field: 'profit_trx_to_usdt',
    component: 'InputNumber' as const,
    label: {
      text: 'TRX兑USDT利润（百分比）',
      tips: '例如，输入15，就是15%'
    },
    componentProps: {
      placeholder: '请输入利润金额',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '利润金额是必填项' }]
    }
  },
  {
    field: 'max_trx_to_usdt',
    component: 'InputNumber' as const,
    label: {
      text: 'TRX兑USDT可兑换上限',
      tips: '单次可兑换TRX上限(TRX兑换USDT)'
    },
    componentProps: {
      placeholder: '请输入兑换上限',
      min: 0,
      precision: 2
    }
  },

  // 福利板块
  {
    field: 'divider_welfare',
    component: 'Divider' as const,
    label: '福利板块',
    colProps: { span: 24 }
  },
  {
    field: 'weal_price_trx',
    component: 'InputNumber' as const,
    label: '福利能量（TRX）',
    componentProps: {
      placeholder: '请输入福利能量价格',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '福利能量是必填项' }
        // 移除成本价验证，允许低于成本价
      ],
      slots: {
        label: () => {
          const costPrice = computedCostPrices.value.weal_price_trx
          const costText = costPrice !== undefined ? `成本价: ${costPrice} TRX` : '成本价: N/A'
          return (
            <>
              福利能量（TRX） <small style="color: #909399; font-size: 10px;">（{costText}）</small>
            </>
          )
        }
      }
    }
  },
  {
    field: 'hour_limit_count',
    component: 'InputNumber' as const,
    label: {
      text: '每小时购买限制',
      tips: '每个用户每小时最多可购买的次数'
    },
    componentProps: {
      placeholder: '请输入限制次数',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '每小时购买限制是必填项' }]
    }
  },
  {
    field: 'total_limit_count',
    component: 'InputNumber' as const,
    label: {
      text: '总购买限制',
      tips: '每个用户总共最多可购买的次数'
    },
    componentProps: {
      placeholder: '请输入限制次数',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '总购买限制是必填项' }]
    }
  }
])

defineExpose({
  formMethods
})
</script>
