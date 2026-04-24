<template>
  <Dialog v-model="dialogVisible" title="充值">
    <Descriptions :schema="rechargeSchema" :data="userAccount" :column="2" border class="mb-4" />

    <Form
      ref="formRef"
      :schema="rechargeFormSchema"
      @register="formRegister"
      :showActionButtonGroup="false"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="close">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleRecharge">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, computed, reactive } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { rechargeTrxApi } from '@/api/agent/list'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'success'])

// 表单校验
const { required } = useValidator()

// 弹窗状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 用户账户数据
const userAccount = computed(() => props.user)

// 提交状态
const submitting = ref(false)

// 表单管理
const { formRegister, formMethods } = useForm()

// 充值用户信息展示
const rechargeSchema = computed<DescriptionsSchema[]>(() => {
  return [
    {
      field: 'username',
      label: '代理名称'
    },
    {
      field: 'email',
      label: '联系方式'
    },
    {
      field: 'trx_balance',
      label: 'TRX余额'
    }
    // {
    //   field: 'usdt_balance',
    //   label: 'USDT余额',
    //   hidden: true
    // }
  ]
})

// 充值表单结构定义
const rechargeFormSchema = reactive<FormSchema[]>([
  {
    field: 'coin',
    component: 'RadioGroup',
    label: '充值类型',
    value: 'TRX',
    componentProps: {
      options: [
        {
          label: '充值余额',
          value: 'TRX'
        }
        // {
        //   label: '充值USDT',
        //   value: 'USDT'
        // }
      ]
    }
  },
  {
    field: 'amount',
    component: 'InputNumber',
    label: '金额',
    componentProps: {
      placeholder: '请输入金额',
      style: {
        width: '100%'
      },
      remark: () => (
        <div>
          <span>如果需要扣减余额，请输入负数</span>
          <br />
          <span>例如：输入5，则是增加5余额，输入-5，则是扣减5余额</span>
        </div>
      )
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'secret',
    component: 'Input',
    label: '秘钥',
    componentProps: {
      placeholder: '请输入秘钥',
      type: 'password'
    },
    formItemProps: {
      rules: [required('秘钥不能为空')]
    }
  },
  {
    field: 'describe',
    component: 'Input',
    label: '备注',
    componentProps: {
      placeholder: '请输入备注',
      type: 'textarea',
      rows: 2
    }
  }
])

// 初始化表单
const initForm = () => {
  // 使用延迟确保表单完全注册
  setTimeout(() => {
    // 使用setValues方法设置初始值
    formMethods
      .setValues({
        coin: 'TRX',
        amount: '',
        secret: '',
        describe: ''
      })
      .catch((err) => {
        console.error('设置表单值失败:', err)
      })
  }, 200)
}

// 处理充值
const handleRecharge = async () => {
  if (!userAccount.value?.id) {
    ElMessage.warning('用户信息不完整，无法充值')
    return
  }

  try {
    // 验证表单是否已注册
    const form = await formMethods.getFormExpose()
    if (!form) {
      ElMessage.warning('表单未初始化，请稍后再试')
      return
    }

    // 表单验证
    const elForm = await formMethods.getElFormExpose()
    if (!elForm) {
      ElMessage.warning('表单未初始化，请稍后再试')
      return
    }

    const valid = await elForm.validate().catch(() => false)
    if (!valid) return

    submitting.value = true

    try {
      // 获取表单数据
      const formData = await formMethods.getFormData()

      // 构建参数（符合API要求的类型）
      const params = {
        agent_id: userAccount.value.id,
        amount: formData.amount,
        coin: formData.coin,
        secret: formData.secret,
        describe: formData.describe
      }

      // 调用充值API
      await rechargeTrxApi(params)

      ElMessage.success('充值成功')
      close()
      emit('success')
    } catch (error) {
      console.error('充值失败:', error)
      ElMessage.error('充值失败')
    } finally {
      submitting.value = false
    }
  } catch (error) {
    console.error('表单操作失败:', error)
    ElMessage.error('表单操作失败，请稍后再试')
  }
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
}

// 监听弹窗变化
const watchDialog = computed(() => props.visible)
watchDialog.value && initForm()
</script>

<style scoped>
.dialog-form {
  width: 100%;
}
</style>
