<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchAgentLedgerList"
        :showAddButton="false"
        :pagination="{
          total: totalCount
        }"
        ref="searchTableRef"
        @search="onSearch"
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
import { ElTag, ElLink } from 'element-plus'
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
import { handleErrorMessage, handleSuccessMessage, handleListMessage } from '@/utils/messageHelper'

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const router = useRouter()
const totalCount = ref(0)
const currentSearchParams = ref({})

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

// API 封装 - 参考能量订单页面的实现
const fetchAgentLedgerList = async (params: any) => {
  try {
    console.log('[fetchAgentLedgerList] ========== 开始请求 ==========')
    console.log('[fetchAgentLedgerList] 请求参数:', JSON.stringify(params, null, 2))

    // 构建请求参数 - 直接使用后端字段名
    const adaptedParams: any = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    // 关键字搜索
    if (params.query) adaptedParams.keyword = params.query

    // 交易类型 - kinds 是数组
    if (params.order_type) adaptedParams.kinds = [Number(params.order_type)]

    // 排序参数 - 格式：column [ASC|DESC]
    // 前端字段 create_time 需要映射为后端字段 created_at
    if (params.order) {
      // 字段映射：前端 -> 后端
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        adaptedParams.order = `${mappedField} ${direction}`
      } else {
        adaptedParams.order = params.order
      }
    }

    // 时间范围 - 转换为字符串格式的 Unix 时间戳（秒级）
    if (params.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      adaptedParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    console.log('[fetchAgentLedgerList] 适配后参数:', JSON.stringify(adaptedParams, null, 2))

    const response = await v2GetAgentBillList(adaptedParams)

    console.log('[fetchAgentLedgerList] API 响应:', {
      code: response.code,
      listLength: response.data?.list?.length,
      total: response.data?.pager?.total,
      rawList: response.data?.list // 打印完整的原始列表
    })

    // 检查是否有重复的数据
    const orderIds = response.data?.list?.map((item: any) => item.order_id) || []
    const duplicates = orderIds.filter((id, index) => orderIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      console.warn('[fetchAgentLedgerList] ⚠️ 后端返回了重复的 order_id:', duplicates)
    }

    // 检查空 order_id 的数量
    const emptyOrderIds = orderIds.filter((id) => !id || id === '')
    if (emptyOrderIds.length > 0) {
      console.warn(
        '[fetchAgentLedgerList] ⚠️ 后端返回了',
        emptyOrderIds.length,
        '条空 order_id 的记录'
      )
    }

    // 直接使用后端返回的字段，只做必要的时间戳转换
    // 重要：使用 Array.from 或 map 创建全新的数组，避免引用问题
    // 关键修复：为每条记录生成唯一ID，避免 rowKey 重复导致的渲染问题
    const list = Array.from(response.data?.list || []).map((item: any, index: number) => ({
      ...item, // 保留所有原始字段
      // 生成唯一ID：优先使用 order_id，如果为空则使用 created_at + index 组合
      id: item.order_id || `${item.created_at}_${item.agent_id}_${index}`,
      create_time: item.created_at * 1000, // 秒 → 毫秒
      order_num: item.order_id, // 用于显示
      email: item.agent_email || item.agent_name, // 优先使用邮箱
      username: item.agent_name, // 代理名称
      unit: item.coin, // 币种
      after_amount: item.balance, // 交易后余额
      change_type: parseFloat(item.amount) < 0 ? 'out' : 'in', // 收支类型
      status: 1, // 默认已完成
      order_type: item.kind, // 订单类型
      describe: item.describe // 交易描述
    }))

    totalCount.value = response.data?.pager?.total || 0
    currentSearchParams.value = params

    console.log('[fetchAgentLedgerList] 处理后数据:', {
      total: totalCount.value,
      count: list.length,
      firstItem: list[0],
      lastItem: list[list.length - 1]
    })
    console.log('[fetchAgentLedgerList] ========== 请求完成 ==========')

    // 提示消息
    const hasSearchCondition = !!(params.query || params.order_type || params.dateRange)
    handleListMessage(list, hasSearchCondition, '代理账单')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    console.error('[fetchAgentLedgerList] ========== 请求错误 ==========')
    console.error('[fetchAgentLedgerList] 错误:', error)
    handleErrorMessage(error, '获取代理账单列表失败')
    return { list: [], total: 0 }
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
    formatter: (row: any) => (isEmpty(row.order_num) ? '-' : row.order_num),
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
            href = ''
            break
          default:
            href = ''
        }

        if (!href) {
          return <span>{row.order_num}</span>
        }

        return (
          <ElLink
            type="primary"
            onClick={() => router.push({ path: href, query: { query: row.order_num } })}
          >
            {row.order_num}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'email',
    label: '代理邮箱',
    formatter: (row: any) => row.email || '-'
  },
  {
    field: 'username',
    label: '代理名称',
    formatter: (row: any) => row.username || '-'
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    formatter: (row: any) => row.bot_name || '-'
  },
  {
    field: 'describe',
    label: '交易类型',
    formatter: (row: any) => {
      const typeMap = orderTypeMap()
      return typeMap[row.order_type] || row.describe || '-'
    }
  },
  {
    field: 'amount',
    label: '金额变动',
    width: '100px',
    formatter: (row: any) => {
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
    formatter: (row: any) => row.after_amount || '-'
  },
  {
    field: 'status',
    label: '扣款状态',
    formatter: (row: any) => {
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
    formatter: (row: any) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  }
])

// 处理搜索
const onSearch = (params: any) => {
  currentSearchParams.value = params
}

onMounted(() => {
  setTimeout(() => {
    if (searchTableRef.value) {
      searchTableRef.value.reload()
    }
  }, 100)
})

// 处理导出
const handleExport = async () => {
  try {
    // 尝试获取当前搜索条件，如果失败则使用保存的参数
    let params
    try {
      params = await searchTableRef.value?.searchMethods?.getFormData()
    } catch (e) {
      params = currentSearchParams.value
    }

    // 构建导出参数，只包含搜索条件，不包含分页信息
    const exportParams: any = {}

    if (params?.query) exportParams.keyword = params.query
    if (params?.order_type) exportParams.kinds = [Number(params.order_type)]

    // 处理时间范围 - 转换为字符串格式的 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(params.dateRange[0] / 1000).toString()
      exportParams.end_time = Math.floor(params.dateRange[1] / 1000).toString()
    }

    console.log('[handleExport] 导出参数:', exportParams)

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
      handleErrorMessage('导出失败：数据格式错误', '导出失败')
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
