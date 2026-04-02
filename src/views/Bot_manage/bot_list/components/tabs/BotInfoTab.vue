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
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, defineExpose } from 'vue'
import { ElRow, ElCol, ElTag } from 'element-plus'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useFormValidation } from '../composables'
import { Icon } from '@/components/Icon'

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
const { required } = useFormValidation({})

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
    field: 'token',
    component: 'Input' as const,
    label: '机器人Token：',
    componentProps: {
      disabled: true
    }
  },
  // API密钥字段已隐藏
  // {
  //   field: 'api_key',
  //   component: 'Input' as const,
  //   label: 'API秘钥：',
  //   componentProps: {
  //     disabled: true
  //   }
  // },
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
    field: 'status',
    component: 'Switch' as const,
    label: '状态：',
    value: 1,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  },
  {
    field: 'describe',
    component: 'Input' as const,
    label: '备注：',
    componentProps: {
      placeholder: '请输入备注(选填)',
      type: 'textarea',
      rows: 3
    }
  }
  // {
  //   field: 'tg_verify_status',
  //   component: 'Tag' as const,
  //   label: 'TG同步状态：',
  //   componentProps: {
  //     disabled: true
  //   },
  //   formItemProps: {
  //     slots: {
  //       default: () => {
  //         return (
  //           <>
  //             <div class="flex items-center">
  //               <ElTag type="success">已同步</ElTag>
  //               <div
  //                 class="flex items-center ml-2 cursor-pointer"
  //                 style="color: #007bff"
  //                 onClick={syncTgStatus}
  //               >
  //                 <Icon icon="ri:refresh-line" />
  //                 <span class="ml-1">点我同步</span>
  //               </div>
  //             </div>
  //           </>
  //         )
  //       }
  //     }
  //   }
  // }
])

// TG状态同步
const syncTgStatus = () => {
  emit('sync-tg-status')
}

// 暴露表单方法
defineExpose({
  formMethods
})
</script>

<style scoped>
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
