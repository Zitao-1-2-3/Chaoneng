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
      >
        <!-- <template #toolbar>
          <ElButton type="primary" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-5px" />
            新增配置
          </ElButton>
        </template> -->

        <!-- 移除作用域插槽 -->
        <!--
        <template #action="{ row }">
          ...
        </template>
        -->
      </SearchTable>

      <!-- 表单弹窗 -->
      <PriceForm ref="formRef" @success="handleSuccess" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import { ElButton, ElMessageBox, ElMessage, ElTag } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { Icon } from '@/components/Icon'
import PriceForm from './components/PriceForm.vue'
import {
  getAgentPriceListApi,
  deleteAgentPriceApi,
  addAgentPriceApi,
  updateAgentPriceApi
} from '@/api/marketing/agent_price'
import type { AgentPriceVO, UpdatePriceParams } from '@/api/marketing/agent_price'
import { formatToDateTime } from '@/utils/dateUtil'
import { BaseButton } from '@/components/Button'

// 定义类型映射 (更新为正确映射)
const priceTypeMap = {
  // 1闪租 2托管 3按笔数 4闪兑 5按天数 6激活
  1: '闪租',
  2: '托管',
  3: '按笔数',
  4: '闪兑',
  5: '按天数',
  6: '首次激活'
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

// 包装 API 响应格式
const fetchDataApiWrapper = async (params) => {
  try {
    const snakeCaseParams = {}
    for (const key in params) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      snakeCaseParams[snakeKey] = params[key]
    }
    const res = await getAgentPriceListApi(snakeCaseParams)
    return {
      // 添加 index 给序号列使用，如果 list 不包含则 SearchTable 需要能处理
      list: (res.data?.list || []).map((item, index) => ({ ...item, tableIndex: index + 1 })),
      total: res.data?.totalCount || 0
    }
  } catch (error) {
    console.error('获取代理价格列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 格式化价格，处理 null/undefined
const formatPrice = (price: number | null | undefined, precision = 2): string => {
  if (price === null || price === undefined) return '-'
  return Number(price).toFixed(precision)
}

// 表格列配置 - 更新
const columns = reactive<any[]>([
  {
    field: 'tableIndex', // 使用 fetchDataApiWrapper 添加的索引
    label: '序号',
    width: '70px',
    align: 'center'
  },
  {
    field: 'price_type',
    label: '类型',
    width: '100px',
    formatter: (row: AgentPriceVO) => {
      return priceTypeMap[row.price_type] || '未知类型'
    }
  },
  {
    field: 'agentPrice',
    label: '代理TRX价格',
    minWidth: '150px',
    align: 'center',
    formatter: (row: AgentPriceVO) => {
      const type = row.price_type
      let content: any = '-'

      // 根据 price_type 渲染不同内容 (更新逻辑)
      if (type === 1) {
        // 闪租
        content = <div>{formatPrice(row.price_trx, 2)} TRX/笔</div>
      } else if (type === 2) {
        // 托管
        content = (
          <div>
            {`6500能量：${formatPrice(row.price_trx_65000, 2)}(TRX) ; 131000能量：${formatPrice(row.price_trx_131000, 2)}(TRX)`}
          </div>
        )
      } else if (type === 3) {
        // 按笔数
        content = <div>{formatPrice(row.price_trx, 2)} TRX/笔</div>
      } else if (type === 4) {
        // 闪兑
        content = <div>{formatPrice(row.price_trx, 2)}%(u兑换T)</div>
      } else if (type === 5) {
        // 按天数
        content = (
          <div style="display: flex; flex-wrap: wrap; gap: 0 10px; justify-content: center;">
            <span>1天: {formatPrice(row.price_day_1)} TRX</span>
            <span>3天: {formatPrice(row.price_day_3)} TRX</span>
            <span>7天: {formatPrice(row.price_day_7)} TRX</span>
            <span>15天: {formatPrice(row.price_day_15)} TRX</span>
            <span>30天: {formatPrice(row.price_day_30)} TRX</span>
          </div>
        )
      } else if (type === 6) {
        // 首次激活
        content = <div>激活地址单价: {formatPrice(row.price_trx)} TRX</div>
      }

      return content
    }
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    formatter: (row: AgentPriceVO) => {
      return row.status === 1 ? (
        <ElTag type="success">启用</ElTag>
      ) : row.status === 2 ? (
        <ElTag type="danger">禁用</ElTag>
      ) : (
        <ElTag type="info">未知</ElTag>
      )
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: (row: AgentPriceVO) => formatToDateTime(row.create_time)
  },
  {
    field: 'update_time',
    label: '修改时间',
    formatter: (row: AgentPriceVO) => formatToDateTime(row.update_time)
  },
  {
    field: 'action',
    label: '操作',
    fixed: 'right',
    // 添加 formatter 函数来渲染按钮
    formatter: (row) => {
      return (
        <>
          <BaseButton v-hasPermi="AgentPrice:edit" type="primary" onClick={() => handleEdit(row)}>
            {' '}
            修改{' '}
          </BaseButton>
          {/* <BaseButton
            type={row.status === 1 ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(row)}
          >
            { row.status === 1 ? '禁用' : '启用' }
          </BaseButton> */}
        </>
      )
    }
  }
])

// 搜索项配置 - 保持不变
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
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '状态：',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
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
const handleEdit = (row: AgentPriceVO) => {
  formRef.value.open({
    mode: 'edit',
    data: row
  })
}

// 切换状态
const handleToggleStatus = async (row: AgentPriceVO) => {
  if (!isLoaded.value) return

  try {
    const newStatus = row.status === 1 ? 2 : 1
    const statusText = newStatus === 1 ? '启用' : '禁用'

    await ElMessageBox.confirm(`确定要${statusText}该价格配置吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 精确构建 updateData，确保类型正确且无多余字段
    const updateData: UpdatePriceParams = {
      id: Number(row.id),
      price_type: Number(row.price_type), // 确保是数字
      // 显式转换所有价格字段为数字，处理 null/undefined 为 0
      price_trx: Number(row.price_trx) || 0,
      price_trx_65000: Number(row.price_trx_65000) || 0,
      price_trx_131000: Number(row.price_trx_131000) || 0,
      price_day_1: Number(row.price_day_1) || 0,
      price_day_3: Number(row.price_day_3) || 0,
      price_day_7: Number(row.price_day_7) || 0,
      price_day_15: Number(row.price_day_15) || 0,
      price_day_30: Number(row.price_day_30) || 0,
      status: newStatus // 使用新的状态
      // 不包含 createTime, updateTime, tableIndex, creatorName 等无关字段
    }

    await updateAgentPriceApi(updateData)
    ElMessage.success(`${statusText}成功`)
    handleSuccess()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error('操作失败')
    }
  }
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
  if (data?.length === 0 && success) {
    ElMessage.info('未查询到符合条件的数据')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败，请稍后重试')
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
