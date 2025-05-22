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
import { ref, onMounted, h, computed, reactive } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElButton, ElTag, ElMessage, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form, FormSchema } from '@/components/Form'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { getTgUserListApi, sendMessageToUserApi, getUserBalanceRecordsApi } from '@/api/tgUser'
import { getBotListApi } from '@/api/botlist'
import { useValidator } from '@/hooks/web/useValidator'
import { useClipboard } from '@/hooks/web/useClipboard'
import MessageDialog from './components/MessageDialog.vue'
import MassSendRecordDialog from './components/MassSendRecordDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import RechargeDialog from './components/RechargeDialog.vue'
import BalanceRecordDialog from './components/BalanceRecordDialog.vue'
import { useSearchTable } from '@/hooks/web/useSearchTable'

const router = useRouter()
// 表单校验
const { required } = useValidator()

const massSendRecordDialogRef = ref<InstanceType<typeof MassSendRecordDialog> | null>(null)

// State for conditional rendering
const isBotListLoaded = ref(false)

// 机器人列表
const botOptions = ref<{ label: string; value: number | string }[]>([{ label: '全部', value: '' }])

// 获取机器人列表
const fetchBotList = async () => {
  isBotListLoaded.value = false // Reset before fetching if needed
  try {
    const res = await getBotListApi({})
    const bots = (res.data.list || []).map((bot: any) => ({
      label: `${bot.name} (${bot.firstname})`,
      value: bot.id
    }))
    botOptions.value = [{ label: '全部', value: '' }, ...bots]
    isBotListLoaded.value = true // Set to true after successful fetch
  } catch (error) {
    console.error('获取机器人列表失败:', error)
  }
}

// 为弹窗准备的机器人列表 (不包含"全部")
const botsForDialog = computed(() => {
  return botOptions.value.filter((option) => option.value !== '')
})

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
    formatter: (row) => `${row.usdt_mount || 0} USDT`
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'update_time',
    label: '更新时间',
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

// 搜索表单配置 - computed is fine now
const searchSchema = computed<FormSchema[]>(() => {
  return [
    {
      field: 'bot_id',
      component: 'Select' as const,
      label: '机器人',
      componentProps: {
        options: botOptions.value,
        placeholder: '请选择机器人'
      }
    },
    {
      field: 'tg_id',
      component: 'Input' as const,
      label: 'TG用户ID',
      componentProps: {
        placeholder: '请输入TG用户ID'
      }
    }
  ]
})

// API 封装 - 获取账户信息
const fetchAccountList = async (params: any) => {
  try {
    const response = await getTgUserListApi(params)
    return response.data
  } catch (error) {
    console.error('获取TG用户列表失败:', error)
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
  // ElMessage.success('充值成功') // 这条消息可以在 RechargeDialog 内部处理，父组件刷新即可
  // 刷新表格数据
  searchTableRef.value?.reload()
}

// 修改：余额记录处理函数
const handleBalanceRecord = (accountIdValue: number | string) => {
  if (!accountIdValue) {
    ElMessage.warning('无法获取用户ID，无法查看余额记录')
    return
  }
  console.log(`Opening balance record for account ID: ${accountIdValue}`) // 添加日志
  currentAccountId.value = accountIdValue // 设置当前要查询的账户 ID
  balanceRecordDialogVisible.value = true // 打开余额记录弹窗
  // 移除旧的 ElMessage.info
  // ElMessage.info('打开余额记录，需要实现相关组件')
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

// SearchTable ready事件处理
function onSearchTableReady(instance) {
  const query = useRoute().query
  if (query.tg_id) {
    instance.setSearchParams({ tg_id: query.tg_id })
  }
  instance.reload()
}

onMounted(() => {
  // 获取机器人列表
  fetchBotList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
