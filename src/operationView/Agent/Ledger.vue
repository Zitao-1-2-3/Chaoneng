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
        <!-- <template #searchButtons>
          <BaseButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </BaseButton>
        </template> -->
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
    10: '后台手动变更'
  }
}

// 定义API函数调用
const getAgentLedgerList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getAgentLedgerListApi(params)
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

// 导出数据API
const exportAgentLedger = async (params: AgentLedgerQueryParams) => {
  try {
    ElMessage.success('导出已开始，请稍候')
    await exportAgentLedgerApi(params)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入代理信息/关联订单ID'
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
    // 获取当前搜索参数
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    await exportAgentLedger(params as AgentLedgerQueryParams)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
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
