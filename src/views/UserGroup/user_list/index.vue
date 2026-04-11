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
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport" style="margin-right: 10px">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
          <BaseButton type="primary" @click="openMassSendDialog()" style="margin-right: 10px"
            >群发消息</BaseButton
          >
          <BaseButton type="success" @click="openMassSendRecordDialog()">群发记录</BaseButton>
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

      <!-- 群发记录弹窗 -->
      <MassSendRecordDialog
        v-model="massSendRecordDialogVisible"
        ref="massSendRecordDialogRef"
        :bot-list="botOptions"
      />

      <!-- 新增：余额记录弹窗 -->
      <BalanceRecordDialog
        v-if="currentAccountId !== null"
        v-model:visible="balanceRecordDialogVisible"
        :account-id="currentAccountId"
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
import MessageDialog from './components/MessageDialog.vue'
import MassSendRecordDialog from './components/MassSendRecordDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import RechargeDialog from './components/RechargeDialog.vue'
import BalanceRecordDialog from './components/BalanceRecordDialog.vue'
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { simpleExportToExcel } from '@/utils/excel'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const route = useRoute()
const router = useRouter()

// State for conditional rendering
const isBotListLoaded = ref(false)

// 机器人下拉options，全部string类型
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])

// 获取机器人列表
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await v1GetBotList({ page_size: 1000, current_page: 1 })
    if (res.code === '000000' && res.data) {
      const bots = (res.data.list || []).map((bot: any) => {
        // 保存机器人信息到 Map 中
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

// 为弹窗准备的机器人列表 (不包含"全部")
const botsForDialog = computed(() => {
  return botOptions.value.filter((option) => option.value !== '')
})

// 机器人信息映射表
const botInfoMap = ref<Map<number, { user_name: string; first_name: string }>>(new Map())

// 当前选中账户
const currentAccount = ref<any>({})
const currentAccountId = ref<number | string | null>(null)

// 消息发送相关
const messageDialogVisible = ref(false)
const messageDialogType = ref<'single' | 'mass'>('single')
const massSendRecordDialogVisible = ref(false)

// 新增：余额记录弹窗可见状态
const balanceRecordDialogVisible = ref(false)

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'tg_id',
    label: 'TG用户ID',
    width: 120
  },
  {
    field: 'nickname',
    label: 'TG用户昵称'
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    type: 'link',
    url: (row) => `https://t.me/${row.tg_name}`
  },
  {
    field: 'tg_bot_id',
    label: '机器人ID',
    slots: {
      default: ({ row }) => {
        return (
          <ElLink type="primary" onClick={() => openBotList(row.bot_info.tg_bot_id)}>
            {row.tg_bot_id}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'bot_info.bot_name',
    label: '机器人用户名'
  },
  {
    field: 'trx_mount',
    label: 'TRX余额',
    formatter: (row) => `${row.trx_mount || 0} TRX`
  },
  {
    field: 'usdt_mount',
    label: 'USDT余额',
    hidden: true,
    formatter: (row) => `${row.usdt_mount || 0} USDT`
  },
  {
    field: 'create_time',
    label: '创建时间',
    sortable: 'custom',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'update_time',
    label: '更新时间',
    sortable: 'custom',
    width: 180,
    formatter: (row) => (row.update_time ? formatToDateTime(row.update_time * 1000) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: 300,
    fixed: 'right',
    slots: {
      default: ({ row }) => {
        return (
          <div>
            <BaseButton type="primary" onClick={() => openSendMessageDialog(row)}>
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
          </div>
        )
      }
    }
  }
]

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
    field: 'query',
    component: 'Input' as const,
    label: '关键词',
    colProps: {
      span: 8
    },
    componentProps: {
      placeholder: '请输入TG用户ID/用户名/用户昵称'
    }
  }
])

// API 封装 - 获取账户信息
const fetchAccountList = async (params: any) => {
  try {
    const queryParams: UserListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at',
        update_time: 'updated_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        queryParams.order = `${mappedField} ${direction}`
      }
    }

    // 只有当 bot_id 有值时才添加参数
    if (params.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }

    // 只有当 query 有值时才添加 keyword 参数
    if (params.query && params.query.trim()) {
      queryParams.keyword = params.query.trim()
    }

    // 使用新接口 v1GetUserList
    const response = await v1GetUserList(queryParams)

    if (response.code === '000000' && response.data) {
      const mappedList = (response.data.list || []).map((item: any) => {
        // 从 botInfoMap 中获取机器人信息
        const botInfo = botInfoMap.value.get(item.bot_id)
        const botUserName = botInfo ? botInfo.user_name : ''
        const botFirstName = botInfo ? botInfo.first_name : ''

        return {
          id: item.id,
          tg_id: item.tg_user_id,
          nickname: item.tg_first_name,
          tg_name: item.tg_user_name,
          tg_bot_id: item.bot_id,
          bot_info: {
            tg_bot_id: item.bot_id,
            bot_name: botUserName,
            firstname: botFirstName
          },
          trx_mount: item.trx_balance,
          usdt_mount: item.usdt_balance,
          create_time: item.created_at,
          update_time: item.updated_at
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

// useSearchTable hooks 只保留searchTableRef
const { searchTableRef } = useSearchTable({
  searchSchema: searchSchema.value,
  tableColumns: columns,
  fetchDataApi: fetchAccountList,
  immediate: false // 由ready事件控制首次加载
})

const openBotList = (botId: number) => {
  router.push({
    path: '/bot_manage/bot_list',
    query: {
      tg_bot_id: botId
    }
  })
}

// 充值相关
const rechargeDialogVisible = ref(false)

const openRechargeDialog = (row: any) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
}

// 充值成功回调
const handleRechargeSuccess = () => {
  searchTableRef.value?.reload()
}

// 余额记录处理函数
const handleBalanceRecord = (accountIdValue: number | string) => {
  if (!accountIdValue) {
    ElMessage.warning('无法获取用户ID，无法查看余额记录')
    return
  }
  console.log(`Opening balance record for account ID: ${accountIdValue}`)
  currentAccountId.value = accountIdValue
  balanceRecordDialogVisible.value = true
}

// 发送消息相关
const openSendMessageDialog = (row: any) => {
  currentAccount.value = row
  messageDialogType.value = 'single'
  messageDialogVisible.value = true
}

// 打开群发消息弹窗
const openMassSendDialog = () => {
  messageDialogType.value = 'mass'
  messageDialogVisible.value = true
}

// 打开群发记录弹窗
const openMassSendRecordDialog = () => {
  massSendRecordDialogVisible.value = true
}

// 消息发送成功处理
const handleMessageSent = () => {
  messageDialogVisible.value = false
}

// 处理导出
const handleExport = async () => {
  try {
    // 获取当前搜索条件
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 构建查询参数
    const queryParams: any = {}
    if (params?.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }
    if (params?.query && params.query.trim()) {
      queryParams.keyword = params.query.trim()
    }

    // 使用获取列表的接口，传入搜索条件
    const res = await v1GetUserList(queryParams)

    if (res.code === '000000' && res.data && res.data.list) {
      // 将数据转换为 Excel 格式，字段与列表显示完全一致
      const list = res.data.list.map((item: any) => {
        const botInfo = botInfoMap.value.get(item.bot_id)
        return {
          TG用户ID: item.tg_user_id,
          TG用户昵称: item.tg_first_name,
          TG用户名: item.tg_user_name,
          机器人ID: item.bot_id,
          机器人用户名: botInfo ? botInfo.user_name : '',
          TRX余额: `${item.trx_balance || 0} TRX`,
          USDT余额: `${item.usdt_balance || 0} USDT`,
          创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
          更新时间: item.updated_at ? formatToDateTime(item.updated_at * 1000) : '-'
        }
      })

      // 导出为 Excel
      simpleExportToExcel(list, 'TG用户列表')
      handleSuccessMessage('用户列表导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '用户列表导出失败')
  }
}

// SearchTable ready事件处理
function onSearchTableReady(instance) {
  // 只在没有 query 参数时才自动加载
  const query = route.query
  if (!query.bot_id && !query.tg_id) {
    instance.reload()
  }
}

onMounted(async () => {
  await fetchBotList()
  const query = route.query
  // 只在options加载后做筛选，类型严格一致
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
