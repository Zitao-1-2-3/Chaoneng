<template>
  <Dialog v-model="dialogVisible" title="机器人续费" maxHeight="150px" width="">
    <div class="text-lg font-bold mb-4"> 机器人费用：{{ botPrice?.amount }} TRX/月 </div>
    <Form :schema="formSchema" @register="formRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="close">取消</ElButton>
        <ElButton type="primary" @click="submit">确认续费</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { v1RenewBot, v1GetBotRenewPrice } from '@/api/botlist'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const emit = defineEmits(['success', 'close'])
const dialogVisible = ref(false)
const currentBot = ref<Record<string, any>>({})

const { required } = useValidator()
const { formRegister, formMethods } = useForm()
const botPrice = ref<any>(null)

const formSchema = reactive<FormSchema[]>([
  {
    field: 'month_num',
    component: 'InputNumber' as const,
    label: {
      text: '续费月数：',
      tips: '1=30天'
    },
    componentProps: {
      placeholder: '请输入续费月数',
      min: 1,
      max: 36,
      controlsPosition: 'right'
    },
    formItemProps: {
      rules: [required()]
    }
  }
])

const open = async (botInfo: Record<string, any>) => {
  currentBot.value = botInfo

  try {
    const res = await v1GetBotRenewPrice()
    if (res && res.data) {
      botPrice.value = res.data
    } else {
      handleErrorMessage(res, '获取续费价格失败')
    }
  } catch (error) {
    handleErrorMessage(error, '获取续费价格失败')
  }

  dialogVisible.value = true

  formMethods.setValues({
    month_num: 1
  })
}

const close = () => {
  dialogVisible.value = false
  emit('close')
}

const submit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    try {
      const res = await v1RenewBot({
        id: currentBot.value.id,
        month_num: formData.month_num
      })

      if (res.code === '000000') {
        handleSuccessMessage('续费成功')
        dialogVisible.value = false
        emit('success')
      } else {
        handleErrorMessage(res, '续费失败')
      }
    } catch (error) {
      handleErrorMessage(error, '续费失败')
    }
  })
}

defineExpose({
  open
})
</script>
