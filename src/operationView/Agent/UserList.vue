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
        <!-- 可按需添加自定义按钮 -->
      </SearchTable>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElMessage, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { FormSchema } from '@/components/Form'
import type { TableColumn } from '@/components/Table'
import { getUserListApi } from '@/api/agent/user_list'
import { getAgentBotListApi } from '@/api/agent/bot'
import { useRoute, useRouter } from 'vue-router'
import { nextTick } from 'vue'

const route = useRoute()
const router = useRouter()

// 机器人下拉options，全部string类型
const isBotListLoaded = ref(false)
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])

// 获取机器人列表（用 operationView/Agent 的接口）
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await getAgentBotListApi({})
    const bots = (res.data.list || []).map((bot: any) => ({
      label: `${bot.name} (${bot.firstname})`,
      value: String(bot.id)
    }))
    botOptions.value = [{ label: '全部', value: '' }, ...bots]
    isBotListLoaded.value = true
  } catch (error) {
    console.error('获取机器人列表失败:', error)
  }
}

// 表格字段
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
    componentProps: {
      placeholder: '请输入用户名/昵称'
    }
  }
])

// API 封装 - 获取账户信息（用 operationView/Agent 的接口）
const fetchAccountList = async (params: any) => {
  try {
    const response = await getUserListApi(params)
    return response.data
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

function onSearchTableReady(instance) {
  instance.reload()
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
