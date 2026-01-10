<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用SearchTable组件，提供完整功能 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentLedgerList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template>
      </SearchTable>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue'
import { ElTag, ElMessage, ElLink } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { SearchTable, useSearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentLedgerListApi,
  exportAgentLedgerApi,
  AgentLedgerQueryParams,
  AgentLedgerItem
} from '@/api/agent/ledger'
import { ContentWrap } from '@/components/ContentWrap'
import { isEmpty } from 'lodash-es'
import { useRouter } from 'vue-router'
import { downloadByData } from '@/utils/download'
// 引用SearchTable实例
const searchTableRef = ref()
const router = useRouter()

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
    20: '福利订单'
  }
}

// 定义API函数调用
const getAgentLedgerList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    // 处理时间范围
    const apiParams = { ...params }
    if (params?.dateRange && params.dateRange.length === 2) {
      apiParams.start_time = params.dateRange[0]
      apiParams.end_time = params.dateRange[1]
      delete apiParams.dateRange
    }
    const res = await getAgentLedgerListApi(apiParams)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取代理账单列表失败:', error)
    ElMessage.error('获取代理账单列表失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: {
      text: '关键字',
      tips: '机器人名称/代理信息/关联订单ID'
    },
    componentProps: {
      placeholder: '请输入关键字'
    }
  },
  {
    field: 'order_type',
    component: 'Select',
    label: '交易类型',
    componentProps: {
      placeholder: '请选择交易类型',
      clearable: true,
      options: Object.entries(orderTypeMap()).map(([key, value]) => ({
        label: value,
        value: key
      }))
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

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'order_num',
    label: '关联订单ID',
    minWidth: 120,
    formatter: (row) => (isEmpty(row.order_num) ? '-' : row.order_num),
    slots: {
      default: ({ row }: any) => {
        let href = '/operation'
        switch (row.order_type) {
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
            href = `${href}/energy_transaction`

            break
          case 3:
            href = `${href}/flash_exchange`
            break
          case 2:
            href = `${href}/custody_details`
            break
          // case 1:
          //   href = `${href}/recharge_order`
          //   break
          default:
            href = ''
        }
        return (
          <>
            <ElLink
              type="primary"
              onClick={() => router.push({ path: href, query: { query: row.order_num } })}
            >
              {row.order_num}
            </ElLink>
          </>
        )
      }
    }
  },
  // {
  //   field: 'user_id',
  //   label: '代理ID'
  // },
  {
    field: 'email',
    label: '代理信息'
  },
  {
    field: 'username',
    label: '代理名称'
  },
  {
    field: 'bot_name',
    label: '机器人名称'
  },
  {
    field: 'describe',
    label: '交易类型'
  },

  {
    field: 'amount',
    label: '金额变动',
    width: '100px',
    formatter: (row) => {
      const value = parseFloat(row.amount)
      const isOut = row.change_type === 'out'
      return (
        <span style={{ color: isOut ? 'red' : 'green' }}>
          {isOut ? '-' : '+'}
          {value} {row.unit}
        </span>
      )
    }
  },
  {
    field: 'after_amount',
    label: '交易后TRX余额'
  },
  {
    field: 'status',
    label: '扣款状态',
    formatter: (row) => {
      let type: 'success' | 'warning' | 'info' | 'danger' = 'info'
      const statusMap = {
        0: '已完成',
        1: '已完成',
        2: '已取消',
        3: '进行中'
      }
      switch (row.status) {
        case 0:
        case 1:
          type = 'success'
          break
        case 2:
          type = 'danger'
          break
        case 3:
          type = 'warning'
          break
        default:
          type = 'info'
          break
      }
      return <ElTag type={type}>{statusMap[row.status]}</ElTag>
    }
  },
  {
    field: 'create_time',
    label: '扣款时间',
    formatter: (row) => formatToDateTime(row.create_time)
  }
])

// 处理搜索
const handleSearch = (params) => {
  console.log('搜索参数:', params)
}

// 处理导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()
    // 处理时间范围
    const exportParams = { ...params }
    if (params.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = params.dateRange[0]
      exportParams.end_time = params.dateRange[1]
      delete exportParams.dateRange
    }
    const res = await exportAgentLedgerApi(exportParams)
    // 使用下载工具处理 blob 数据
    // Ensure res.data is a Blob before passing
    if (res.data instanceof Blob) {
      downloadByData(res.data, '代理账单.xlsx')

      ElMessage.success('账单导出成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('账单导出失败:', error)
    // Try to provide a more specific error message
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '账单导出失败'
    ElMessage.error(errorMsg)
  }
}
// 页面加载时自动查询
onMounted(() => {
  searchTableRef.value?.reload()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
