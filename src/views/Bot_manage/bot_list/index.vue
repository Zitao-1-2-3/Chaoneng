<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用优化后的SearchTable组件 -->
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchBotList"
        :fetch-del-api="fetchBotDelete"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'tg_bot_id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        ref="searchTableRef"
        @add="handleAdd"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
        :pagination="{
          total: totalCount
        }"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="openConsumptionRecord">消费记录</BaseButton>
        </template>
        <!-- 自定义表格列 -->
        <template #botUsername="{ row }">
          <ElLink type="primary" :href="`https://t.me/${row.botUsername}`" target="_blank">
            {{ row.botUsername || '未命名' }}
          </ElLink>
        </template>
      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" title="添加机器人">
        <Form :isCol="false" :schema="formSchema" @register="formRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </ElButton>
            <ElButton type="primary" @click="handleSubmit"> 提交 </ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
    <!-- 添加消费记录组件 -->
    <ConsumptionRecord ref="consumptionRecordRef" />
    <!-- 添加续费组件 -->
    <RenewBot ref="renewBotRef" @success="handleRenewSuccess" />
    <!-- 添加机器人配置组件 -->
    <BotConfig ref="botConfigRef" @success="handleConfigSuccess" />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, h, nextTick } from 'vue'
import { ElButton, ElLink, ElMessage, ElMessageBox, ElSwitch, ElInputNumber } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { SearchTable } from '@/components/SearchTable'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import ConsumptionRecord from './components/ConsumptionRecord.vue'
import RenewBot from './components/RenewBot.vue'
import BotConfig from './components/BotConfig.vue'
import { getBotListApi, addBotApi, updateBotApi } from '@/api/botlist'
import { Icon } from '@/components/Icon'
import { Tips } from '@/components/Tips'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute, useRouter } from 'vue-router'
interface SearchTableInstance {
  reload: () => Promise<void>
  reset: () => Promise<any>
  search: () => Promise<any>
  delete: (row: any) => Promise<boolean>
  currentRow: any
  tableMethods: any
  searchMethods: any
  tableState: any
  searchParams: any
  setSearchParams: (params: any) => any
}

const searchTableRef = ref<SearchTableInstance | null>(null)

const { t } = useI18n()
const { required } = useValidator()
const consumptionRecordRef = ref()
const renewBotRef = ref()
const botConfigRef = ref()
const isLoaded = ref(false)

// 表格列配置
const columns = [
  { field: 'tg_bot_id', label: '机器人ID' },
  {
    field: 'name',
    label: '机器人用户名',
    slots: {
      default: (data: any) => {
        return (
          <>
            <ElLink type="primary" href={`https://t.me/${data.row.name}`} target="_blank">
              {data.row.name}
            </ElLink>
          </>
        )
      }
    }
  },
  {
    field: 'firstname',
    label: '机器人昵称',
    formatter: (row) => row.firstname
  },
  {
    field: 'status',
    label: '状态',
    // formatter: (row) => (row.status === 1 ? '是' : '否'),
    slots: {
      default: (data: any) => {
        return (
          <>
            <ElSwitch
              v-model={data.row.status}
              activeValue={1}
              inactiveValue={2}
              onChange={() => handleStatusChange(data.row)}
            />
          </>
        )
      }
    }
  },
  {
    field: 'auto_renew',
    // label: '自动续费',
    // formatter: (row) => (row.auto_renew === 1 ? '是' : '否'),
    slots: {
      header: () => {
        return (
          <div>
            自动续费
            <Tips content="当机器人余额不足时，将会自动续费" />：
          </div>
        )
      },
      default: (data: any) => {
        return (
          <>
            <ElSwitch
              v-model={data.row.auto_renew}
              activeValue={1}
              inactiveValue={2}
              onChange={() => handleStatusChange(data.row)}
            />
          </>
        )
      }
    }
  },
  {
    field: 'account_num',
    label: '用户数量',
    slots: {
      default: (data: any) => {
        return (
          <ElLink
            type="primary"
            style="cursor:pointer"
            onClick={() => handleUserCountClick(data.row.id)}
          >
            {data.row.account_num}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: (row) => formatToDateTime(row.create_time)
  },
  {
    field: 'expireTime',
    label: '到期时间',
    formatter: (row) => formatToDateTime(row.expire_time),
    slots: {
      header: () => {
        return (
          <div>
            到期时间
            <Tips content="到期后，您的机器人将会被暂停使用" />：
          </div>
        )
      }
    }
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleEdit(row)}>
            配置
          </BaseButton>
          <BaseButton type="success" onClick={() => handleRenew(row)}>
            续费
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'tg_bot_id',
    component: 'Input' as const,
    label: '机器人ID：',
    componentProps: {
      placeholder: '请输入机器人ID',
      clearable: true
    }
  },
  {
    field: 'name',
    component: 'Input' as const,
    label: '机器人用户名：',
    componentProps: {
      placeholder: '请输入机器人用户名',
      clearable: true
    }
  }
]

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'fee',
    component: 'InputNumber' as const,
    // label: '机器人费用：',
    componentProps: {
      placeholder: '请输入机器人费用',
      min: 0,
      precision: 2,
      disabled: true,
      slots: {
        suffix: () => {
          return <span>TRX/个</span>
        }
      }
    },
    formItemProps: {
      slots: {
        label: () => {
          return (
            <div>
              机器人费用
              <Tips content="将会从您的trongas账号扣费，请确保您的trongas账户余额充足" />：
            </div>
          )
        }
      }
    }
  },
  {
    field: 'token',
    component: 'Input' as const,
    // label: '机器人token：',
    componentProps: {
      placeholder: '请输入机器人token'
    },
    formItemProps: {
      rules: [required()],
      slots: {
        label: () => {
          return (
            <div>
              机器人token
              <Tips content="请输入BotFather返回的token" />：
            </div>
          )
        }
      }
    }
  },
  // {
  //   field: 'api_key',
  //   component: 'Input' as const,
  //   label: 'API秘钥：',
  //   componentProps: {
  //     placeholder: '请输入API秘钥'
  //   },
  //   formItemProps: {
  //     rules: [required()]
  //   }
  // },
  {
    field: 'tg_admin',
    component: 'Input' as const,
    label: '管理员TG账号：',
    componentProps: {
      placeholder: '请输入管理员TG账号'
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
      placeholder: '请输入备注',
      type: 'textarea',
      rows: 3,
      maxlength: 100,
      showWordLimit: true
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态：',
    value: true,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  }
]) as FormSchema[]

// 表单Hook
const { formRegister, formMethods } = useForm()

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

// 添加
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  // 重置表单
  formMethods.setValues({
    fee: 100,
    token: '',
    api_key: '',
    tg_admin: '',
    describe: '',
    status: 2
  })
}

// 状态切换
const handleStatusChange = async (value) => {
  if (!isLoaded.value) return
  console.log('状态切换:', value)
  // 调用API更新状态
  const res = await updateBotApi(value)
  if (res.code === '000000') {
    ElMessage.success('状态更新成功')
  } else {
    ElMessage.error('状态更新失败')
  }
  console.log('状态切换结果:', res)
}
// 编辑
const handleEdit = (row) => {
  if (botConfigRef.value) {
    botConfigRef.value.open(row)
  }
}

// 续费
const handleRenew = (row) => {
  if (renewBotRef.value) {
    renewBotRef.value.open(row)
  }
}

// 提交表单
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    // 这里应该调用真实的API
    console.log('提交的表单数据2:', formData)
    await addBotApi(formData)
    ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
    dialogVisible.value = false

    // 刷新表格数据
    searchTableRef.value?.reload()
  })
}

const totalCount = ref(0)
// 修改 fetchBotList 函数，修复数据加载问题
const fetchBotList = async (params) => {
  try {
    const response = await getBotListApi(params)
    totalCount.value = response?.data?.totalCount || 0
    return response?.data
  } catch (error) {
    console.error('获取机器人列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 模拟删除API
const fetchBotDelete = async () => {
  try {
    // 这里应该是调用真实的API
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 500)
    })
  } catch (error) {
    console.error('删除失败:', error)
    return false
  }
}

// 数据加载完成回调
const handleDataLoaded = ({ data, total, success }) => {
  console.log('数据加载完成:', {
    总条数: total,
    成功: success,
    数据: data,
    条数: data?.length || 0
  })
  nextTick(() => {
    isLoaded.value = true
  })
  if (data?.length === 0 && success) {
    ElMessage.info('未查询到符合条件的数据')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败，请稍后重试')
}

// 消费记录
const openConsumptionRecord = () => {
  consumptionRecordRef.value?.open()
}

// 处理删除
// const handleDelete = async (row) => {
//   try {
//     await ElMessageBox.confirm(`确认删除机器人 ${row.botUsername || 'BOT'} 吗？`, '提示', {
//       type: 'warning'
//     })
//     const result = await searchTableRef.value?.delete(row)
//     if (result) {
//       ElMessage.success(t('common.deleteSuccess'))
//     }
//   } catch (error) {
//     console.error('删除操作被取消或出错:', error)
//   }
// }

// 续费成功回调
const handleRenewSuccess = () => {
  if (searchTableRef.value) {
    searchTableRef.value.reload()
  }
}

// 配置成功回调
const handleConfigSuccess = () => {
  if (searchTableRef.value) {
    searchTableRef.value.reload()
  }
}

// 手动触发加载
onMounted(() => {
  const query = useRoute().query
  console.log('query', query)
  // 确保组件挂载后可以访问表格实例
  setTimeout(() => {
    if (searchTableRef.value) {
      searchTableRef.value.setSearchParams({
        tg_bot_id: query.tg_bot_id,
        name: query.name
      })
      console.log('手动触发数据刷新')
      searchTableRef.value.reload()
    }
  }, 100)
})

const router = useRouter()

const handleUserCountClick = (botId: number | string) => {
  router.push({ path: '/user_group/user_list', query: { bot_id: botId } })
}
</script>
