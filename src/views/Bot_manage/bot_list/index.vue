<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchBotList"
        :fetch-del-api="fetchBotDelete"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'id',
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
      </SearchTable>

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

    <ConsumptionRecord ref="consumptionRecordRef" />
    <RenewBot ref="renewBotRef" @success="handleRenewSuccess" />
    <BotConfig ref="botConfigRef" @success="handleConfigSuccess" />
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElButton, ElLink, ElMessage, ElSwitch } from 'element-plus'
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
import { v1GetBotList, v1CreateBot, v1UpdateBot, v1GetBotRenewPrice } from '@/api/botlist'
import { Tips } from '@/components/Tips'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRoute, useRouter } from 'vue-router'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

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

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { required } = useValidator()

const searchTableRef = ref<SearchTableInstance | null>(null)
const consumptionRecordRef = ref()
const renewBotRef = ref()
const botConfigRef = ref()
const isLoaded = ref(false)
const botPrice = ref<any>(null)
const totalCount = ref(0)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

// 表格列配置
const columns = [
  { field: 'id', label: '机器人ID' },
  {
    field: 'user_name',
    label: '机器人用户名',
    slots: {
      default: (data: any) => {
        const username = data.row.user_name
        return (
          <ElLink
            type="primary"
            onClick={() => window.open(`https://t.me/${username}`, '_blank')}
            style="cursor: pointer"
          >
            {username}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'first_name',
    label: '机器人昵称',
    formatter: (row: any) => row.first_name || '-'
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data: any) => {
        return (
          <ElSwitch
            v-model={data.row.status}
            activeValue={1}
            inactiveValue={2}
            onChange={() => handleStatusChange(data.row)}
          />
        )
      }
    }
  },
  {
    field: 'auto_renew',
    slots: {
      header: () => {
        return (
          <div>
            自动续费
            <Tips content="当机器人余额不足时，将会自动续费" />
          </div>
        )
      },
      default: (data: any) => {
        return (
          <ElSwitch
            v-model={data.row.auto_renew}
            activeValue={1}
            inactiveValue={2}
            onChange={() => handleStatusChange(data.row)}
          />
        )
      }
    }
  },
  {
    field: 'user_count',
    label: '用户数量',
    slots: {
      default: (data: any) => {
        return (
          <ElLink
            type="primary"
            style="cursor:pointer"
            onClick={() => handleUserCountClick(data.row.id)}
          >
            {data.row.user_count || 0}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    sortable: 'custom',
    formatter: (row: any) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
  },
  {
    field: 'expired_at',
    label: '到期时间',
    sortable: 'custom',
    formatter: (row: any) => (row.expired_at ? formatToDateTime(row.expired_at * 1000) : '-'),
    slots: {
      header: () => {
        return (
          <div>
            到期时间
            <Tips content="到期后，您的机器人将会被暂停使用" />
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
  width: 160,
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
    field: 'keyword',
    component: 'Input' as const,
    label: '机器人ID/用户名：',
    componentProps: {
      placeholder: '请输入机器人ID/用户名',
      clearable: true
    }
  }
]

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'fee',
    component: 'InputNumber' as const,
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

const { formRegister, formMethods } = useForm()

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  formMethods.setValues({
    fee: botPrice.value?.amount || 100,
    token: '',
    tg_admin: '',
    describe: '',
    status: 2
  })
}

const handleStatusChange = async (row: any) => {
  if (!isLoaded.value) return

  try {
    const res = await v1UpdateBot(row)
    if (res.code === '000000') {
      handleSuccessMessage('状态更新成功')
    } else {
      handleErrorMessage(res, '状态更新失败')
    }
  } catch (error) {
    handleErrorMessage(error, '状态更新失败')
  }
}

const handleEdit = (row: any) => {
  if (botConfigRef.value) {
    botConfigRef.value.open(row)
  }
}

const handleRenew = (row: any) => {
  const botInfo = {
    ...row,
    fee: row.fee || botPrice.value?.amount || 100
  }

  if (renewBotRef.value) {
    renewBotRef.value.open(botInfo)
  }
}

const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    try {
      const res = await v1CreateBot({
        agent_id: 0,
        token: formData.token,
        tg_admin: formData.tg_admin,
        describe: formData.describe || '',
        status: formData.status
      })

      if (res.code === '000000') {
        handleSuccessMessage(dialogType.value === 'add' ? '添加成功' : '编辑成功')
        dialogVisible.value = false
        searchTableRef.value?.reload()
      } else {
        const errorMsg = (res as any)?.msg || (res as any)?.message || ''
        if (
          errorMsg.includes('Duplicate entry') ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('1062')
        ) {
          ElMessage.error('该机器人已存在，请勿重复添加')
        } else {
          handleErrorMessage(res, '操作失败')
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.msg || String(error)
      if (
        errorMsg.includes('Duplicate entry') ||
        errorMsg.includes('duplicate') ||
        errorMsg.includes('1062')
      ) {
        ElMessage.error('该机器人已存在，请勿重复添加')
      } else {
        handleErrorMessage(error, '创建机器人失败')
      }
    }
  })
}

const fetchBotList = async (params: any) => {
  try {
    const apiParams: any = {
      current_page: params.page || 1,
      page_size: params.limit || 10
    }

    if (params.keyword) apiParams.keyword = params.keyword
    if (params.agent_name) apiParams.agent_name = params.agent_name
    if (params.status !== undefined && params.status !== '') apiParams.status = params.status
    if (params.order) apiParams.order = params.order

    const response = await v1GetBotList(apiParams)

    if (response.code === '000000' && response.data) {
      const list = response.data.list || []
      const total = response.data.pager?.total || 0

      totalCount.value = total

      const hasSearchCondition = !!(params.keyword || params.agent_name || params.status)
      handleListMessage(list, hasSearchCondition, '机器人')

      return { list, total }
    } else {
      handleErrorMessage(response, '获取机器人列表失败')
      return { list: [], total: 0 }
    }
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    return { list: [], total: 0 }
  }
}

const fetchBotDelete = async () => {
  try {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 500)
    })
  } catch (error) {
    return false
  }
}

const handleDataLoaded = ({ data, total, success }) => {
  nextTick(() => {
    isLoaded.value = true
  })
}

const handleLoadError = () => {
  ElMessage.error('加载数据失败')
}

const openConsumptionRecord = () => {
  consumptionRecordRef.value?.open()
}

const handleRenewSuccess = () => {
  searchTableRef.value?.reload()
}

const handleConfigSuccess = () => {
  searchTableRef.value?.reload()
}

const getBotPrice = async () => {
  try {
    const res = await v1GetBotRenewPrice()
    if (res.code === '000000') {
      botPrice.value = res.data
    } else {
      handleErrorMessage(res, '获取机器人价格失败')
    }
  } catch (error) {
    handleErrorMessage(error, '获取机器人价格失败')
  }
}

const handleUserCountClick = (botId: number | string) => {
  router.push({ path: '/user_group/user_list', query: { bot_id: botId } })
}

onMounted(async () => {
  await getBotPrice()
  const query = route?.query || {}

  setTimeout(() => {
    if (searchTableRef.value) {
      const keyword = (query.tg_bot_id as string) || (query.name as string)
      if (keyword) {
        searchTableRef.value.setSearchParams({ keyword })
      }
      searchTableRef.value.reload()
    }
  }, 100)
})
</script>
