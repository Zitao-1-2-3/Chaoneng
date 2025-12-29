<template>
  <div>
    <Form
      :schema="flashExchangeSchema"
      @register="formRegister"
      :isCol="true"
      labelPosition="top"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watchEffect, onMounted, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElCheckbox } from 'element-plus'
import Tips from '@/components/Tips/src/Tips.vue'

// 表单相关
const { formRegister, formMethods } = useForm()

// 告警功能是否启用（true=启用，false=禁用）
const isAlertEnabled = ref(false)

// 初始化状态
onMounted(async () => {
  const data = await formMethods.getFormData()
  // 如果有值则启用
  isAlertEnabled.value = data.stock_notice_trx_amount > 0

  // 更新输入框状态
  formMethods.setSchema([
    {
      field: 'stock_notice_trx_amount',
      path: 'componentProps.disabled',
      value: !isAlertEnabled.value
    }
  ])
})

// 监听状态变化自动更新输入框禁用状态
watchEffect(() => {
  formMethods.setSchema([
    {
      field: 'stock_notice_trx_amount',
      path: 'componentProps.disabled',
      value: !isAlertEnabled.value
    }
  ])
})

// 闪兑配置表单
const flashExchangeSchema = reactive<FormSchema[]>([
  {
    field: 'transfer_address',
    component: 'Input' as const,
    label: {
      text: '【闪兑TRX/USDT】收款钱包地址 ',
      tips: '提交后不能修改，如需修改，请联系客服'
    },
    componentProps: {
      placeholder: '请输入钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '收款钱包地址是必填项' }]
    }
  },
  {
    field: 'min_trx_balance',
    component: 'InputNumber' as const,
    label: {
      text: '最低账号余额',
      tips: '当您的账号余额低于此值，兑换将会失效。请设置合理的值避免影响其他业务'
    },
    componentProps: {
      placeholder: '请输入最低余额',
      min: 0,
      precision: 2,
      slots: {
        suffix: () => {
          return <div>TRX</div>
        }
      }
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
      precision: 2,
      remark: () => {
        const costKey = 'flash_change_price'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本：{costPrice !== undefined ? `${costPrice} TRX` : 'N/A'}</p>
          </>
        )
      }
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
      precision: 2,
      slots: {
        suffix: () => {
          return <div>TRX</div>
        }
      }
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
      precision: 2,
      slots: {
        suffix: () => {
          return <div>USDT</div>
        }
      }
    }
  },
  {
    field: 'stock_notice_trx_amount',
    component: 'InputNumber' as const,
    hidden: true,
    componentProps: {
      placeholder: '请输入库存告警值',
      min: 0,
      precision: 2
    },
    formItemProps: {
      slots: {
        label: () => {
          return (
            <>
              <ElCheckbox
                modelValue={isAlertEnabled.value}
                onUpdate:modelValue={(val: boolean) => {
                  isAlertEnabled.value = val
                  if (!val) {
                    formMethods.setValues({
                      stock_notice_trx_amount: undefined
                    })
                  }
                  formMethods.setValues({
                    stock_notice: val
                  })
                }}
              >
                <span>库存告警值</span>
                <Tips content="当您的可兑换库存低于设置值时，将会发送通知机器人管理员" />
              </ElCheckbox>
            </>
          )
        }
      }
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})

// 定义 props 来接收 agentPrices
const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

// 使用 computed 来安全地访问嵌套属性
const computedAgentPrices = computed(() => props.agentPrices || {})
</script>
