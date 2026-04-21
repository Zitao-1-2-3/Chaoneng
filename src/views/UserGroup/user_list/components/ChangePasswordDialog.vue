<template>
  <Dialog
    v-model="dialogVisible"
    title="修改密码"
    width="500px"
    max-height="140px"
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      style="padding: 15px 10px"
    >
      <ElFormItem label="账号" prop="account" style="margin-bottom: 16px">
        <ElInput v-model="formData.account" disabled />
      </ElFormItem>

      <ElFormItem label="新密码" prop="newPassword" style="margin-bottom: 8px">
        <ElInput
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton
        type="success"
        :loading="loading"
        @click="handleSubmit"
        style="width: 100%; height: 42px; font-size: 16px"
      >
        确定
      </ElButton>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
import { v1AdminChangePassword } from '@/api/tgUser'
import type { AdminChangePasswordParamsV1 } from '@/api/tgUser/types'

interface Props {
  visible: boolean
  user: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  account: '',
  newPassword: ''
})

const rules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val
    if (val && props.user) {
      // 填充表单数据 - 使用API原始字段
      // 优先使用 username（H5用户账号），如果没有则使用 tg_user_name（机器人用户名）
      formData.account = props.user.username || props.user.tg_user_name || ''
      formData.newPassword = ''
      // 清除验证
      formRef.value?.clearValidate()
    }
  }
)

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    // 调用管理员修改用户密码API
    const params: AdminChangePasswordParamsV1 = {
      id: props.user.id,
      password: formData.newPassword
    }
    await v1AdminChangePassword(params)

    handleSuccessMessage('密码修改成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    if (error !== false) {
      // false 表示表单验证失败，不需要显示错误消息
      handleErrorMessage(error, '密码修改失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.el-form-item) {
  align-items: center;
}

:deep(.el-form-item__label) {
  padding-right: 12px;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
}

:deep(.el-input__wrapper) {
  padding: 8px 12px;
}

:deep(.el-input__inner) {
  height: 32px;
  font-size: 14px;
  line-height: 32px;
}

:deep(.el-dialog__body) {
  padding: 15px 0 10px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
}

:deep(.el-dialog__header) {
  padding: 15px 20px;
}
</style>
