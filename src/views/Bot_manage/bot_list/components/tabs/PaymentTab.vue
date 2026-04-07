<template>
  <div>
    <Form :isCol="true" labelPosition="top" :schema="paymentSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

// 表单相关
const { formRegister, formMethods } = useForm()

// 存储用户名
const username = ref('')

// 初始化时获取表单数据
onMounted(async () => {
  const formData = await formMethods.getFormData()
  username.value = formData.username || ''
})

// 收款配置表单
const paymentSchema = reactive<FormSchema[]>([
  {
    field: 'username',
    component: 'Input' as const,
    label: '用户名：',
    componentProps: {
      placeholder: username.value,
      disabled: true
    },
    formItemProps: {
      rules: [{ required: true, message: '用户名是必填项' }],
      style: {
        width: '50%'
      }
    }
  },
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
