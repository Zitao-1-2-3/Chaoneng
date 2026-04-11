<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import Dialog from '@/components/Dialog/src/Dialog.vue'
import Form from '@/components/Form/src/Form.vue'
import { FormSchema } from '@/components/Form'
import { changeManagePasswordApiV2 } from '@/api/login'
import { useForm } from '@/hooks/web/useForm'
import { ElMessage, ElButton } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { formRegister, formMethods } = useForm()
const { getElFormExpose, getFormData } = formMethods

const formSchema = reactive<FormSchema[]>([
  {
    field: 'password',
    label: '旧密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请输入旧密码'
    },
    formItemProps: {
      required: true,
      rules: [{ required: true, message: '请输入旧密码', trigger: 'blur' }]
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'new_password',
    label: '新密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请输入八位以上密码'
    },
    formItemProps: {
      required: true,
      rules: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
      ]
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'confirm_password',
    label: '确认新密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请再次输入新密码'
    },
    formItemProps: {
      required: true,
      rules: [{ required: true, message: '请输入确认密码', trigger: 'blur' }]
    },
    colProps: {
      span: 24
    }
  }
])

const submitLoading = ref(false)

const submit = async () => {
  const form = await getElFormExpose()
  if (!form) return

  await form.validate(async (valid) => {
    if (valid) {
      const formData = await getFormData()
      if (formData.new_password !== formData.confirm_password) {
        ElMessage.error('两次输入的密码不一致')
        return
      }

      submitLoading.value = true
      try {
        // 使用新接口修改密码
        const res = await changeManagePasswordApiV2({
          password: formData.password,
          new_password: formData.new_password
        })
        if (res && res.code == '000000') {
          ElMessage.success('密码修改成功，请重新登录')
          emit('success')
          dialogVisible.value = false
          // 修改密码成功后退出登录
          userStore.logout()
        } else {
          ElMessage.error('密码修改失败')
        }
      } catch (e: any) {
        console.error('修改密码失败:', e)
        // 显示后端返回的错误信息
        const errorMsg = e.response?.data?.msg || e.message || '请求失败，请稍后再试'
        ElMessage.error(errorMsg)
      } finally {
        submitLoading.value = false
      }
    }
  })
}
</script>

<template>
  <Dialog v-model="dialogVisible" title="修改密码" width="500px">
    <Form :schema="formSchema" label-width="120px" @register="formRegister" />

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="submitLoading">确定</el-button>
    </template>
  </Dialog>
</template>

<style scoped></style>
