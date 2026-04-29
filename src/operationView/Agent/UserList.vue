<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotListLoaded"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchUserList"
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
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>

      <!-- 发送消息弹窗 -->
      <MessageDialog
        v-model="messageDialogVisible"
        type="mass"
        :user="currentUser"
        :bot-list="botsForDialog"
        custom-title="发送消息"
        :is-single-user="true"
        @success="handleMessageSent"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElLink } from 'element-plus'
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

const route = useRoute()
const router = useRouter()

// 当前选中用户
const currentUser = ref<any>({})

// 消息发送相关
const messageDialogVisible = ref(false)

// 机器人列表
const isBotListLoaded = ref(false)
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])
const botMap = ref<Map<number, any>>(new Map())

// 获取机器人列表
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await getAgentBotListApi({
      current_page: 1,
      page_size: 1000
    })

    const bots = (res.data.list || []).map((bot: any) => {
      botMap.value.set(bot.id, bot)
      return {
        label: `${bot.user_name} (${bot.first_name})`,
        value: String(bot.id)
      }
    })

    botOptions.value = [{ label: '全部', value: '' }, ...bots]
    isBotListLoaded.value = true
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
      field: 'tg_user_id',
      label: 'TG用户ID',
      width: 120,
      formatter: (row) => (row.tg_user_id && row.tg_user_id !== 0 ? row.tg_user_id : '-'),
      hideWhen: 2
    },
    {
      field: 'tg_first_name',
      label: 'TG用户昵称',
      formatter: (row) => row.tg_first_name || '-',
      hideWhen: 2
    },
    {
      field: 'tg_user_name',
      label: 'TG用户名',
      slots: {
        default: ({ row }: any) => {
          if (!row.tg_user_name) return <span>-</span>
          return (
            <ElLink type="primary" href={`https://t.me/${row.tg_user_name}`} target="_blank">
              {row.tg_user_name}
            </ElLink>
          )
        }
      },
      hideWhen: 2
    },
    {
      field: 'account',
      label: '用户账号',
      formatter: (row) => row.account || '-',
      hideWhen: 1
    },
    {
      field: 'email',
      label: '用户邮箱',
      formatter: (row) => row.email || '-',
      hideWhen: 1
    },
    {
      field: 'bot_id',
      label: '机器人ID',
      slots: {
        default: ({ row }: any) => {
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
      label: '机器人用户名',
      formatter: (row) => row.bot_user_name || '-'
    },
    {
      field: 'agent_name',
      label: '代理名称',
      formatter: (row) => row.agent_name || '-'
    },
    {
      field: 'origin',
      label: '来源',
      width: 100,
      formatter: (row) => {
        // 根据 tg_user_name 是否存在判断来源
        // 有 tg_user_name → 机器人
        // 无 tg_user_name → H5
        return row.tg_user_name ? '机器人' : 'H5'
      }
    },
    {
      field: 'trx_balance',
      label: 'TRX余额',
      sortable: 'custom',
      formatter: (row) => `${row.trx_balance || 0} TRX`
    },
    {
      field: 'usdt_balance',
      sortable: 'custom',
      label: 'USDT余额',
      hidden: true,
      formatter: (row) => `${row.usdt_balance || 0} USDT`
    },
    {
      field: 'created_at',
      label: '创建时间',
      width: 180,
      sortable: 'custom',
      formatter: (row) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
    },
    {
      field: 'updated_at',
      label: '更新时间',
      width: 180,
      sortable: 'custom',
      formatter: (row) => (row.updated_at ? formatToDateTime(row.updated_at * 1000) : '-')
    },
    {
      field: 'action',
      label: '操作',
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          // 判断是否为机器人用户（有 tg_user_name 且不为空）
          const isBotUser = row.tg_user_name && row.tg_user_name.trim() !== ''
          return (
            <BaseButton
              type="primary"
              disabled={!isBotUser}
              onClick={() => openSendMessageDialog(row)}
            >
              发送消息
            </BaseButton>
          )
        }
      }
    }
  ]

  // 根据来源过滤列
  return allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource.value !== col.hideWhen
  })
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
    field: 'keyword',
    component: 'Input' as const,
    label: '关键词',
    componentProps: {
      placeholder: '请输入用户名/昵称/用户账号/用户邮箱'
    }
  },
  {
    field: 'origin',
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

// 获取用户列表
const fetchUserList = async (params: any) => {
  try {
    selectedSource.value = params?.origin || ''

    const apiParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.keyword) apiParams.keyword = params.keyword
    if (params?.bot_id) apiParams.bot_id = Number(params.bot_id)
    if (params?.origin !== undefined && params?.origin !== '') {
      apiParams.origin = Number(params.origin)
    }

    // 处理排序参数
    if (params?.order) {
      apiParams.order = params.order
    }

    // 处理时间范围
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      apiParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    const response = await v2GetUserList(apiParams)

    // 直接使用后端返回的数据，添加机器人信息
    const list = (response.data?.list || []).map((item: any) => {
      const botInfo = botMap.value.get(item.bot_id)
      return {
        ...item,
        bot_user_name: botInfo?.user_name || '',
        agent_name: botInfo?.agent_name || ''
      }
    })

    const hasSearchCondition = !!(
      params?.keyword ||
      params?.bot_id ||
      params?.dateRange ||
      params?.origin
    )
    handleListMessage(list, hasSearchCondition, '用户')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取用户列表失败')
    return { list: [], total: 0 }
  }
}

const searchTableRef = ref()

const openBotList = (botId: number) => {
  router.push({
    path: '/agent/bot_list',
    query: { bot_id: botId }
  })
}

function onSearchTableReady(instance: any) {
  instance.reload()
}

// 发送消息
const openSendMessageDialog = (row: any) => {
  currentUser.value = row
  messageDialogVisible.value = true
}

// 消息发送成功
const handleMessageSent = () => {
  messageDialogVisible.value = false
}

// 导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()

    const exportParams: any = {}

    if (params?.keyword) exportParams.keyword = params.keyword
    if (params?.bot_id) exportParams.bot_id = Number(params.bot_id)
    if (params?.origin !== undefined && params?.origin !== '') {
      exportParams.origin = Number(params.origin)
    }

    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      exportParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    const res = await v2GetUserList(exportParams)

    if (res.code === '000000' && res.data) {
      const list = (res.data.list || []).map((item: any) => {
        const botInfo = botMap.value.get(item.bot_id)
        return {
          TG用户ID: item.tg_user_id && item.tg_user_id !== 0 ? item.tg_user_id : '-',
          TG用户昵称: item.tg_first_name || '-',
          TG用户名: item.tg_user_name || '-',
          用户账号: item.account || '-',
          用户邮箱: item.email || '-',
          机器人ID: item.bot_id,
          机器人用户名: botInfo?.user_name || '-',
          代理名称: botInfo?.agent_name || '-',
          来源: item.tg_user_name ? '机器人' : 'H5',
          TRX余额: `${item.trx_balance || 0} TRX`,
          创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
          更新时间: item.updated_at ? formatToDateTime(item.updated_at * 1000) : '-'
        }
      })

      simpleExportToExcel(list, '机器人用户列表')
      handleSuccessMessage('用户列表导出成功')
    } else {
      handleErrorMessage(res, '导出失败')
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
  }
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
