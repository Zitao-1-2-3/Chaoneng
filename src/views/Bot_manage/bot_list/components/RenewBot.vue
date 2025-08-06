<template>
  <Dialog v-model="dialogVisible" title="机器人续费" maxHeight="150px">
    <div class="text-lg font-bold mb-4"> 机器人费用：{{ currentBot.fee }} TRX/月 </div>
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
import { renewBotApi } from '@/api/botlist'

const emit = defineEmits(['success', 'close'])
const dialogVisible = ref(false)
const currentBot = ref<Record<string, any>>({})

const { required } = useValidator()
const { formRegister, formMethods } = useForm()

// 表单配置
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

// 打开弹窗
const open = (botInfo: Record<string, any>) => {
  currentBot.value = botInfo
  console.log('currentBot', botInfo.fee)
  dialogVisible.value = true

  // 设置表单数据
  formMethods.setValues({
    month_num: 1
  })
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
  emit('close')
}

// 提交表单
const submit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    try {
      const res = await renewBotApi({
        id: currentBot.value.id,
        month_num: formData.month_num
      })
      console.log('续费结果:', res)
      ElMessage.success('续费成功')
      dialogVisible.value = false
      emit('success')
    } catch (error) {
      console.error('续费失败:', error)
      ElMessage.error('续费失败，请稍后重试')
    }
  })
}

// 暴露方法
defineExpose({
  open
})
</script>
