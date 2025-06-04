<script setup lang="tsx">
import { Form, FormSchema } from '@/components/Form'
import { reactive, ref, unref, computed } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useForm } from '@/hooks/web/useForm'
import { ElInput, FormRules, ElTabs, ElTabPane } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import { IAgree } from '@/components/IAgree'
import { phoneRegisterApi, emailRegisterApi, sendPhoneCodeApi, sendEmailCodeApi } from '@/api/login'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['to-login'])

const { formRegister, formMethods } = useForm()
const { getElFormExpose } = formMethods

const { t } = useI18n()

const { required, email, phone } = useValidator()

// 添加注册类型切换
const registerType = ref('email') // 'phone' 或 'email'

// 验证码倒计时相关 - 暂时注释掉
// const countdown = ref(0)
// const isCounting = computed(() => countdown.value > 0)
// let timer: number | null = null

// 开始倒计时 - 暂时注释掉
// const startCountdown = () => {
//   countdown.value = 60
//   timer = window.setInterval(() => {
//     countdown.value--
//     if (countdown.value <= 0) {
//       clearInterval(timer!)
//       timer = null
//     }
//   }, 1000)
// }

// 发送验证码 - 暂时注释掉
// const sendCode = async () => {
//   const formRef = await getElFormExpose()

//   try {
//     if (registerType.value === 'phone') {
//       // 验证手机号
//       await formRef?.validateField('phone')
//       const formData = await formMethods.getFormData()

//       if (!formData.phone) {
//         ElMessage.warning('请输入手机号')
//         return
//       }

//       // 发送手机验证码
//       await sendPhoneCodeApi({
//         mobile: formData.phone,
//         channel: 'register'
//       })

//       ElMessage.success('验证码已发送到手机')
//     } else {
//       // 验证邮箱
//       await formRef?.validateField('email')
//       const formData = await formMethods.getFormData()

//       if (!formData.email) {
//         ElMessage.warning('请输入邮箱')
//         return
//       }

//       // 发送邮箱验证码
//       await sendEmailCodeApi({
//         email: formData.email,
//         channel: 'register'
//       })

//       ElMessage.success('验证码已发送到邮箱')
//     }

//     // 启动倒计时
//     startCountdown()
//   } catch (error) {
//     console.error('发送验证码失败:', error)
//     ElMessage.error('发送验证码失败，请稍后重试')
//   }
// }

// 切换注册方式时清空表单
const handleTabChange = () => {
  clearForm()
}

const clearForm = () => {
  formMethods.setValues({
    username: '',
    password: '',
    check_password: '',
    phone: '',
    email: '',
    // code: '', // 暂时注释掉验证码字段
    iAgree: false
  })
}

// 根据注册类型选择不同的验证规则 - 移除验证码验证
const rules = computed<FormRules>(() => {
  return registerType.value === 'phone'
    ? {
        username: [required()],
        password: [required()],
        check_password: [required()],
        phone: [required(), phone()]
        // code: [required()] // 暂时注释掉验证码验证
      }
    : {
        username: [required()],
        password: [required()],
        check_password: [required()],
        email: [required(), email()]
        // code: [required()] // 暂时注释掉验证码验证
      }
})

// 手机注册表单
const phoneSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.register')}</h2>
              <ElTabs v-model={registerType.value} class="w-[100%]" onTabChange={handleTabChange}>
                {/* <ElTabPane label={t('login.phoneRegister')} name="phone"></ElTabPane> */}
                <ElTabPane label={t('login.emailRegister')} name="email"></ElTabPane>
              </ElTabs>
            </>
          )
        }
      }
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    value: '',
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'phone',
    label: t('login.phoneNumber'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.inputPhoneNumber')
    }
  },
  // 暂时注释掉验证码字段
  // {
  //   field: 'code',
  //   label: t('login.code'),
  //   component: 'Input',
  //   colProps: { span: 24 },
  //   componentProps: {
  //     style: { width: '100%' },
  //     placeholder: t('login.codePlaceholder'),
  //     slots: {
  //       append: () => (
  //         <BaseButton
  //           type="primary"
  //           class="send-code-btn"
  //           disabled={isCounting.value}
  //           onClick={sendCode}
  //         >
  //           {isCounting.value ? `${countdown.value}秒` : t('login.getCode')}
  //         </BaseButton>
  //       )
  //     }
  //   }
  // },
  {
    field: 'password',
    label: t('login.password'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'check_password',
    label: t('login.checkPassword'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'register',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  type="primary"
                  class="w-[100%]"
                  loading={loading.value}
                  onClick={register}
                >
                  {t('login.register')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toLogin}>
                  {t('login.hasUser')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

// 邮箱注册表单
const emailSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.register')}</h2>
              <ElTabs v-model={registerType.value} class="w-[100%]" onTabChange={handleTabChange}>
                {/* <ElTabPane label={t('login.phoneRegister')} name="phone"></ElTabPane> */}
                <ElTabPane label={t('login.emailRegister')} name="email"></ElTabPane>
              </ElTabs>
            </>
          )
        }
      }
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    value: '',
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'email',
    label: t('login.email'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.inputEmail')
    }
  },
  // 暂时注释掉验证码字段
  // {
  //   field: 'code',
  //   label: t('login.code'),
  //   component: 'Input',
  //   colProps: { span: 24 },
  //   componentProps: {
  //     style: { width: '100%' },
  //     placeholder: t('login.codePlaceholder'),
  //     slots: {
  //       append: () => (
  //         <BaseButton
  //           type="primary"
  //           class="send-code-btn"
  //           disabled={isCounting.value}
  //           onClick={sendCode}
  //         >
  //           {isCounting.value ? `${countdown.value}秒` : t('login.getCode')}
  //         </BaseButton>
  //       )
  //     }
  //   }
  // },
  {
    field: 'password',
    label: t('login.password'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'check_password',
    label: t('login.checkPassword'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'register',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  type="primary"
                  class="w-[100%]"
                  loading={loading.value}
                  onClick={register}
                >
                  {t('login.register')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toLogin}>
                  {t('login.hasUser')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

// 根据注册类型切换表单
const schema = computed(() => {
  return registerType.value === 'phone' ? phoneSchema : emailSchema
})

const toLogin = () => {
  emit('to-login')
}

const loading = ref(false)

const register = async () => {
  const formRef = await getElFormExpose()
  formRef?.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 检查密码是否一致
        const formData = await formMethods.getFormData()
        if (formData.password !== formData.check_password) {
          ElMessage.error('两次输入的密码不一致')
          return
        }

        // 根据注册类型调用不同的注册API - 暂时去掉验证码参数
        if (registerType.value === 'phone') {
          // 手机号注册
          const res = await phoneRegisterApi({
            phone: formData.phone,
            password: formData.password,
            verify_code: '' // 暂时传递空字符串
          })

          if (res && res.code === '000000') {
            ElMessage.success('注册成功，请登录')
            // 注册成功后跳转到登录页
            toLogin()
          } else {
            ElMessage.error(res?.msg || '注册失败')
          }
        } else {
          // 邮箱注册
          const res = await emailRegisterApi({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            verify_code: '' // 暂时传递空字符串
          })

          if (res && res.code === '000000') {
            ElMessage.success('注册成功，请登录')
            // 注册成功后跳转到登录页
            toLogin()
          } else {
            ElMessage.error(res?.msg || '注册失败')
          }
        }
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('注册失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <Form
    :schema="schema"
    :rules="rules"
    label-position="top"
    hide-required-asterisk
    size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
    @register="formRegister"
  />
</template>

<style scoped>
/* 暂时注释掉发送验证码按钮的样式 */

/* .send-code-btn {
  width: 120px;
} */
</style>
