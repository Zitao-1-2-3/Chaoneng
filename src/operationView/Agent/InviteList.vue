<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotListLoaded"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchInviteList"
        :show-add-button="false"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :search-props="{
          layout: 'inline',
          buttonPosition: 'center'
        }"
        ref="searchTableRef"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { type InviteRecordItem } from '@/api/agent/invite'
import { getAgentBotListApi } from '@/api/agent/bot'
import { handleErrorMessage } from '@/utils/messageHelper'

const searchTableRef = ref()

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

const columns = ref<TableColumn[]>([
  {
    field: 'invitee_id',
    label: '受邀人ID',
    minWidth: '140px',
    formatter: (row: InviteRecordItem) => row.invitee_id || '-'
  },
  {
    field: 'invitee_name',
    label: '受邀人',
    minWidth: '140px',
    formatter: (row: InviteRecordItem) => row.invitee_name || '-'
  },
  {
    field: 'promo_bot_name',
    label: '推广机器人用户名',
    minWidth: '160px',
    formatter: (row: InviteRecordItem) => row.promo_bot_name || '-'
  },
  {
    field: 'inviter_name',
    label: '邀请人',
    minWidth: '140px',
    formatter: (row: InviteRecordItem) => row.inviter_name || '-'
  },
  {
    field: 'agent_name',
    label: '代理名称',
    minWidth: '160px',
    formatter: (row: InviteRecordItem) => row.agent_name || '-'
  },
  {
    field: 'promo_link',
    label: '推广链接',
    minWidth: '240px',
    showOverflowTooltip: true,
    formatter: (row: InviteRecordItem) => row.promo_link || '-'
  },
  {
    field: 'reward_amount',
    label: '奖励金额',
    minWidth: '120px',
    formatter: (row: InviteRecordItem) => {
      const amount = row.reward_amount
      return amount === undefined || amount === null ? '-' : `${amount} TRX`
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    minWidth: '170px',
    sortable: 'custom',
    formatter: (row: InviteRecordItem) =>
      row.created_at ? formatToDateTime(new Date(row.created_at * 1000)) : '-'
  }
])

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
    component: 'Input',
    label: {
      text: '关键字',
      tips: '受邀人ID/受邀人/邀请人/代理名称/机器人用户名'
    },
    componentProps: {
      placeholder: '请输入关键字',
      clearable: true
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker',
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// 模拟数据生成
const generateMockData = (count: number): InviteRecordItem[] => {
  const list: InviteRecordItem[] = []
  const now = Math.floor(Date.now() / 1000)

  for (let i = 0; i < count; i++) {
    list.push({
      id: `INV${String(1000 + i).padStart(6, '0')}`,
      invitee_id: `U${String(20000 + i)}`,
      invitee_name: `新用户${i + 1}`,
      promo_bot_name: `promo_bot_${(i % 3) + 1}`,
      inviter_name: `用户${i + 1}`,
      agent_name: `代理${(i % 5) + 1}`,
      promo_link: `https://t.me/promo_bot_${(i % 3) + 1}?start=invite${1000 + i}`,
      reward_amount: Math.floor(Math.random() * 100) + 10,
      created_at: now - i * 3600
    })
  }

  return list
}

const mockAllData = generateMockData(56)

// 获取邀请列表（当前使用模拟数据）
const fetchInviteList = async (params: any = {}) => {
  const page = params.current_page || 1
  const pageSize = params.page_size || 10

  // 模拟异步请求
  await new Promise((resolve) => setTimeout(resolve, 300))

  // 模拟搜索过滤
  let filtered = [...mockAllData]

  // 关键字搜索
  if (params.keyword) {
    const kw = String(params.keyword).toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.invitee_id.toLowerCase().includes(kw) ||
        item.invitee_name.toLowerCase().includes(kw) ||
        item.inviter_name.toLowerCase().includes(kw) ||
        item.agent_name.toLowerCase().includes(kw) ||
        item.promo_bot_name.toLowerCase().includes(kw)
    )
  }

  // 机器人筛选（模拟数据暂不支持，但保留参数处理）
  if (params.bot_id) {
    // TODO: 等接入真实接口后，这里会根据bot_id筛选
    console.log('机器人筛选:', params.bot_id)
  }

  // 时间范围筛选
  if (params.dateRange && params.dateRange.length === 2) {
    const start = Math.floor(Number(params.dateRange[0]) / 1000)
    const end = Math.floor(Number(params.dateRange[1]) / 1000)
    filtered = filtered.filter((item) => item.created_at >= start && item.created_at <= end)
  }

  // 分页
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)

  return {
    list,
    total
  }
}

// ==================== 真实接口调用（暂时注释） ====================
// const fetchInviteList = async (params: any = {}) => {
//   try {
//     const apiParams: any = {
//       current_page: params?.current_page || 1,
//       page_size: params?.page_size || 10
//     }

//     if (params?.keyword) apiParams.keyword = params.keyword
//     if (params?.bot_id) apiParams.bot_id = Number(params.bot_id)

//     // 处理排序参数
//     if (params?.order) {
//       apiParams.order = params.order
//     }

//     // 处理时间范围 - 转换为 Unix 时间戳（秒级）
//     if (params?.dateRange && params.dateRange.length === 2) {
//       apiParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
//       apiParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
//     }

//     const response = await getInviteListApi(apiParams)

//     const list = response.data?.list || []
//     const total = response.data?.pager?.total || response.data?.total || 0

//     // 添加数据为空提示
//     const hasSearchCondition = !!(params?.keyword || params?.bot_id || params?.dateRange)
//     handleListMessage(list, hasSearchCondition, '邀请记录')

//     return {
//       list,
//       total
//     }
//   } catch (error) {
//     handleErrorMessage(error, '获取邀请列表失败')
//     return { list: [], total: 0 }
//   }
// }

// 页面加载时获取机器人列表
onMounted(async () => {
  await fetchBotList()
})
</script>
