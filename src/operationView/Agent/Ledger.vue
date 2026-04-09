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
import { ref, onMounted } from 'vue'
import { ElTag, ElMessage, ElLink } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { v2GetAgentBillList, v2ExportAgentBill } from '@/api/agent/ledger'
import { ContentWrap } from '@/components/ContentWrap'
import { isEmpty } from 'lodash-es'
import { useRouter } from 'vue-router'
import { downloadByData } from '@/utils/download'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
// 引用SearchTable实例
const searchTableRef = ref()
const router = useRouter()

const orderTypeMap = () => {
  return {
    1: '能量订单',
    2: '托管',
    3: '兑换',
    4: '按笔数',
    5: '按时间',
    6: '批量下单',
    7: '闪租',
    8: '激活',
    9: '机器人续费',
    10: '后台手动变更',
    11: '福利订单'
  }
}

// 定义API函数调用
const getAgentLedgerList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    // 映射参数字段
    const adaptedParams: any = {
      current_page: params?.current_page || params?.currentPage || 1,
      page_size: params?.page_size || params?.pageSize || 10
    }

    if (params?.query) adaptedParams.keyword = params.query // query → keyword
    if (params?.order_type) adaptedParams.kinds = [Number(params.order_type)] // order_type → kinds数组

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      adaptedParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('[getAgentLedgerList] 调用新接口 v2GetAgentBillList, 参数:', adaptedParams)

    // 使用新接口 v2GetAgentBillList
    const res = await v2GetAgentBillList(adaptedParams)

    // 映射返回数据字段
    const list = (res.data?.list || []).map((item: any) => ({
      id: item.order_id,
      order_num: item.order_id, // order_id → order_num
      email: item.agent_name, // agent_name → email (代理信息)
      username: item.agent_name, // agent_name → username (代理名称)
      bot_name: item.bot_name,
      describe: item.describe, // 交易类型描述
      amount: item.amount, // 金额变动
      change_type: parseFloat(item.amount) < 0 ? 'out' : 'in', // 根据金额正负判断
      unit: item.coin, // coin → unit
      after_amount: item.balance, // balance → after_amount (交易后余额)
      status: 1, // 新接口没有状态字段，默认为已完成
      create_time: item.created_at * 1000, // created_at（秒）→ create_time（毫秒）
      order_type: item.kind // kind → order_type
    }))

    console.log('[getAgentLedgerList] 返回数据:', {
      total: res.data?.pager?.total,
      count: list.length
    })

    return {
      list,
      total: res.data?.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取代理账单列表失败')
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
      tips: '机器人名称/代理名称/关联订单ID'
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
        if (isEmpty(row.order_num)) return <span>-</span>
        let href = '/operation'
        switch (row.order_type) {
          case 1: // 能量订单
          case 4: // 按笔数
          case 5: // 按时间
          case 6: // 批量下单
          case 7: // 闪租
          case 8: // 激活
          case 9: // 机器人续费
          case 11: // 福利订单
            href = `${href}/energy_transaction`
            break
          case 3: // 兑换
            href = `${href}/flash_exchange`
            break
          case 2: // 托管
            href = `${href}/custody_details`
            break
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
  {
    field: 'email',
    label: '代理邮箱',
    formatter: (row) => row.email || '-'
  },
  {
    field: 'username',
    label: '代理名称',
    formatter: (row) => row.username || '-'
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    formatter: (row) => row.bot_name || '-'
  },
  {
    field: 'describe',
    label: '交易类型',
    formatter: (row) => row.describe || '-'
  },

  {
    field: 'amount',
    label: '金额变动',
    width: '100px',
    formatter: (row) => {
      const value = parseFloat(row.amount)
      const absValue = Math.abs(value)
      const isOut = value < 0
      return (
        <span style={{ color: isOut ? 'red' : 'green' }}>
          {isOut ? '-' : '+'}
          {absValue} {row.unit || ''}
        </span>
      )
    }
  },
  {
    field: 'after_amount',
    label: '交易后TRX余额',
    formatter: (row) => row.after_amount || '-'
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
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  }
])

// 处理搜索
const handleSearch = (_params) => {
  // 搜索处理逻辑
}

// 处理导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 映射导出参数
    const exportParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.query) exportParams.keyword = params.query
    if (params?.order_type) exportParams.kinds = [Number(params.order_type)]

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      exportParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('[handleExport] 调用新接口 v2ExportAgentBill, 参数:', exportParams)

    // 使用新接口 v2ExportAgentBill
    const res = await v2ExportAgentBill(exportParams)

    // 使用下载工具处理 blob 数据
    if (res.data instanceof Blob) {
      downloadByData(res.data, '代理账单.xlsx')
      handleSuccessMessage('导出成功')
    } else {
      handleErrorMessage('文件数据格式错误', '导出失败')
    }
  } catch (error) {
    handleErrorMessage(error, '导出失败')
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
