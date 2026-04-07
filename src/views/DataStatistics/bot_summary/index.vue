<template>
  <ContentWrap>
    <SearchTable
      :columns="columns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchDataApi"
      :action-column="actionColumn"
      :show-add-button="false"
    />

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="`机器人摘要详情`"
      width="800px"
      :before-close="handleCloseDetail"
    >
      <div v-if="currentDetail">
        <Descriptions
          :title="`${currentDetail.botUsername} - ${currentDetail.date}`"
          :data="currentDetail"
          :schema="detailSchema"
          :column="1"
          border
        />
      </div>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="tsx">
import { reactive, computed, ref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { TableColumn } from '@/components/Table'
import { FormSchema } from '@/components/Form'
import { BaseButton } from '@/components/Button'
import { ElMessage, ElDialog } from 'element-plus'
import { getBotListApi } from '@/api/botlist'
import { getBotSummaryApi } from '@/api/statistics'
import { BotSummaryItem } from '@/api/statistics/types'
import { Descriptions } from '@/components/Descriptions'
import { DescriptionsSchema } from '@/components/Descriptions/src/types'
import { handleListMessage, handleErrorMessage } from '@/utils/messageHelper'

defineOptions({
  name: 'BotSummary'
})

const { t } = useI18n()

// 表格列定义
const columns = reactive<TableColumn[]>([
  {
    field: 'date',
    label: '日期',
    align: 'center'
  },
  {
    field: 'botUsername',
    label: '机器人用户名',
    align: 'center'
  },
  {
    field: 'trxCost',
    label: 'TRX总成本',
    align: 'center',
    formatter: (row) => {
      return row.trxCost.toFixed(2)
    }
  },
  {
    field: 'trxProfit',
    label: 'TRX总利润',
    align: 'center',
    formatter: (row) => {
      return row.trxProfit.toFixed(2)
    }
  },
  {
    field: 'rechargeTrxAmount',
    label: '充值TRX金额',
    align: 'center',
    formatter: (row) => {
      return row.rechargeTrxAmount.toFixed(2)
    }
  },
  {
    field: 'rechargeUsdtAmount',
    label: '充值USDT金额',
    align: 'center',
    formatter: (row) => {
      return row.rechargeUsdtAmount.toFixed(2)
    }
  },
  {
    field: 'energyOrderTrxAmount',
    label: '能量订单TRX金额',
    align: 'center',
    formatter: (row) => {
      return row.energyOrderTrxAmount.toFixed(2)
    }
  },
  {
    field: 'energyOrderUsdtAmount',
    label: '能量订单USDT金额',
    align: 'center',
    formatter: (row) => {
      return row.energyOrderUsdtAmount.toFixed(2)
    }
  },
  {
    field: 'hostedOrderTrxAmount',
    label: '托管订单TRX金额',
    align: 'center',
    formatter: (row) => {
      return row.hostedOrderTrxAmount.toFixed(2)
    }
  },
  {
    field: 'hostedOrderUsdtAmount',
    label: '托管订单USDT金额',
    align: 'center',
    formatter: (row) => {
      return row.hostedOrderUsdtAmount.toFixed(2)
    }
  }
])

// 操作列定义
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => viewDetail(row)}>
            详情
          </BaseButton>
        </>
      )
    }
  }
}

// 详情弹窗控制
const detailVisible = ref(false)
const currentDetail = ref<BotSummaryItem | null>(null)

// 详情展示配置
const detailSchema = reactive<DescriptionsSchema[]>([
  {
    field: 'newUserCount',
    label: '新增用户数'
  },
  {
    field: 'rechargeOrderCount',
    label: '充值订单数'
  },
  {
    field: 'rechargeTrxOrderCount',
    label: '充值TRX订单数'
  },
  {
    field: 'rechargeUsdtOrderCount',
    label: '充值USDT订单数'
  },
  {
    field: 'energyOrderCount',
    label: '能量订单数'
  },
  {
    field: 'energyTimeRentalOrderCount',
    label: '能量时租订单数'
  },
  {
    field: 'energyBatchOrderCount',
    label: '能量批售订单数'
  },
  {
    field: 'hostedOrderCount',
    label: '托管订单数'
  },
  {
    field: 'hostedTransactionCount',
    label: '托管交易数'
  }
])

// 获取机器人列表选项
const getBotOptions = async () => {
  try {
    const res = await getBotListApi({})
    if (res?.data?.list) {
      return res.data.list.map((item) => ({
        label: item.username,
        value: item.id
      }))
    }
    return []
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    return []
  }
}

// 搜索表单配置
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'botId',
    label: '机器人',
    component: 'Select',
    componentProps: {
      optionApi: getBotOptions,
      placeholder: '请选择机器人',
      clearable: true
    }
  },
  {
    field: 'dateRange',
    label: '日期',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      clearable: true
    }
  }
])

// 数据获取API
const fetchDataApi = async (params: any) => {
  // 处理日期范围
  const queryParams = { ...params }
  if (params.dateRange && params.dateRange.length === 2) {
    queryParams.startDate = params.dateRange[0]
    queryParams.endDate = params.dateRange[1]
    delete queryParams.dateRange
  }

  try {
    // 调用API获取数据
    const res = await getBotSummaryApi({
      pageSize: params.pageSize || 10,
      pageNum: params.pageNum || 1,
      ...queryParams
    })

    return {
      list: res.data.list,
      total: res.data.total
    }
  } catch (error) {
    console.error('获取机器人摘要数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
    return {
      list: [],
      total: 0
    }
  }
}

// 查看详情
const viewDetail = (row: BotSummaryItem) => {
  currentDetail.value = row
  detailVisible.value = true
}

// 关闭详情弹窗
const handleCloseDetail = () => {
  detailVisible.value = false
  currentDetail.value = null
}
</script>

<style scoped>
.search-table-container {
  width: 100%;
}
</style>
