<template>
  <div>
    <Form :isCol="true" labelPosition="top" :schema="paymentSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="ts">
import { reactive, defineExpose, ref, onMounted } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useFormValidation } from '../composables'

// 表单相关
const { formRegister, formMethods } = useForm()
const { required } = useFormValidation({})

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
    label: '【1小时能量闪租/余额充值】收款钱包地址：',
    componentProps: {
      placeholder: '请输入闪充收款钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '闪充收款钱包地址是必填项' }]
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
      // disabled: true
    },
    formItemProps: {
      rules: [{ required: true, message: '余额收款钱包地址是必填项' }]
    }
  },
  {
    field: 'energy_usdt_address',
    component: 'Input' as const,
    label: {
      text: '【按笔数购买】USDT收款钱包地址',
      tips: '请区分闪兑首款地址，不能相同'
    },
    componentProps: {
      placeholder: '请输入USDT收款钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: 'USDT收款钱包地址是必填项' }]
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
