<template>
  <div>
    <!-- 机器人基本信息表单 -->
    <Form
      :isCol="true"
      labelPosition="top"
      :schema="botInfoSchema"
      @register="formRegister"
      :gridColumns="3"
    />

    <!-- H5配置区域 - 独立显示 -->
    <div class="h5-config-section">
      <ElRow :gutter="20">
        <ElCol :span="8">
          <ElFormItem label="地址：">
            <ElInput v-model="h5Config.url" placeholder="请输入H5地址" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="客服账号：">
            <ElInput v-model="h5Config.tg_admin" placeholder="请输入客服账号" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="H5端：">
            <ElSwitch v-model="h5Config.h5_enable" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { ElRow, ElCol, ElFormItem, ElSwitch, ElInput } from 'element-plus'
import { v1GetSiteDetail } from '@/api/site'

const props = defineProps({
  tgStatus: {
    type: String,
    default: 'pending'
  },
  syncing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['sync-tg-status'])

// 表单相关
const { formRegister, formMethods } = useForm()
const { required } = useValidator()

// H5配置数据
const h5Config = ref({
  h5_enable: 0,
  url: '',
  tg_admin: ''
})

// 当前机器人ID
const currentBotId = ref<number | null>(null)

// 获取Site详情
const fetchSiteDetail = async (botId: number) => {
  try {
    const res = await v1GetSiteDetail(botId)
    if (res && res.data) {
      h5Config.value.url = res.data.url || ''
      h5Config.value.tg_admin = res.data.tg_admin || ''
      h5Config.value.h5_enable = res.data.status === 1 ? 1 : 0
    }
  } catch (error) {
    console.error('获取Site详情失败:', error)
  }
}

// 监听机器人ID变化，自动获取Site详情
watch(
  () => currentBotId.value,
  (newBotId) => {
    if (newBotId) {
      fetchSiteDetail(newBotId)
    }
  },
  { immediate: true }
)

// 机器人信息表单
const botInfoSchema = reactive<FormSchema[]>([
  {
    field: 'tg_bot_id',
    component: 'Input' as const,
    label: '机器人ID：',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'firstname',
    component: 'Input' as const,
    label: '机器人昵称：',
    componentProps: {
      // placeholder: '请输入机器人昵称',
      disabled: true
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'name',
    component: 'Input' as const,
    label: '机器人用户名：',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'tg_admin',
    component: 'Input' as const,
    label: '管理员TG账号：',
    componentProps: {
      placeholder: '请输入TG账号,以@开头'
    },
    formItemProps: {
      rules: [
        required(),
        {
          pattern: /^@.+$/,
          message: 'TG账号必须以@开头'
        }
      ]
    }
  },
  {
    field: 'describe',
    component: 'Input' as const,
    label: '备注：',
    componentProps: {
      placeholder: '请输入备注(选填)',
      type: 'textarea',
      rows: 1
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态：',
    value: 1,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  }
])

defineExpose({
  formMethods: {
    ...formMethods,
    setValues: (data: any) => {
      formMethods.setValues(data)

      if (data.tg_bot_id !== undefined) {
        currentBotId.value = data.tg_bot_id
      }

      if (data.h5_enable !== undefined) h5Config.value.h5_enable = data.h5_enable
      if (data.url !== undefined) h5Config.value.url = data.url
      if (data.tg_admin !== undefined) {
        h5Config.value.tg_admin = data.tg_admin
      }
    },
    getFormData: async () => {
      const formData = await formMethods.getFormData()
      return {
        ...formData,
        ...h5Config.value
      }
    }
  }
})
</script>

<style scoped>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.tg-status-row {
  margin-top: 15px;
  margin-bottom: 25px;
  line-height: 32px;
}

.label-col {
  padding-right: 12px;
  color: var(--el-text-color-regular);
  text-align: right;
}

.el-form-item__label {
  font-size: 14px;
  line-height: 32px;
}

.syncing {
  animation: rotate 3s linear infinite;
}

/* H5配置区域样式 */
.h5-config-section {
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.h5-config-section :deep(.el-form-item) {
  display: flex;
  flex-direction: column;
}

.h5-config-section :deep(.el-form-item__label) {
  font-size: 14px;
  line-height: 32px;
  text-align: left;
  justify-content: flex-start;
}

.h5-config-section :deep(.el-form-item__content) {
  margin-left: 0 !important;
}
</style>
