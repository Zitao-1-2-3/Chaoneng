<template>
  <Dialog v-model="dialogVisible" title="账户扣款记录" width="80%">
    <div class="mb-4">
      <h3 class="text-lg font-bold">{{
        accountName ? `账户：${accountName}` : `账户ID：${props.accountId}`
      }}</h3>
    </div>

    <SearchTable
      :columns="columns"
      :search-schema="searchSchema"
      :fetch-data-api="getList"
      ref="searchTableRef"
      @search="onSearch"
      :show-add-button="false"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, onMounted } from 'vue'
import { ElButton, ElTag, ElMessage, ElLink } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBalanceRecordApi } from '@/api/account'
import type { TableColumn } from '@/components/Table'
import isEmpty from 'lodash-es/isEmpty'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  }
})

const orderTypeMap = () => {
  return {
    2: '托管',
    3: '兑换',
    4: '按笔数',
    5: '按时间',
    6: '批量下单',
    7: '闪租',
    8: '激活',
    9: '机器人续费',
    10: '后台手动变更',
    20: '福利订单',
    22: '接口调用-按笔数'
  }
}

// 账户信息
const accountName = ref('')
const dialogVisible = ref(false)
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_num',
    label: '关联订单ID',
    minWidth: 120,
    formatter: (row) => (isEmpty(row.order_num) ? '-' : row.order_num),
    slots: {
      default: ({ row }: any) => {
        let href = '/order_manage'
        switch (row.order_type) {
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
            href = `${href}/energy_order`

            break
          case 3:
            href = `${href}/exchange_order`
            break
          case 2:
            href = `${href}/hosted_order`
            break
          case 1:
            href = `${href}/recharge_order`
            break
          default:
            href = ''
        }
        return (
          <>
            <ElLink
              type="primary"
              onClick={() => router.push({ path: href, query: { order_num: row.order_num } })}
            >
              {row.order_num}
            </ElLink>
          </>
        )
      }
    }
  },
  {
    field: 'order_type',
    label: '交易类型',
    minWidth: 120,
    formatter: (row) => {
      return orderTypeMap()[row.order_type]
    }
  },
  {
    field: 'bot_name',
    label: '所属机器人',
    minWidth: 120
  },
  {
    field: 'amount',
    label: '交易金额',
    minWidth: 120,
    formatter: (row) => `${row.amount}${row.unit}`
  },
  {
    field: 'after_trx',
    label: '交易后TRX',
    minWidth: 120,
    formatter: (row) => `${row.after_amount}`
  },
  {
    field: 'create_time',
    label: '交易时间',
    minWidth: 160,
    formatter: (row) => formatToDateTime(row.create_time)
  },
  {
    field: 'describe',
    label: '备注',
    minWidth: 120,
    formatter: (row) => (isEmpty(row.describe) ? '-' : row.describe)
  }
]

// 搜索表单配置，添加订单号查询
const searchSchema = [
  {
    field: 'order_type',
    component: 'Select' as const,
    label: '交易类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        ...Object.entries(orderTypeMap()).map(([key, value]) => ({
          label: value,
          value: key
        }))
      ],
      placeholder: '请选择交易类型'
    }
  },
  {
    field: 'id',
    component: 'Input' as const,
    label: '订单号',
    componentProps: {
      placeholder: '请输入交易ID'
    }
  },
  {
    field: 'time_range',
    component: 'DatePicker' as const,
    label: '日期',
    componentProps: {
      type: 'daterange',
      valueFormat: 'x',
      clearable: true,
      placeholder: ['开始日期', '结束日期'],
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
]

// 获取扣款记录数据
const getList = async (params: any = {}) => {
  try {
    // 调用通用API但使用/out路径表示扣款记录
    const res = await getBalanceRecordApi({
      ...params,
      change_type: 'out',
      accountId: props.accountId
    })

    if (res && res.data) {
      // 如果有记录且没有保存账户名，就从第一条记录获取
      if (res.data.list && res.data.list.length > 0 && !accountName.value) {
        // 假设记录中包含账户名字段，实际情况可能需要调整
        // accountName.value = res.data.list[0].account_name
      }

      return res.data
    }

    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取扣款记录失败:', error)
    ElMessage.error('获取扣款记录失败')
    return { list: [], total: 0 }
  }
}

// 处理搜索
const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

// 打开弹窗
const open = (accountId: number, name: string = '') => {
  dialogVisible.value = true
  accountName.value = name

  // 重新加载列表
  setTimeout(() => {
    searchTableRef.value?.reload()
  }, 100)
}

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
