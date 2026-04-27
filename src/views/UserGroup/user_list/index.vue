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
        :custom-title="messageDialogCustomTitle"
        :is-single-user="isSingleUserMode"
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
import MassSendRecordDialog from './components/MassSendRecordDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import RechargeDialog from './components/RechargeDialog.vue'
import BalanceRecordDialog from './components/BalanceRecordDialog.vue'
import ChangePasswordDialog from './components/ChangePasswordDialog.vue'
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
const messageDialogCustomTitle = ref('') // 自定义弹窗标题
const isSingleUserMode = ref(false) // 是否为单个用户模式
const massSendRecordDialogVisible = ref(false)

// 新增：余额记录弹窗可见状态
const balanceRecordDialogVisible = ref(false)

// 修改密码弹窗可见状态
const changePasswordDialogVisible = ref(false)

// 当前选择的来源
const selectedSource = ref<number | string>('')

// 表格列配置
const columns = computed(() => {
  const allCols: TableColumn[] = [
    {
      field: 'tg_user_id',
      label: 'TG用户ID',
      width: 120,
      hideWhen: 2, // H5时隐藏
      formatter: (row) => (row.tg_user_id === 0 || !row.tg_user_id ? '-' : row.tg_user_id)
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_first_name || '-'
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      hideWhen: 2, // H5时隐藏
      formatter: (row) => row.tg_user_name || '-'
    },
    {
      field: 'username',
      label: '用户账号',
      width: 150,
      hideWhen: 1, // 机器人时隐藏
      formatter: (row) => row.username || '-'
    },
    {
      field: 'email',
      label: '用户邮箱',
      width: 180,
      hideWhen: 1, // 机器人时隐藏
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
      field: 'source',
      label: '来源',
      width: 100,
      formatter: (row) => {
        // 根据 tg_user_id 判断来源
        return row.tg_user_id === 0 ? 'H5' : '机器人'
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
          // 判断是否为H5用户（tg_user_id 为 0 或不存在）
          const isH5User = !row.tg_user_id || row.tg_user_id === 0
          // 判断是否为机器人用户（tg_user_id 存在且不为 0）
          const isBotUser = row.tg_user_id && row.tg_user_id !== 0

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

  // 根据来源过滤列
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
    field: 'query',
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

// API 封装 - 获取账户信息
const fetchAccountList = async (params: any) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params.origin || ''

    const queryParams: UserListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        // 前端显示字段 -> API字段（已经使用API原始字段，无需映射）
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

    // 只有当 origin 有值时才添加参数
    if (params.origin !== undefined && params.origin !== '') {
      queryParams.origin = Number(params.origin)
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

        return {
          ...item, // 保留所有原始字段
          // 补充机器人信息
          bot_user_name: botInfo?.user_name || '',
          bot_first_name: botInfo?.first_name || ''
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
  tableColumns: columns.value,
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

// 修改密码处理函数
const handleChangePassword = (row: any) => {
  currentAccount.value = row
  changePasswordDialogVisible.value = true
}

// 修改密码成功回调
const handlePasswordChangeSuccess = () => {
  searchTableRef.value?.reload()
}

// 发送消息相关
const openSendMessageDialog = (row: any) => {
  currentAccount.value = row
  // 统一使用群发消息布局（包含机器人选择、接受用户类型、上传图片等字段）
  messageDialogType.value = 'mass'
  messageDialogCustomTitle.value = '发送消息' // 设置自定义标题为"发送消息"
  isSingleUserMode.value = true // 设置为单个用户模式（机器人信息只读）
  messageDialogVisible.value = true
}

// 打开群发消息弹窗
const openMassSendDialog = () => {
  messageDialogType.value = 'mass'
  messageDialogCustomTitle.value = '发送消息'
  isSingleUserMode.value = false // 设置为群发模式（机器人可选择）
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
        // 判断来源：tg_user_id === 0 为 H5，否则为机器人
        const source = item.tg_user_id === 0 ? 'H5' : '机器人'
        return {
          TG用户ID: item.tg_user_id,
          TG用户昵称: item.tg_first_name,
          TG用户名: item.tg_user_name,
          用户账号: item.username || '-',
          用户邮箱: item.email || '-',
          机器人ID: item.bot_id,
          机器人用户名: botInfo ? botInfo.user_name : '',
          来源: source,
          TRX余额: `${item.trx_balance || 0} TRX`,
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
function onSearchTableReady(instance: any) {
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
