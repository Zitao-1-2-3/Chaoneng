<template>
  <div>
    <Form labelPosition="top" :schema="welfareSchema" @register="formRegister" :gridColumns="2" />
  </div>
</template>

<script setup lang="tsx">
import { reactive } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

const { formRegister, formMethods } = useForm()

// 福利配置表单
const welfareSchema = reactive<FormSchema[]>([
  // 购买限制
  {
    field: 'divider_purchase_limit',
    component: 'Divider' as const,
    label: '购买限制',
    colProps: { span: 24 }
  },
  {
    field: 'max_count',
    component: 'InputNumber' as const,
    label: {
      text: '最大购买次数',
      tips: '每个地址最多可购买的次数'
    },
    componentProps: {
      placeholder: '请输入最大次数',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '最大购买次数是必填项' }]
    }
  },
  {
    field: 'min_interval',
    component: 'InputNumber' as const,
    label: {
      text: '最小购买间隔（小时）',
      tips: '两次购买之间的最小时间间隔'
    },
    componentProps: {
      placeholder: '请输入最小间隔',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '最小购买间隔是必填项' }]
    }
  },

  // 能量和带宽限制
  {
    field: 'divider_energy_limit',
    component: 'Divider' as const,
    label: '能量和带宽限制',
    colProps: { span: 24 }
  },
  {
    field: 'max_energy',
    component: 'InputNumber' as const,
    label: {
      text: '最大能量',
      tips: '地址持有最大能量值'
    },
    componentProps: {
      placeholder: '请输入最大能量',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '最大能量是必填项' }]
    }
  },
  {
    field: 'max_bandwidth',
    component: 'InputNumber' as const,
    label: {
      text: '最大带宽',
      tips: '地址持有最大带宽值'
    },
    componentProps: {
      placeholder: '请输入最大带宽',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '最大带宽是必填项' }]
    }
  },

  // 账户要求
  {
    field: 'divider_account_requirement',
    component: 'Divider' as const,
    label: '账户要求',
    colProps: { span: 24 }
  },
  {
    field: 'min_active_day',
    component: 'InputNumber' as const,
    label: {
      text: '最小激活天数',
      tips: '地址需要激活的最少天数'
    },
    componentProps: {
      placeholder: '请输入最小激活天数',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '最小激活天数是必填项' }]
    }
  },
  {
    field: 'min_balance_trx',
    component: 'InputNumber' as const,
    label: {
      text: '最小余额（TRX）',
      tips: '地址持有最小TRX余额'
    },
    componentProps: {
      placeholder: '请输入最小TRX余额',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '最小余额（TRX）是必填项' }]
    }
  },
  {
    field: 'min_balance_usdt',
    component: 'InputNumber' as const,
    label: {
      text: '最小余额（USDT）',
      tips: '地址持有最小USDT余额'
    },
    componentProps: {
      placeholder: '请输入最小USDT余额',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '最小余额（USDT）是必填项' }]
    }
  },

  // 转账要求
  {
    field: 'divider_transfer_requirement',
    component: 'Divider' as const,
    label: '转账要求',
    colProps: { span: 24 }
  },
  {
    field: 'min_avg_transfer_trx',
    component: 'InputNumber' as const,
    label: {
      text: '最小平均转账（TRX）',
      tips: '地址的最小平均TRX转账金额'
    },
    componentProps: {
      placeholder: '请输入最小平均转账TRX',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '最小平均转账（TRX）是必填项' }]
    }
  },
  {
    field: 'min_avg_transfer_usdt',
    component: 'InputNumber' as const,
    label: {
      text: '最小平均转账（USDT）',
      tips: '地址的最小平均USDT转账金额'
    },
    componentProps: {
      placeholder: '请输入最小平均转账USDT',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '最小平均转账（USDT）是必填项' }]
    }
  },
  {
    field: 'min_send_interval',
    component: 'InputNumber' as const,
    label: {
      text: '最小发送间隔（分钟）',
      tips: '两次转账之间的最小时间间隔'
    },
    componentProps: {
      placeholder: '请输入最小发送间隔',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '最小发送间隔是必填项' }]
    }
  },

  // 相同金额转账限制
  {
    field: 'divider_same_amount_limit',
    component: 'Divider' as const,
    label: '相同金额转账限制',
    colProps: { span: 24 }
  },
  {
    field: 'same_send_max_count_trx',
    component: 'InputNumber' as const,
    label: {
      text: '相同金额最大次数（TRX）',
      tips: '相同金额TRX转账的最大允许次数。注意：此字段与"相同金额最小值"是一同判断'
    },
    componentProps: {
      placeholder: '请输入最大次数',
      min: 0,
      precision: 0
    },
    formItemProps: {
      rules: [
        { required: true, message: '相同金额最大次数（TRX）是必填项' },
        {
          validator: (_rule: any, value: number, callback: Function) => {
            // 使用 Promise 来处理异步验证
            formMethods
              .getFormData()
              .then((formData: any) => {
                const minAmount = formData.same_send_min_amount_trx
                // 如果当前字段有值（大于0），但最小金额为空或0，则报错
                if (value && value > 0 && (!minAmount || minAmount === 0)) {
                  callback(new Error('请同时填写相同金额最小值'))
                } else {
                  callback()
                }
              })
              .catch(() => {
                callback()
              })
          },
          trigger: ['blur', 'change']
        }
      ]
    }
  },
  {
    field: 'same_send_min_amount_trx',
    component: 'InputNumber' as const,
    label: {
      text: '相同金额最小值（TRX）',
      tips: '触发相同金额检测的最小TRX金额。注意：此字段与"相同金额最大次数"是一同判断'
    },
    componentProps: {
      placeholder: '请输入最小金额',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [
        { required: true, message: '相同金额最小值（TRX）是必填项' },
        {
          validator: (_rule: any, value: number, callback: Function) => {
            // 使用 Promise 来处理异步验证
            formMethods
              .getFormData()
              .then((formData: any) => {
                const maxCount = formData.same_send_max_count_trx
                // 如果当前字段有值（大于0），但最大次数为空或0，则报错
                if (value && value > 0 && (!maxCount || maxCount === 0)) {
                  callback(new Error('请同时填写相同金额最大次数'))
                } else {
                  callback()
                }
              })
              .catch(() => {
                callback()
              })
          },
          trigger: ['blur', 'change']
        }
      ]
    }
  }
])

defineExpose({
  formMethods
})
</script>
