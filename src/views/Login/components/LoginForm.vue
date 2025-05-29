<script setup lang="tsx">
import { reactive, ref, watch, onMounted, unref, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCheckbox, ElLink, ElTabs, ElTabPane, ElInput, ElButton } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi, getTestRoleApi, getAdminRoleApi } from '@/api/login'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { Icon } from '@/components/Icon'
import { useUserStore } from '@/store/modules/user'
import { BaseButton } from '@/components/Button'
import { isManagementSystem } from '@/utils/system' // <-- 导入
import {
  passwordLoginApi,
  verifyCodeLoginApi,
  sendPhoneCodeApi,
  sendEmailCodeApi,
  getCaptchaApi,
  getUserInfoApi
} from '@/api/login'
import { ElMessage } from 'element-plus'

const { required, email, phone } = useValidator()

const emit = defineEmits(['to-register'])

const appStore = useAppStore()

const userStore = useUserStore()

const permissionStore = usePermissionStore()

const { currentRoute, addRoute, push, replace } = useRouter()

const { t } = useI18n()

const isManagement = isManagementSystem()
// 添加登录类型切换
const loginType = ref('account') // 'account' 或 'phone'

// 根据登录类型使用不同的验证规则
const rules = computed(() => {
  return loginType.value === 'account'
    ? {
        username: [required()],
        password: [required()]
      }
    : {
        phone: [required(), phone()],
        code: [required()]
      }
})

// 倒计时相关
const countdown = ref(0)
const isCounting = computed(() => countdown.value > 0)
let timer: number | null = null

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
    }
  }, 1000)
}

// 修改发送验证码函数
const sendCode = async () => {
  try {
    const formData = await getFormData()
    if (!formData.phone) {
      ElMessage.warning('请输入手机号/邮箱')
      return
    }

    // 判断是手机号还是邮箱
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.phone)
    const isPhone = /^1\d{10}$/.test(formData.phone)

    if (isEmail) {
      await sendEmailCodeApi({
        email: formData.phone,
        channel: 'login'
      })
    } else if (isPhone) {
      await sendPhoneCodeApi({
        mobile: formData.phone,
        channel: 'login'
      })
    } else {
      ElMessage.warning('请输入正确的手机号或邮箱')
      return
    }

    ElMessage.success('验证码已发送')
    // 启动倒计时
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请稍后重试')
  }
}

// 修改 schema 使用计算属性，根据当前登录类型返回对应表单
const schema = computed(() => {
  return loginType.value === 'account' ? accountSchema : phoneSchema
})
const handleTabChange = (tab: string) => {
  // loginType.value = tab
  clearForm()
}

const clearForm = () => {
  formMethods.setValues({
    username: '',
    password: '',
    phone: '',
    code: ''
  })
}

// 图形验证码相关状态
const captchaImg = ref('')
const captchaId = ref('')

// 获取图形验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptchaApi()
    if (res.data && res.code === '000000') {
      captchaImg.value = res.data.data
      captchaId.value = res.data.id
    } else {
      ElMessage.error('获取验证码失败')
    }
  } catch (e) {
    ElMessage.error('获取验证码失败')
  }
}

// 账号密码登录表单
const accountSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.login')}</h2>
              <ElTabs v-model={loginType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.accountLogin')} name="account"></ElTabPane>
                {/* <ElTabPane label={t('login.phoneLogin')} name="phone"></ElTabPane> */}
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
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: '支持用户名/邮箱登录'
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: '请输入密码'
    }
  },
  {
    field: 'verify_code',
    label: '验证码',
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: '请输入验证码',
      slots: {
        append: () => (
          <img
            src={captchaImg.value}
            style="height:32px;cursor:pointer;vertical-align:middle;"
            onClick={fetchCaptcha}
            title="点击刷新验证码"
            alt="captcha"
          />
        )
      },
      onKeydown: (_e: any) => {
        if (_e.key === 'Enter') {
          _e.stopPropagation()
          signIn()
        }
      }
    }
  },
  {
    field: 'tool',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="flex justify-between items-center w-[100%]">
                <ElCheckbox v-model={remember.value} label={t('login.remember')} size="small" />
                {isManagement && (
                  <ElLink type="primary" underline={false} onClick={toResetPassword}>
                    {t('login.forgetPassword')}
                  </ElLink>
                )}
              </div>
            </>
          )
        }
      }
    }
  },
  {
    field: 'login',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  loading={loading.value}
                  type="primary"
                  class="w-[100%]"
                  onClick={signIn}
                >
                  {t('login.login')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                {isManagement && (
                  <BaseButton class="w-[100%]" onClick={toRegister}>
                    {t('login.register')}
                  </BaseButton>
                )}
              </div>
            </>
          )
        }
      }
    }
  }
])

// 手机验证码登录表单
const phoneSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.login')}</h2>
              <ElTabs v-model={loginType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.accountLogin')} name="account"></ElTabPane>
                {/* <ElTabPane label={t('login.phoneLogin')} name="phone"></ElTabPane> */}
              </ElTabs>
            </>
          )
        }
      }
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
  {
    field: 'code',
    label: t('login.code'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: t('login.codePlaceholder'),
      onKeydown: (_e: any) => {
        if (_e.key === 'Enter') {
          _e.stopPropagation()
          signIn()
        }
      },
      slots: {
        append: () => (
          <BaseButton
            type="primary"
            class="send-code-btn"
            disabled={isCounting.value}
            onClick={sendCode}
          >
            {isCounting.value ? `${countdown.value}秒` : t('login.getCode')}
          </BaseButton>
        )
      }
    }
  },
  {
    field: 'tool',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="flex justify-between items-center w-[100%]">
                <ElCheckbox v-model={remember.value} label={t('login.remember')} size="small" />
                <ElLink type="primary" underline={false} onClick={toResetPassword}>
                  {t('login.forgetPassword')}
                </ElLink>
              </div>
            </>
          )
        }
      }
    }
  },
  {
    field: 'login',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  loading={loading.value}
                  type="primary"
                  class="w-[100%]"
                  onClick={signIn}
                >
                  {t('login.login')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toRegister}>
                  {t('login.register')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

const iconSize = 30

const remember = ref(userStore.getRememberMe)

const initLoginInfo = () => {
  const loginInfo = userStore.getLoginInfo
  console.log('loginInfo', loginInfo)
  if (loginInfo) {
    const { username, password } = loginInfo
    setValues({ username, password })
  }
}
onMounted(() => {
  initLoginInfo()
  fetchCaptcha()
})

const { formRegister, formMethods } = useForm()
const { getFormData, getElFormExpose, setValues } = formMethods

const loading = ref(false)

const iconColor = '#999'

const hoverColor = 'var(--el-color-primary)'

const redirect = ref<string>('')

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)

// 修改登录函数
const signIn = async () => {
  const formRef = await getElFormExpose()
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loading.value = true
      const formData = await getFormData()

      try {
        // 根据登录类型调用不同的登录接口
        let res
        if (loginType.value === 'account') {
          // 账号密码登录
          const loginPayload = {
            username: formData.username,
            password: formData.password,
            verify_code: formData.verify_code,
            code_id: captchaId.value
          }
          res = await passwordLoginApi(loginPayload)
        } else {
          // 账号验证码登录
          res = await verifyCodeLoginApi({
            username: formData.phone,
            verify_code: formData.code
          })
        }

        if (res && res.code === '000000') {
          // 是否记住我
          if (unref(remember)) {
            userStore.setLoginInfo({
              username: loginType.value === 'account' ? formData.username : formData.phone,
              password: loginType.value === 'account' ? formData.password : ''
            })
          } else {
            userStore.setLoginInfo(undefined)
          }
          userStore.setRememberMe(unref(remember))

          // 设置Token
          userStore.setToken(res.data)

          // 获取用户信息
          // TODO: 这里应该是从token解析或者调用获取用户信息接口
          if (!isManagement) {
            const userInfo = await getUserInfoApi()
            if (userInfo && userInfo.code === '000000') {
              console.log(userInfo.data)
              const { permissions, name, role_ID, role_name } = userInfo.data
              userStore.setUserInfo({
                permissions,
                username: name,
                role_ID,
                role_name
              })
            }
          } else {
            userStore.setUserInfo({ username: formData.username, password: formData.password })
          }

          console.log('登录前 dynamicRouter 状态:', appStore.getDynamicRouter)
          // 确保设置为false
          appStore.$patch({
            dynamicRouter: false,
            serverDynamicRouter: false
          })
          console.log('登录后 dynamicRouter 状态:', appStore.getDynamicRouter)

          // 是否使用动态路由
          if (appStore.getDynamicRouter) {
            console.log('使用动态路由')
            getRole()
          } else {
            console.log('使用静态路由')
            await permissionStore.generateRoutes('static').catch(() => {})
            console.log('permissionStore.getAddRouters', permissionStore.getAddRouters)
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
            })
            permissionStore.setIsAddRouters(true)
            console.log('permissionStore.addRouters', permissionStore.addRouters)
            push({ path: redirect.value || permissionStore.addRouters[0].path })
          }

          ElMessage.success('登录成功')
        } else {
          // 登录失败，显示错误信息并刷新验证码
          const errorMsg = res?.msg || '登录失败'
          ElMessage.error(errorMsg)
          fetchCaptcha() // 只要失败就刷新验证码
        }
      } catch (error: any) {
        // Keep type any for easier access in generic error message
        console.error('登录失败:', error)
        // API 调用本身失败 (网络等)，显示通用错误信息，也刷新验证码以防万一
        const errorMsg = error?.response?.data?.msg || error?.message || '登录失败，请检查网络连接'
        ElMessage.error(errorMsg)
        fetchCaptcha() // 也刷新验证码
      } finally {
        loading.value = false
      }
    }
  })
}

// 获取角色信息
const getRole = async () => {
  const formData = await getFormData()
  const params = {
    roleName: loginType.value === 'account' ? formData.username : formData.phone
  }
  const res =
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await getAdminRoleApi(params)
      : await getTestRoleApi(params)
  if (res) {
    const routers = res.data || []
    userStore.setRoleRouters(routers)
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await permissionStore.generateRoutes('server', routers).catch(() => {})
      : await permissionStore.generateRoutes('frontEnd', routers).catch(() => {})

    permissionStore.getAddRouters.forEach((route) => {
      addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
    })
    permissionStore.setIsAddRouters(true)
    push({ path: redirect.value || permissionStore.addRouters[0].path })
  }
}

// 去注册页面
const toRegister = () => {
  emit('to-register')
}

// 跳转到重置密码页面
const toResetPassword = () => {
  console.log('跳转到重置密码页面')
  push('/reset-password')
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
.send-code-btn {
  width: 120px;
}
</style>
