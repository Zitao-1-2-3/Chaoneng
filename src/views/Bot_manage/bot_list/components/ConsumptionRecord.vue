<template>
  <Dialog v-model="dialogVisible" title="消费记录">
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="{
        total: total
      }"
    />
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Table } from '@/components/Table'
import { v1GetAgentBillList } from '@/api/botlist'
import { formatToDateTime } from '@/utils/dateUtil'

interface ConsumptionRecord {
  order_id: string
  created_at: number
  kind: number
  agent_id: number
  bot_id: number
  amount: string
  balance: string
  coin: string
  profit: string
  describe: string
  agent_name: string
  bot_name: string
}

const dialogVisible = ref(false)
const loading = ref(false)
const dataList = ref<ConsumptionRecord[]>([])
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)

const columns = [
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 150
  },
  {
    field: 'bot_name',
    label: '机器人昵称',
    width: 180,
    formatter: (row: ConsumptionRecord) => row.bot_name || '-'
  },
  {
    field: 'amount',
    label: '费用',
    width: 150,
    slots: {
      default: ({ row }: { row: ConsumptionRecord }) => (
        <span style={{ color: 'red' }}>
          {row.amount} {row.coin}
        </span>
      )
    }
  },
  {
    field: 'balance',
    label: '余额',
    width: 150,
    slots: {
      default: ({ row }: { row: ConsumptionRecord }) => (
        <span>
          {row.balance} {row.coin}
        </span>
      )
    }
  },
  {
    field: 'describe',
    label: '描述',
    minWidth: 150,
    formatter: (row: ConsumptionRecord) => row.describe || '-'
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    formatter: (row: ConsumptionRecord) =>
      row.created_at ? formatToDateTime(row.created_at * 1000) : '-'
  }
]

const getList = async () => {
  loading.value = true
  try {
    const res = await v1GetAgentBillList({
      current_page: currentPage.value,
      page_size: pageSize.value,
      kinds: [11]
    })

    if (res.code === '000000' && res.data) {
      dataList.value = res.data.list || []
      total.value = res.data.pager?.total || 0
    }
  } catch (error) {
    console.error('获取消费记录失败:', error)
  } finally {
    loading.value = false
  }
}

watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    getList()
  }
})

watch(pageSize, (newPageSize, oldPageSize) => {
  if (newPageSize !== oldPageSize) {
    if (currentPage.value !== 1) {
      currentPage.value = 1
    } else {
      getList()
    }
  }
})

const open = () => {
  currentPage.value = 1
  pageSize.value = 10
  dialogVisible.value = true
  dataList.value = []
  total.value = 0
  getList()
}

defineExpose({
  open
})
</script>
