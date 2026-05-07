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
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        :pagination="{
          total: totalCount
        }"
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
import { v2GetAgentBillList } from '@/api/agent/ledger'
import { ContentWrap } from '@/components/ContentWrap'
import { isEmpty } from 'lodash-es'
import { useRouter } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
// 引用SearchTable实例
const searchTableRef = ref()
const router = useRouter()
const totalCount = ref(0)

const orderTypeMap = () => {
  return {
    1: '代理充值',
    3: '兑换',
    4: '按时间',
    5: '按笔数',
    6: '福利能量',
    7: '闪租',
    8: '托管',
    9: '批量能量',
    10: '激活',
    11: '机器人付费'
  }
}

// 定义API函数调用
const getAgentLedgerList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    // 映射参数字段
    const adaptedParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.query) adaptedParams.keyword = params.query // query → keyword
    if (params?.order_type) adaptedParams.kinds = [Number(params.order_type)] // order_type → kinds数组

    // 处理排序参数 - 字段名映射
    if (params?.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        adaptedParams.order = `${mappedField} ${direction}`
      }
    }

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
      email: item.agent_email || item.agent_name, // 优先使用 agent_email，兜底使用 agent_name
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

    // 更新总数
    totalCount.value = res.data?.pager?.total || 0

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
          case 1: // 代理充值
            href = `${href}/recharge_order`
            break
          case 3: // 兑换
            href = `${href}/flash_exchange`
            break
          case 4: // 按时间
          case 5: // 按笔数
          case 6: // 福利能量
          case 7: // 闪租
          case 9: // 批量能量
          case 10: // 激活
            href = `${href}/energy_transaction`
            break
          case 8: // 托管
            href = `${href}/custody_details`
            break
          case 11: // 机器人付费
            href = '' // 机器人付费没有对应的详情页
            break
          default:
            href = ''
        }

        // 如果没有跳转链接，只显示文本
        if (!href) {
          return <span>{row.order_num}</span>
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
    formatter: (row) => {
      // 根据 order_type (kind) 动态显示交易类型
      const typeMap = orderTypeMap()
      return typeMap[row.order_type] || row.describe || '-'
    }
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
    sortable: 'custom',
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  }
])

// 处理搜索
const handleSearch = (_params) => {
  // 搜索处理逻辑
}

onMounted(() => {
  searchTableRef.value?.reload()
})

// 处理导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 构建导出参数，只包含搜索条件，不包含分页信息
    const exportParams: any = {}

    if (params?.query) exportParams.keyword = params.query
    if (params?.order_type) exportParams.kinds = [Number(params.order_type)]

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      exportParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('导出参数:', exportParams)

    // 使用获取列表的接口进行导出
    const res = await v2GetAgentBillList(exportParams)

    if (res.code === '000000' && res.data) {
      const typeMap = orderTypeMap()
      const list = (res.data.list || []).map((item: any) => ({
        关联订单ID: item.order_id || '-',
        代理邮箱: item.agent_email || item.agent_name || '-',
        代理名称: item.agent_name || '-',
        机器人名称: item.bot_name || '-',
        交易类型: typeMap[item.kind] || item.describe || '-',
        金额变动: `${parseFloat(item.amount) < 0 ? '-' : '+'}${Math.abs(parseFloat(item.amount))} ${item.coin || ''}`,
        交易后TRX余额: item.balance || '-',
        扣款状态: '已完成',
        扣款时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-'
      }))

      // 导出为 Excel
      simpleExportToExcel(list, '代理账单')
      handleSuccessMessage('导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '导出失败')
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
