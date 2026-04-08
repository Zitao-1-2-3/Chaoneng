<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { Dialog } from '@/components/Dialog'
import { useUserStore } from '@/store/modules/user'
import { getRoleListApi } from '@/api/role'

const { t } = useI18n()

const userStore = useUserStore()

const props = defineProps({
  currentRow: Object,
  dialogTitle: String,
  saveLoading: Boolean,
  actionType: String
})

const emit = defineEmits(['success', 'closed'])

const dialogVisible = ref(false)

const roleOptions = ref<{ label: string; value: number | string }[]>([])
const roleOptionsLoading = ref(false)

const fetchRoleOptions = async () => {
  roleOptionsLoading.value = true
  try {
    const res = await getRoleListApi()
    // 过滤掉禁用的角色 (status !== 2)
    roleOptions.value = (res.data?.list || [])
      .filter((item: any) => item.status !== 2)
      .map((item: any) => ({
        label: item.name,
        value: item.id
      }))
  } catch (error) {
    console.error('Write.vue: Failed to fetch role options:', error)
    roleOptions.value = []
  } finally {
    roleOptionsLoading.value = false
  }
}

const handleDialogOpen = () => {
  fetchRoleOptions()
}

watch(dialogVisible, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    emit('closed')
  }
})

const formLoading = ref(false)

const passwordRef = ref('')

const { formRegister, formMethods } = useForm()
const { setValues, getFormData, getElFormExpose } = formMethods

const userPermissions = computed(() => (userStore.userInfo?.permissions || []).map(String))

const canEditRole = computed(() => {
  return userStore.isSuperAdmin
})

const shouldShowPasswordFields = computed(() => {
  return props.actionType === 'add' || (props.actionType === 'edit' && userStore.isSuperAdmin)
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (!shouldShowPasswordFields.value) {
    callback()
    return
  }
  if (passwordRef.value) {
    if (!value) {
      callback(new Error(t('userDemo.passwordPlaceholder', '请输入密码 (至少8位，不能纯数字)')))
      return
    }
    if (passwordRef.value !== value) {
      callback(new Error(t('userDemo.passwordMismatch', '两次输入的密码不一致')))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const validatePassword = (rule: any, value: any, callback: any) => {
  if (!shouldShowPasswordFields.value) {
    callback()
    return
  }
  if (props.actionType === 'add' && !value) {
    callback(new Error(t('userDemo.inputPassword', '请输入密码')))
    return
  }
  if (value) {
    if (value.length < 8) {
      callback(new Error(t('userDemo.passwordLengthError', '密码长度不能少于8位')))
      return
    }
    if (/^\d+$/.test(value)) {
      callback(new Error(t('userDemo.passwordComplexityError', '密码不能为纯数字')))
      return
    }
  }
  callback()
}

const formSchema = computed<FormSchema[]>(() => {
  console.log(
    `Computing formSchema: actionType=${props.actionType}, isSuperAdmin=${userStore.isSuperAdmin}`
  )
  const isDisabledForNonSuperAdminEdit = props.actionType === 'edit' && !userStore.isSuperAdmin
  const isDisabledForPasswordField = !shouldShowPasswordFields.value
  console.log(
    `isDisabledForNonSuperAdminEdit=${isDisabledForNonSuperAdminEdit}, isDisabledForPasswordField=${isDisabledForPasswordField}`
  )

  return [
    {
      field: 'username',
      label: t('userDemo.username'),
      component: 'Input',
      componentProps: {
        placeholder: '请输入英文或数字组合，至少4位',
        disabled: isDisabledForNonSuperAdminEdit
      }
    },
    {
      field: 'role_id',
      label: t('userDemo.role'),
      component: 'Select',
      componentProps: {
        placeholder: '请选择角色',
        options: roleOptions.value,
        disabled: isDisabledForNonSuperAdminEdit
      }
    },
    {
      field: 'status',
      label: t('userDemo.status'),
      component: 'RadioGroup',
      componentProps: {
        disabled: isDisabledForNonSuperAdminEdit,
        options: [
          { label: t('userDemo.enable'), value: 1 },
          { label: t('userDemo.disable'), value: 2 }
        ]
      }
    },
    {
      field: 'password',
      label: t('userDemo.password'),
      component: 'Input',
      componentProps: {
        type: 'password',
        showPassword: true,
        placeholder: t('userDemo.passwordPlaceholder', '请输入密码 (至少8位，不能纯数字)'),
        onInput: (val: string) => (passwordRef.value = val),
        disabled: isDisabledForPasswordField
      }
    },
    {
      field: 'confirmPassword',
      label: t('userDemo.confirmPassword'),
      component: 'Input',
      componentProps: {
        type: 'password',
        showPassword: true,
        placeholder: t('userDemo.passwordPlaceholder', '请输入密码 (至少8位，不能纯数字)'),
        disabled: isDisabledForPasswordField
      }
    }
  ]
})

const rules = {
  username: [
    {
      required: true,
      message: t('userDemo.username') + t('common.isRequired', '不能为空'),
      trigger: 'blur'
    },
    { min: 4, message: t('userDemo.usernameLengthError', '用户名长度不能少于4位'), trigger: 'blur' }
  ],
  role_id: [
    {
      required: true,
      message: t('userDemo.role') + t('common.isRequired', '不能为空'),
      trigger: 'blur'
    }
  ],
  status: [
    {
      required: true,
      message: t('userDemo.status') + t('common.isRequired', '不能为空'),
      trigger: 'change'
    }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const open = () => {
  dialogVisible.value = true
  passwordRef.value = ''
  roleOptions.value = []
  if (!props.currentRow) {
    setValues({ username: '', status: 1, role_id: undefined, password: '', confirmPassword: '' })
  } else {
    setValues({ ...props.currentRow, password: '', confirmPassword: '' })
  }
}
const close = () => {
  dialogVisible.value = false
}
const submit = async () => {
  const elForm = await getElFormExpose()
  const valid = await elForm?.validate().catch((err) => {
    console.error('Write form validation failed:', err)
    return false
  })
  if (valid) {
    const formData = await getFormData(false)

    console.log('formData immediately after getFormData(false):', JSON.stringify(formData))

    if (formData.confirmPassword !== undefined) {
      delete formData.confirmPassword
    }

    console.log('formData before return:', JSON.stringify(formData))

    return formData
  } else {
    return null
  }
}
defineExpose({ open, close, submit })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :fullscreen="false" @open="handleDialogOpen">
    <Form
      :rules="rules"
      @register="formRegister"
      :schema="formSchema"
      :loading="formLoading || roleOptionsLoading"
    />
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Dialog>
</template>
