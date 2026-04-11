<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchDataApiWrapper"
        :row-key="(row) => row.id"
        ref="searchTableRef"
        @add="handleAdd"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
        :show-add-button="false"
      />

      <!-- 表单弹窗 -->
      <PriceForm ref="formRef" @success="handleSuccess" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import PriceForm from './components/PriceForm.vue'
import { v2GetSystemPrice } from '@/api/marketing/agent_price'
import type { V2SystemPriceResponse } from '@/api/marketing/agent_price_types'
import { BaseButton } from '@/components/Button'
import { handleErrorMessage } from '@/utils/messageHelper'

// 定义类型映射
const priceTypeMap = {
  1: '首次激活',
  2: '按天数/小时',
  3: '闪兑',
  4: '按笔数',
  5: '托管',
  6: '闪租'
}

// 定义SearchTable实例类型
interface SearchTableInstance {
  reload: () => Promise<void>
  reset: () => Promise<any>
  search: () => Promise<any>
  delete: (row: any) => Promise<boolean>
  currentRow: any
  tableMethods: any
  searchMethods: any
  tableState: any
  searchParams: any
  setSearchParams: (params: any) => any
  hasError: boolean
}

// 表格引用
const searchTableRef = ref<SearchTableInstance | null>(null)
const formRef = ref()
const isLoaded = ref(false)

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  const hours = ('0' + date.getHours()).slice(-2)
  const minutes = ('0' + date.getMinutes()).slice(-2)
  const seconds = ('0' + date.getSeconds()).slice(-2)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 包装 API 响应格式 - 调用新接口并拆分成6条记录
const fetchDataApiWrapper = async (params) => {
  try {
    const res = await v2GetSystemPrice()
    if (!res || !res.data) {
      return { list: [], total: 0 }
    }

    const data: V2SystemPriceResponse = res.data
    const createdTime = formatTime(data.created_at)
    const updatedTime = formatTime(data.updated_at)

    // 将一条数据拆分成6条记录
    const allList = [
      {
        id: 1,
        tableIndex: 1,
        price_type: 1, // 首次激活
        type: '首次激活',
        priceInfo: `激活地址单价: ${data.flash} TRX`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      },
      {
        id: 2,
        tableIndex: 2,
        price_type: 2, // 按天数/小时
        type: '按天数/小时',
        priceInfo: `1天: ${data.time_1d} TRX  3天: ${data.time_3d} TRX  7天: ${data.time_7d} TRX  15天: ${data.time_15d} TRX  30天: ${data.time_30d} TRX`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      },
      {
        id: 3,
        tableIndex: 3,
        price_type: 3, // 闪兑
        type: '闪兑',
        priceInfo: `${parseFloat(String(data.usdt_2_trx)) * 100}%(U兑换T) | ${parseFloat(String(data.trx_2_usdt)) * 100}%(T兑换U)`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      },
      {
        id: 4,
        tableIndex: 4,
        price_type: 4, // 按笔数
        type: '按笔数',
        priceInfo: `${data.stroke} TRX/笔`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      },
      {
        id: 5,
        tableIndex: 5,
        price_type: 5, // 托管
        type: '托管',
        priceInfo: `65000能量: ${data.hosting_65k} TRX | 131000能量: ${data.hosting_131k} TRX`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      },
      {
        id: 6,
        tableIndex: 6,
        price_type: 6, // 闪租
        type: '闪租',
        priceInfo: `${data.stroke} TRX/笔`,
        status: 1,
        create_time: createdTime,
        update_time: updatedTime,
        rawData: data
      }
    ]

    // 前端过滤：根据 price_type 参数筛选（对应 id）
    let filteredList = allList
    if (params?.price_type) {
      // 搜索框的 price_type 值：1-闪租, 2-托管, 3-按笔数, 4-闪兑, 5-按天数, 6-首次激活
      // 直接用 price_type 对应 id
      filteredList = allList.filter((item) => item.id === Number(params.price_type))
    }

    // 重新设置序号
    filteredList.forEach((item, index) => {
      item.tableIndex = index + 1
    })

    return {
      list: filteredList,
      total: filteredList.length
    }
  } catch (error) {
    handleErrorMessage(error, '获取代理价格列表失败')
    return { list: [], total: 0 }
  }
}

// 表格列配置
const columns = reactive<any[]>([
  {
    field: 'tableIndex',
    label: '序号',
    width: '70px',
    align: 'center'
  },
  {
    field: 'type',
    label: '类型',
    width: '150px'
  },
  {
    field: 'priceInfo',
    label: '代理TRX价格',
    minWidth: '200px',
    showOverflowTooltip: false
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    formatter: () => {
      return <ElTag type="success">启用</ElTag>
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: '180px'
  },
  {
    field: 'update_time',
    label: '修改时间',
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    formatter: (row) => {
      return (
        <BaseButton type="primary" onClick={() => handleEdit(row)}>
          修改
        </BaseButton>
      )
    }
  }
])

// 搜索项配置 - 暂时保留，但不会影响数据获取
const searchSchema = reactive([
  {
    field: 'price_type',
    component: 'Select' as const,
    label: '类型：',
    componentProps: {
      placeholder: '请选择类型',
      clearable: true,
      options: Object.entries(priceTypeMap).map(([key, value]) => ({
        label: value,
        value: key
      }))
    }
  }
])

// 新增配置
const handleAdd = () => {
  formRef.value.open({
    mode: 'add'
  })
}

// 编辑配置
const handleEdit = (row: any) => {
  const data = row.rawData

  // 根据不同的 price_type 构建对应的数据结构
  const formData: any = {
    price_type: row.price_type
  }

  // 根据类型填充对应的字段
  switch (row.price_type) {
    case 1: // 首次激活
      formData.price_trx = data.flash
      break
    case 2: // 按天数/小时
      formData.price_day_1 = data.time_1d
      formData.price_day_3 = data.time_3d
      formData.price_day_7 = data.time_7d
      formData.price_day_15 = data.time_15d
      formData.price_day_30 = data.time_30d
      break
    case 3: // 闪兑
      formData.price_trx = data.usdt_2_trx // U兑T费率
      formData.price_usdt = data.trx_2_usdt // T兑U费率
      break
    case 4: // 按笔数
      formData.price_trx = data.stroke
      break
    case 5: // 托管
      formData.price_trx_65000 = data.hosting_65k
      formData.price_trx_131000 = data.hosting_131k
      break
    case 6: // 闪租
      formData.price_trx = data.stroke
      break
  }

  formRef.value.open({
    mode: 'edit',
    data: formData,
    fullData: data // 传递完整的原始数据
  })
}

// 数据加载完成回调
const handleDataLoaded = ({ data, total, success }) => {
  console.log('数据加载完成:', {
    总条数: total,
    成功: success,
    数据: data,
    条数: data?.length || 0
  })
  nextTick(() => {
    isLoaded.value = true
  })
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败')
}

// 操作成功回调
const handleSuccess = () => {
  searchTableRef.value?.reload()
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
