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
      <MassSendRecordDialog v-model="massSendRecordDialogVisible" :bot-list="botOptions" />
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
import { FormSchema } from '@/components/Form'
import type { TableColumn } from '@/components/Table'
import { v2GetUserList } from '@/api/agent/user_list'
import { getAgentBotListApi } from '@/api/agent/bot'
import { useRoute, useRouter } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
import MessageDialog from './components/MessageDialog.vue'
import MassSendRecordDialog from './components/MassSendRecordDialog.vue'

const route = useRoute()
const router = useRouter()

// 当前选中账户
const currentAccount = ref<any>({})

// 消息发送相关
const messageDialogVisible = ref(false)
const messageDialogType = ref<'single' | 'mass'>('single')
const messageDialogCustomTitle = ref('') // 自定义弹窗标题
const isSingleUserMode = ref(false) // 是否为单个用户模式
const massSendRecordDialogVisible = ref(false)

// 机器人下拉options，全部string类型
const isBotListLoaded = ref(false)
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])
const botMap = ref<Map<number, any>>(new Map()) // 机器人ID到机器人信息的映射

// 获取机器人列表（使用运营端的机器人列表接口）
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await getAgentBotListApi({
      current_page: 1,
      page_size: 1000
    })

    // 建立机器人映射
    const bots = (res.data.list || []).map((bot: any) => {
      // 存储到映射中
      botMap.value.set(bot.id, bot)

      return {
        label: `${bot.user_name} (${bot.first_name})`,
        value: String(bot.id)
      }
    })

    botOptions.value = [{ label: '全部', value: '' }, ...bots]
    isBotListLoaded.value = true

    console.log('[fetchBotList] 机器人列表加载成功, 数量:', bots.length)
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    isBotListLoaded.value = true
  }
}

// 为弹窗准备的机器人列表 (不包含"全部")
const botsForDialog = computed(() => {
  return botOptions.value.filter((option) => option.value !== '')
})

// 当前选择的来源
const selectedSource = ref<number | string>('')

// 表格字段
const columns = computed(() => {
  const allCols: TableColumn[] = [
    {
      field: 'tg_id',
      label: 'TG用户ID',
      width: 120,
      hideWhen: 2 // H5时隐藏
    },
    {
      field: 'nickname',
      label: 'TG用户昵称',
      hideWhen: 2 // H5时隐藏
    },
    {
      field: 'tg_name',
      label: 'TG用户名',
      type: 'link',
      url: (row) => `https://t.me/${row.tg_name}`,
      hideWhen: 2 // H5时隐藏
    },
    {
      field: 'username',
      label: '用户账号',
      formatter: (row) => row.username || '-',
      hideWhen: 1 // 机器人时隐藏
    },
    {
      field: 'email',
      label: '用户邮箱',
      hideWhen: 1 // 机器人时隐藏
    },
    {
      field: 'tg_bot_id',
      label: '机器人ID',
      slots: {
        default: ({ row }: any) => {
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
      field: 'user_name',
      label: '代理名称'
    },
    {
      field: 'source',
      label: '来源',
      width: 100,
      formatter: (row) => {
        // 根据用户账号是否存在判断来源
        // 有用户账号 → H5
        // 无用户账号（或为'-'） → 机器人
        if (row.username && row.username !== '-') {
          return 'H5'
        } else {
          return '机器人'
        }
      }
    },
    {
      field: 'trx_mount',
      label: 'TRX余额',
      sortable: 'custom',
      formatter: (row) => `${row.trx_mount || 0} TRX`
    },
    {
      field: 'usdt_mount',
      sortable: 'custom',
      label: 'USDT余额',
      hidden: true,
      formatter: (row) => `${row.usdt_mount || 0} USDT`
    },
    {
      field: 'create_time',
      label: '创建时间',
      width: 180,
      sortable: 'custom',
      formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
    },
    {
      field: 'update_time',
      label: '更新时间',
      width: 180,
      sortable: 'custom',
      formatter: (row) => (row.update_time ? formatToDateTime(row.update_time * 1000) : '-')
    },
    {
      field: 'action',
      label: '操作',
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          // 判断是否为机器人用户（有 tg_id 且不为空）
          const isBotUser = row.tg_id && row.tg_id !== 0

          return (
            <div>
              <BaseButton
                type="primary"
                disabled={!isBotUser}
                onClick={() => openSendMessageDialog(row)}
              >
                发送消息
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

  console.log(
    '[运营端用户列表 columns] 过滤后的列数:',
    filteredCols.length,
    '来源:',
    selectedSource.value
  )

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
    field: 'query',
    component: 'Input' as const,
    label: '关键词',
    componentProps: {
      placeholder: '请输入用户名/昵称/用户账号/用户邮箱'
    }
  },
  {
    field: 'source',
    component: 'Select' as const,
    label: '来源',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '机器人', value: 1 },
        { label: 'H5', value: 2 }
      ],
      placeholder: '请选择来源',
      valueKey: 'value',
      labelKey: 'label'
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker' as const,
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// API 封装 - 获取账户信息（用 operationView/Agent 的接口）
const fetchAccountList = async (params: any) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params?.source || ''
    console.log(
      '[fetchAccountList] selectedSource:',
      selectedSource.value,
      'params.source:',
      params?.source
    )

    // 映射参数字段
    const adaptedParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.query) adaptedParams.keyword = params.query // query → keyword
    if (params?.bot_id) adaptedParams.bot_id = Number(params.bot_id)
    if (params?.source !== undefined && params?.source !== '') {
      adaptedParams.origin = Number(params.source) // 直接传递数字值
    }

    // 处理排序参数 - 需要映射字段名
    if (params?.order) {
      // 字段名映射：前端 → 后端
      const fieldMap: Record<string, string> = {
        trx_mount: 'trx_balance', // TRX余额
        usdt_mount: 'usdt_balance', // USDT余额
        create_time: 'created_at', // 创建时间
        update_time: 'updated_at' // 更新时间
      }

      // 解析排序参数，格式：'field_name ASC' 或 'field_name DESC'
      const [field, direction] = params.order.split(' ')
      const mappedField = fieldMap[field] || field
      adaptedParams.order = `${mappedField} ${direction}`
    }

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      adaptedParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('[fetchAccountList] 调用新接口 v2GetUserList, 参数:', adaptedParams)

    // 使用新接口 v2GetUserList
    const response = await v2GetUserList(adaptedParams)

    // 映射返回数据字段
    const list = (response.data?.list || []).map((item: any) => {
      // 从机器人映射中获取机器人信息
      const botInfo = botMap.value.get(item.bot_id)

      return {
        id: item.id,
        tg_id: item.tg_user_id, // tg_user_id → tg_id
        tg_bot_id: item.bot_id, // bot_id → tg_bot_id
        nickname: item.tg_first_name, // tg_first_name → nickname
        tg_name: item.tg_user_name, // tg_user_name → tg_name
        username: item.username || '-', // 用户账号（使用 username 字段）
        email: item.email || '-', // 用户邮箱
        trx_mount: item.trx_balance, // trx_balance → trx_mount
        usdt_mount: item.usdt_balance, // usdt_balance → usdt_mount
        source: item.origin, // 保留原始 origin 值（1=机器人，2=H5）
        create_time: item.created_at, // created_at（秒）→ create_time（秒，formatter中会转毫秒）
        update_time: item.updated_at, // updated_at（秒）→ update_time（秒，formatter中会转毫秒）
        bot_info: {
          tg_bot_id: item.bot_id,
          bot_name: botInfo?.user_name || '' // 从机器人映射中获取机器人用户名
        },
        user_name: botInfo?.agent_name || '' // 从机器人映射中获取代理名称
      }
    })

    console.log('[fetchAccountList] 返回数据:', {
      total: response.data?.pager?.total,
      count: list.length
    })

    // 添加数据为空提示
    const hasSearchCondition = !!(
      params?.query ||
      params?.bot_id ||
      params?.dateRange ||
      params?.source
    )
    handleListMessage(list, hasSearchCondition, '用户')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return { list: [], total: 0 }
  }
}

const searchTableRef = ref()

const openBotList = (botId: number) => {
  router.push({
    path: '/agent/bot_list',
    query: {
      bot_id: botId
    }
  })
}

function onSearchTableReady(instance: any) {
  instance.reload()
}

// 发送消息相关
const openSendMessageDialog = (row: any) => {
  currentAccount.value = {
    ...row,
    bot_id: row.tg_bot_id, // 使用 tg_bot_id 作为 bot_id
    tg_user_id: row.tg_id // 使用 tg_id 作为 tg_user_id
  }
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
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 构建导出参数，只包含搜索条件，不包含分页信息
    const exportParams: any = {}

    if (params?.query) exportParams.keyword = params.query
    if (params?.bot_id) exportParams.bot_id = Number(params.bot_id)
    if (params?.source !== undefined && params?.source !== '') {
      exportParams.origin = Number(params.source) // 直接传递数字值
    }

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      exportParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('导出参数:', exportParams)

    // 使用获取列表的接口进行导出
    const res = await v2GetUserList(exportParams)

    if (res.code === '000000' && res.data) {
      const list = (res.data.list || []).map((item: any) => {
        const botInfo = botMap.value.get(item.bot_id)
        return {
          TG用户ID: item.tg_user_id,
          TG用户昵称: item.tg_first_name,
          TG用户名: item.tg_user_name,
          用户账号: item.username || '-',
          用户邮箱: item.email || '-',
          机器人ID: item.bot_id,
          机器人用户名: botInfo?.user_name || '',
          代理名称: botInfo?.agent_name || '',
          来源: item.username && item.username !== '-' ? 'H5' : '机器人', // 根据用户账号判断
          TRX余额: `${item.trx_balance || 0} TRX`,
          创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
          更新时间: item.updated_at ? formatToDateTime(item.updated_at * 1000) : '-'
        }
      })

      // 导出为 Excel
      simpleExportToExcel(list, '机器人用户列表')
      handleSuccessMessage('用户列表导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '用户列表导出失败')
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
