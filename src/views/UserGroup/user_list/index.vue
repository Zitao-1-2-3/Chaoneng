<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotListLoaded"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchAccountList"
        :showAddButton="false"
        ref="searchTableRef"
        @ready="onSearchTableReady"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport" style="margin-right: 10px">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 充值弹窗 -->
      <RechargeDialog
        v-model:visible="rechargeDialogVisible"
        :user="currentAccount"
        @success="handleRechargeSuccess"
      />

      <!-- 发送消息弹窗 -->
      <MessageDialog
        v-model="messageDialogVisible"
        :type="messageDialogType"
        :user="currentAccount"
        :bot-list="botsForDialog"
        @success="handleMessageSent"
      />

      <!-- 余额记录弹窗 -->
      <BalanceRecordDialog
        v-if="currentAccountId !== null"
        v-model:visible="balanceRecordDialogVisible"
        :account-id="currentAccountId"
      />

      <!-- 修改密码弹窗 -->
      <ChangePasswordDialog
        v-model:visible="changePasswordDialogVisible"
        :user="currentAccount"
        @success="handlePasswordChangeSuccess"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElMessage, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import type { FormSchema } from '@/components/Form'
import type { TableColumn } from '@/components/Table'
import { v1GetUserList } from '@/api/tgUser'
import type { UserListParamsV1 } from '@/api/tgUser/types'
import { v1GetBotList } from '@/api/botlist'
import MessageDialog from './components/MessageDialog/index.vue'
import { useRoute, useRouter } from 'vue-router'
import RechargeDialog from './components/RechargeDialog.vue'
import BalanceRecordDialog from './components/BalanceRecordDialog.vue'
import ChangePasswordDialog from './components/ChangePasswordDialog.vue'
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { simpleExportToExcel } from '@/utils/excel'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const route = useRoute()
const router = useRouter()

const isBotListLoaded = ref(false)
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])
const botInfoMap = ref<Map<number, { user_name: string; first_name: string }>>(new Map())

// 获取机器人列表
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await v1GetBotList({ page_size: 1000, current_page: 1 })
    if (res.code === '000000' && res.data) {
      const bots = (res.data.list || []).map((bot: any) => {
        botInfoMap.value.set(bot.id, {
          user_name: bot.user_name,
          first_name: bot.first_name
        })
        return {
          label: `${bot.user_name} (${bot.first_name})`,
          value: String(bot.id)
        }
      })
      botOptions.value = [{ label: '全部', value: '' }, ...bots]
      isBotListLoaded.value = true
    }
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    isBotListLoaded.value = false
  }
}

const botsForDialog = computed(() => {
  return botOptions.value.filter((option) => option.value !== '')
})

const currentAccount = ref<any>({})
const currentAccountId = ref<number | string | null>(null)
const messageDialogVisible = ref(false)
const messageDialogType = ref<'single' | 'mass'>('single')
const balanceRecordDialogVisible = ref(false)
const changePasswordDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)
const selectedSource = ref<number | string>('')

// 表格列配置
const columns = computed(() => {
  const allCols: TableColumn[] = [
    {
      field: 'tg_user_id',
      label: 'TG用户ID',
      width: 120,
      hideWhen: 2,
      formatter: (row) => (row.tg_user_id === 0 || !row.tg_user_id ? '-' : row.tg_user_id)
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      hideWhen: 2,
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      hideWhen: 2,
      formatter: (row) => row.tg_user_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      width: 150,
      hideWhen: 1,
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      width: 180,
      hideWhen: 1,
      formatter: (row) => row.email || '-'
    },
    {
      field: 'bot_id',
      label: '机器人ID',
      slots: {
        default: ({ row }) => {
          return (
            <ElLink type="primary" onClick={() => openBotList(row.bot_id)}>
              {row.bot_id}
            </ElLink>
          )
        }
      }
    },
    {
      field: 'bot_user_name',
      label: '机器人用户名'
    },
    {
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => {
        if ((!row.tg_user_id || row.tg_user_id === 0) && !row.tg_user_name) {
          return 'H5'
        }
        return '机器人'
      }
    },
    {
      field: 'trx_balance',
      label: 'TRX余额',
      formatter: (row) => `${row.trx_balance || 0} TRX`
    },
    {
      field: 'usdt_balance',
      label: 'USDT余额',
      hidden: true,
      formatter: (row) => `${row.usdt_balance || 0} USDT`
    },
    {
      field: 'created_at',
      label: '创建时间',
      sortable: 'custom',
      width: 180,
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
    },
    {
      field: 'updated_at',
      label: '更新时间',
      sortable: 'custom',
      width: 180,
      formatter: (row) => (row.updated_at ? formatToDateTime(row.updated_at * 1000) : '-')
    },
    {
      field: 'action',
      label: '操作',
      width: 380,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const isH5User = (!row.tg_user_id || row.tg_user_id === 0) && !row.tg_user_name
          const isBotUser = (row.tg_user_id && row.tg_user_id !== 0) || row.tg_user_name

          return (
            <div>
              <BaseButton
                type="primary"
                disabled={!isBotUser}
                onClick={() => openSendMessageDialog(row)}
              >
                发送消息
              </BaseButton>
              <BaseButton
                type="success"
                style="margin-left: 8px"
                onClick={() => openRechargeDialog(row)}
              >
                充值
              </BaseButton>
              <BaseButton
                type="warning"
                style="margin-left: 8px"
                onClick={() => handleBalanceRecord(row.id)}
              >
                余额记录
              </BaseButton>
              <BaseButton
                type="danger"
                style="margin-left: 8px"
                disabled={!isH5User}
                onClick={() => handleChangePassword(row)}
              >
                修改密码
              </BaseButton>
            </div>
          )
        }
      }
    }
  ]

  const filteredCols = allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource.value !== col.hideWhen
  })

  return filteredCols
})

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    component: 'Select' as const,
    label: '机器人',
    componentProps: {
      options: botOptions.value,
      placeholder: '请选择机器人',
      valueKey: 'value',
      labelKey: 'label'
    }
  },
  {
    field: 'origin',
    component: 'Select' as const,
    label: '来源',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: 'H5', value: 2 },
        { label: '机器人', value: 1 }
      ],
      placeholder: '请选择来源',
      valueKey: 'value',
      labelKey: 'label'
    }
  },
  {
    field: 'keyword',
    component: 'Input' as const,
    label: {
      text: '关键词',
      tips: '支持TG用户ID/TG用户名/TG用户昵称/用户账号/用户邮箱查询'
    },
    componentProps: {
      placeholder: '请输入关键字搜索'
    }
  }
])

// 获取账户列表
const fetchAccountList = async (params: any) => {
  try {
    selectedSource.value = params.origin || ''

    const queryParams: UserListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    if (params.order) {
      queryParams.order = params.order
    }

    if (params.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }

    if (params.origin !== undefined && params.origin !== '') {
      queryParams.origin = Number(params.origin)
    }

    if (params.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim()
    }

    const response = await v1GetUserList(queryParams)

    if (response.code === '000000' && response.data) {
      const mappedList = (response.data.list || []).map((item: any) => {
        const botInfo = botInfoMap.value.get(item.bot_id)

        return {
          ...item,
          bot_user_name: botInfo?.user_name || '-',
          bot_first_name: botInfo?.first_name || '-'
        }
      })

      return {
        list: mappedList,
        total: response.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取TG用户列表失败')
    return { list: [], total: 0 }
  }
}

const { searchTableRef } = useSearchTable({
  searchSchema: searchSchema.value,
  tableColumns: columns.value,
  fetchDataApi: fetchAccountList,
  immediate: false
})

const openBotList = (botId: number) => {
  router.push({
    path: '/bot_manage/bot_list',
    query: {
      tg_bot_id: botId
    }
  })
}

const openRechargeDialog = (row: any) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
}

const handleRechargeSuccess = () => {
  searchTableRef.value?.reload()
}

const handleBalanceRecord = (accountIdValue: number | string) => {
  if (!accountIdValue) {
    ElMessage.warning('无法获取用户ID，无法查看余额记录')
    return
  }
  currentAccountId.value = accountIdValue
  balanceRecordDialogVisible.value = true
}

const handleChangePassword = (row: any) => {
  currentAccount.value = row
  changePasswordDialogVisible.value = true
}

const handlePasswordChangeSuccess = () => {
  searchTableRef.value?.reload()
}

const openSendMessageDialog = (row: any) => {
  currentAccount.value = row
  messageDialogType.value = 'mass'
  messageDialogVisible.value = true
}

const handleMessageSent = () => {
  messageDialogVisible.value = false
}

// 处理导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()

    const queryParams: any = {}
    if (params?.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }
    if (params?.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim()
    }

    const res = await v1GetUserList(queryParams)

    if (res.code === '000000' && res.data && res.data.list) {
      const list = res.data.list.map((item: any) => {
        const botInfo = botInfoMap.value.get(item.bot_id)
        const origin =
          (!item.tg_user_id || item.tg_user_id === 0) && !item.tg_user_name ? 'H5' : '机器人'
        return {
          TG用户ID: item.tg_user_id === 0 || !item.tg_user_id ? '-' : item.tg_user_id,
          TG用户昵称: item.tg_first_name || '-',
          TG用户名: item.tg_user_name || '-',
          用户账号: item.username || '-',
          用户邮箱: item.email || '-',
          机器人ID: item.bot_id,
          机器人用户名: botInfo ? botInfo.user_name : '-',
          来源: origin,
          TRX余额: `${item.trx_balance || 0} TRX`,
          创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
          更新时间: item.updated_at ? formatToDateTime(item.updated_at * 1000) : '-'
        }
      })

      simpleExportToExcel(list, 'TG用户列表')
      handleSuccessMessage('用户列表导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '用户列表导出失败')
  }
}

function onSearchTableReady(instance: any) {
  const query = route.query
  if (!query.bot_id && !query.tg_id) {
    instance.reload()
  }
}

onMounted(async () => {
  await fetchBotList()
  const query = route.query
  if (query.bot_id) {
    const botId = botOptions.value.find((opt) => opt.value === String(query.bot_id))?.value
    if (botId !== undefined) {
      searchTableRef.value?.setSearchParams({ bot_id: botId })
      searchTableRef.value?.reload()
    }
  } else if (query.tg_id) {
    searchTableRef.value?.setSearchParams({ tg_id: String(query.tg_id) })
    searchTableRef.value?.reload()
  }
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
