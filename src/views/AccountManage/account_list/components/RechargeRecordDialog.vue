<template>
  <Dialog v-model="dialogVisible" title="账户充值记录" :width="width">
    <div class="mb-4">
      <h3 class="text-lg font-bold">{{
        accountName ? `账户：${accountName}` : `账户ID：${props.accountId}`
      }}</h3>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="{
        total: total
      }"
      @register="tableRegister"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, computed, watch, unref } from 'vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Table, TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { v1GetBillList } from '@/api/account'
import { useTable } from '@/hooks/web/useTable'

const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  },
  width: {
    type: String,
    default: '900px'
  }
})

const dialogVisible = ref(false)
const accountName = ref('') // 从父组件传入的账户名

const { tableRegister, tableState, tableMethods } = useTable({
  immediate: false,
  fetchDataApi: async () => {
    if (!props.accountId) {
      ElMessage.warning('账户ID不能为空')
      return { list: [], total: 0 }
    }
    try {
      const params = {
        current_page: currentPage.value,
        page_size: pageSize.value,
        kinds: [1, 2], // 1-代理充值, 2-用户充值
        agent_id: props.accountId
      }
      const res = await v1GetBillList(params)

      // 从第一条记录获取账户名称（如果父组件没有传入）
      if (res.data?.list && res.data.list.length > 0 && !accountName.value) {
        const firstRecord = res.data.list[0]
        // 使用 agent_name 字段（如果有值）
        accountName.value = firstRecord.agent_name || ''
      }

      // 映射字段：新接口 → 旧字段格式
      const mappedList = (res.data?.list || []).map((item) => ({
        user_id: item.agent_id,
        username: item.agent_name || accountName.value, // 如果 agent_name 为空，使用传入的 accountName
        account_name: item.agent_name || accountName.value,
        after_amount: item.balance,
        amount: item.amount,
        unit: item.coin,
        create_time: item.created_at * 1000, // 秒转毫秒
        describe: item.describe
      }))

      const total = res.data?.pager?.total || 0

      // 成功提示
      if (mappedList.length === 0) {
        ElMessage.info('暂无充值记录')
      }

      return {
        list: mappedList,
        total: total
      }
    } catch (error) {
      console.error('获取充值记录失败:', error)
      ElMessage.error('获取充值记录失败，请稍后重试')
      return { list: [], total: 0 }
    }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const columns: TableColumn[] = [
  {
    field: 'user_id',
    label: '账户ID',
    minWidth: 100
  },
  {
    field: 'username',
    label: '账户名',
    minWidth: 150
  },
  {
    field: 'after_amount',
    label: 'TRX余额',
    minWidth: 120,
    formatter: (row) => `${row.after_amount} TRX`
  },
  {
    field: 'amount',
    label: '充值金额',
    minWidth: 120,
    formatter: (row) => `+${row.amount} TRX`
  },
  {
    field: 'create_time',
    label: '完成时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    minWidth: 160
  }
]

const open = (id: number, name?: string) => {
  const currentPropAccountId = props.accountId

  // 设置账户名
  if (name) {
    accountName.value = name
  }

  dialogVisible.value = true

  if (id !== currentPropAccountId) {
    if (!name) {
      accountName.value = ''
    }
    currentPage.value = 1
  } else {
    const needsRefresh = unref(dataList).length === 0
    if (needsRefresh) {
      if (currentPage.value !== 1) {
        currentPage.value = 1
      } else {
        tableMethods.getList()
      }
    }
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
