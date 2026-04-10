<template>
  <div>
    <Form :isCol="true" labelPosition="top" :schema="paymentSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

// 表单相关
const { formRegister, formMethods } = useForm()

// 收款配置表单
const paymentSchema = reactive<FormSchema[]>([
  {
    field: 'energy_address',
    component: 'Input' as const,
    label: '【1小时能量闪租】收款钱包地址：',
    componentProps: {
      placeholder: '请输入闪充收款钱包地址'
    },
    formItemProps: {
      rules: []
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: {
      text: '【余额充值】收款钱包地址',
      tips: '如果不填则使用1小时能量闪租的收款钱包地址'
    },
    componentProps: {
      placeholder: '请输入余额收款钱包地址'
    },
    formItemProps: {
      rules: []
    }
  },
  {
    field: 'energy_usdt_address',
    component: 'Input' as const,
    label: {
      text: '【按笔数购买】TRX/USDT收款钱包地址',
      tips: '请区分闪兑收款地址，不能相同'
    },
    componentProps: {
      placeholder: '请输入TRX/USDT收款钱包地址'
    },
    formItemProps: {
      rules: [
        {
          validator: (_: any, value: string, callback: (error?: Error) => void) => {
            // 当前值为空时不验证
            if (!value) {
              callback()
              return
            }
            // 使用setTimeout来确保能获取到最新的表单数据
            setTimeout(async () => {
              try {
                const formData = await formMethods.getFormData()
                if (formData && formData.energy_address && value === formData.energy_address) {
                  callback(new Error('TRX/USDT收款钱包地址不能与闪租收款钱包地址相同'))
                } else {
                  callback()
                }
              } catch (error) {
                callback()
              }
            }, 0)
          },
          trigger: 'blur'
        }
      ]
    }
  },
  {
    field: 'transfer_address',
    component: 'Input' as const,
    label: {
      text: '【闪兑TRX/USDT】收款钱包地址',
      tips: '请区分其他收款地址，不能相同'
    },
    componentProps: {
      placeholder: '请输入闪兑收款钱包地址'
    },
    formItemProps: {
      rules: [
        {
          validator: (_: any, value: string, callback: (error?: Error) => void) => {
            // 当前值为空时不验证
            if (!value) {
              callback()
              return
            }
            // 使用setTimeout来确保能获取到最新的表单数据
            setTimeout(async () => {
              try {
                const formData = await formMethods.getFormData()
                // 验证不能与其他地址相同
                if (formData.energy_address && value === formData.energy_address) {
                  callback(new Error('闪兑收款地址不能与闪租收款地址相同'))
                } else if (formData.energy_usdt_address && value === formData.energy_usdt_address) {
                  callback(new Error('闪兑收款地址不能与按笔数购买收款地址相同'))
                } else {
                  callback()
                }
              } catch (error) {
                callback()
              }
            }, 0)
          },
          trigger: 'blur'
        }
      ]
    }
  },
  {
    field: 'weal_address',
    component: 'Input' as const,
    label: '【福利】收款钱包地址',
    componentProps: {
      placeholder: '请输入福利收款钱包地址'
    },
    formItemProps: {
      rules: []
    }
  },
  {
    field: 'notice_order_tg_admin',
    component: 'Switch' as const,
    label: {
      text: '订单通知机器人管理员',
      tips: '开启后，如果有新的订单，管理员将会接收到通知'
    },
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
