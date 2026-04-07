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
import { ref } from 'vue'
import { ElButton, ElMessage, ElLink } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { formatToDateTime } from '@/utils/dateUtil'
import { v1GetBillList } from '@/api/account'
import type { TableColumn } from '@/components/Table'
import isEmpty from 'lodash-es/isEmpty'
import { useRouter } from 'vue-router'
import { handleListMessage, handleErrorMessage } from '@/utils/messageHelper'

const router = useRouter()
const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  }
})

// 交易类型映射：kind → 显示名称
const orderTypeMap = () => {
  return {
    3: '兑换',
    4: '按时间',
    5: '按笔数',
    6: '福利能量',
    7: '快速能量',
    8: '自动托管',
    9: '批量能量',
    10: '批量激活',
    11: '机器人付费'
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
        // 根据 kind 值判断订单类型
        switch (row.order_type) {
          case 4: // 按时间
          case 5: // 按笔数
          case 6: // 福利能量
          case 7: // 快速能量
          case 9: // 批量能量
          case 10: // 批量激活
            href = `${href}/energy_order`
            break
          case 3: // 兑换
            href = `${href}/exchange_order`
            break
          case 8: // 自动托管
            href = `${href}/hosted_order`
            break
          case 11: // 机器人付费
            // 机器人付费可能没有对应的订单页面
            href = ''
            break
          default:
            href = ''
        }
        return (
          <>
            {href ? (
              <ElLink
                type="primary"
                onClick={() => router.push({ path: href, query: { order_num: row.order_num } })}
              >
                {row.order_num}
              </ElLink>
            ) : (
              <span>{row.order_num}</span>
            )}
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
  if (!props.accountId) {
    ElMessage.warning('账户ID不能为空')
    return { list: [], total: 0 }
  }

  try {
    // 构建查询参数
    const queryParams: any = {
      current_page: params.current_page || params.page || 1,
      page_size: params.page_size || params.limit || 10,
      kinds: [3, 4, 5, 6, 7, 8, 9, 10, 11], // 扣款类型
      agent_id: props.accountId
    }

    // 处理搜索条件
    if (params.order_type) {
      queryParams.kinds = [Number(params.order_type)]
    }
    if (params.id) {
      queryParams.order_id = params.id
    }
    if (params.time_range && params.time_range.length === 2) {
      // time_range 是时间戳数组（毫秒），转换为秒级时间戳
      const startTimestamp = Number(params.time_range[0])
      const endTimestamp = Number(params.time_range[1])

      const startDate = new Date(startTimestamp)
      const endDate = new Date(endTimestamp)

      // 设置开始时间为当天的 00:00:00
      startDate.setHours(0, 0, 0, 0)
      // 设置结束时间为当天的 23:59:59
      endDate.setHours(23, 59, 59, 999)

      // 转换为秒级时间戳（纯数字）
      queryParams.start_time = Math.floor(startDate.getTime() / 1000)
      queryParams.end_time = Math.floor(endDate.getTime() / 1000)
    }

    const res = await v1GetBillList(queryParams)

    if (res && res.data) {
      // 从第一条记录获取账户名称（如果父组件没有传入）
      if (res.data.list && res.data.list.length > 0 && !accountName.value) {
        accountName.value = res.data.list[0].agent_name || ''
      }

      // 映射字段：新接口 → 旧字段格式
      const mappedList = (res.data.list || []).map((item) => ({
        order_num: item.order_id,
        order_type: item.kind,
        bot_name: item.bot_name || '-',
        amount: item.amount,
        unit: item.coin,
        after_amount: item.balance,
        create_time: item.created_at * 1000, // 秒转毫秒
        describe: item.describe
      }))

      const total = res.data.pager?.total || 0

      // 添加数据为空提示
      const hasSearchCondition = !!(params.order_type || params.id || params.time_range)
      handleListMessage(mappedList, hasSearchCondition, '扣款记录')

      return {
        list: mappedList,
        total: total
      }
    }

    handleErrorMessage(res, '获取扣款记录失败')
    return { list: [], total: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取扣款记录失败')
    return { list: [], total: 0 }
  }
}

// 处理搜索
const onSearch = () => {
  // 搜索处理逻辑
}

// 打开弹窗
const open = (_accountId: number, name: string = '') => {
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
