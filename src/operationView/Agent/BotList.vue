<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用SearchTable组件 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentBotList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <!-- 可以根据需要添加自定义按钮，这里暂时留空 -->
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
import { ElTag, ElMessage, ElMessageBox, ElLink } from 'element-plus'
import { Icon } from '@/components/Icon'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentBotListApi,
  updateAgentBotStatusApi,
  AgentBotItem,
  UpdateAgentBotStatusPayload
} from '@/api/agent/bot'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useRoute, useRouter } from 'vue-router'
import { simpleExportToExcel } from '@/utils/excel'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const route = useRoute()
const router = useRouter()
// 引用SearchTable实例
const searchTableRef = ref()

// --- API 调用封装 ---
onMounted(() => {
  console.log('route', route.query)
  searchTableRef.value?.setSearchParams({
    query: route.query.id
  })
})

// 获取机器人列表API封装
const getAgentBotList = async (params?: any): Promise<{ list: AgentBotItem[]; total?: number }> => {
  try {
    const apiParams: any = { ...params }

    // 处理排序参数 - 字段名映射
    if (params?.order) {
      const fieldMapping: Record<string, string> = {
        account_num: 'user_count',
        order_count: 'order_count',
        created_at: 'created_at',
        updated_at: 'updated_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        apiParams.order = `${mappedField} ${direction}`
      }
    }

    const res = await getAgentBotListApi(apiParams)

    // 添加数据为空提示
    const hasSearchCondition = !!(params?.keyword || params?.status)
    handleListMessage(res.data.list || [], hasSearchCondition, '机器人')

    return {
      list: res.data.list || [],
      total: res.data.pager?.total || 0
    }
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    return { list: [], total: 0 }
  }
}

// 更新机器人状态API封装
const updateBotStatus = async (id: number | string, status: number) => {
  try {
    const payload: UpdateAgentBotStatusPayload = { id, status }
    await updateAgentBotStatusApi(payload)
    handleSuccessMessage(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    handleErrorMessage(error, '更新机器人状态失败')
  }
}

// --- SearchTable 配置 ---

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'keyword', // 使用新接口的 keyword 参数
    component: 'Input',
    label: '关键字',
    colProps: {
      span: 12 // 增加输入框占用的栅格列数，默认是6
    },
    componentProps: {
      placeholder: '请输入机器人ID/用户名/代理名称',
      style: {
        width: '100%'
      }
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态',
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

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'id',
    label: '机器人ID'
  },
  {
    field: 'user_name',
    label: '机器人用户名'
  },
  {
    field: 'agent_name',
    label: '代理名称'
  },
  {
    field: 'first_name',
    label: '机器人昵称',
    formatter: (row: AgentBotItem) => {
      return <span>{row.first_name}</span>
    }
  },
  {
    field: 'tg_admin',
    label: '管理员TG号'
  },
  {
    field: 'user_count',
    label: '用户数量',
    sortable: 'custom',
    slots: {
      default: (data: any) => {
        return (
          <ElLink
            type="primary"
            style="cursor:pointer"
            onClick={() => handleUserCountClick(data.row.id)}
          >
            {data.row.user_count}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'order_count',
    label: '交易订单数',
    sortable: 'custom'
  },
  {
    field: 'status',
    label: '机器人状态',
    formatter: (row: AgentBotItem) => {
      const status = row.status
      let text = '未知'
      let type: 'success' | 'danger' | 'info' = 'info'
      if (status === 1) {
        // 假设 1 是启用
        text = '启用'
        type = 'success'
      } else if (status === 2) {
        // 假设 2 是禁用
        text = '禁用'
        type = 'danger'
      }
      return <ElTag type={type}>{text}</ElTag>
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    minWidth: 160,
    sortable: 'custom',
    showOverflowTooltip: false,
    formatter: (row: AgentBotItem) =>
      row.created_at ? formatToDateTime(row.created_at * 1000) : '-'
  },
  {
    field: 'updated_at',
    label: '最后活动时间',
    minWidth: 160,
    sortable: 'custom',
    showOverflowTooltip: false,
    formatter: (row: AgentBotItem) =>
      row.updated_at ? formatToDateTime(row.updated_at * 1000) : '-'
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    formatter: (row: AgentBotItem) => {
      const isEnabled = row.status === 1
      const targetStatus = isEnabled ? 2 : 1
      const buttonText = isEnabled ? '禁用' : '启用'
      const buttonType = isEnabled ? 'danger' : 'success'
      const actionText = isEnabled ? '禁用' : '启用'

      return (
        <BaseButton
          type={buttonType}
          onClick={() => handleUpdateStatus(row.id, targetStatus, actionText)}
        >
          {buttonText}
        </BaseButton>
      )
    }
  }
])

// --- 事件处理 ---

// 处理搜索 (如果需要自定义搜索逻辑)
const handleSearch = (params) => {
  console.log('搜索参数:', params)
  // SearchTable 组件会自动使用 params 调用 fetchDataApi，
  // 这里可以添加额外的搜索处理逻辑（如果需要）
}

// 处理状态更新按钮点击
const handleUpdateStatus = (id: number | string, status: number, actionText: string) => {
  ElMessageBox.confirm(`确定要${actionText}该机器人吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await updateBotStatus(id, status)
    })
    .catch(() => {
      // 用户取消操作
      ElMessage.info('操作已取消')
    })
}

const handleExport = async () => {
  try {
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}

    // 构建导出参数，只包含搜索条件，不包含分页信息
    const exportParams: any = {}

    if (params?.keyword) exportParams.keyword = params.keyword
    if (params?.status) exportParams.status = params.status

    console.log('导出参数:', exportParams)

    // 使用获取列表的接口进行导出
    const res = await getAgentBotListApi(exportParams)

    if (res.code === '000000' && res.data) {
      const list = (res.data.list || []).map((item: any) => ({
        机器人ID: item.id,
        机器人用户名: item.user_name,
        代理名称: item.agent_name,
        机器人昵称: item.first_name,
        管理员TG号: item.tg_admin || '-',
        用户数量: item.user_count || 0,
        交易订单数: item.order_count || 0,
        机器人状态: item.status === 1 ? '启用' : item.status === 2 ? '禁用' : '未知',
        创建时间: item.created_at ? formatToDateTime(item.created_at * 1000) : '-',
        最后活动时间: item.updated_at ? formatToDateTime(item.updated_at * 1000) : '-'
      }))

      // 导出为 Excel
      simpleExportToExcel(list, '机器人列表')
      handleSuccessMessage('导出成功')
    } else {
      ElMessage.error('导出失败：数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '导出失败')
  }
}

const handleUserCountClick = (botId: number | string) => {
  router.push({ path: '/agent/user_list', query: { bot_id: botId } })
}

onMounted(() => {
  // 优化：支持通过bot_id参数自动筛选
  if (route.query.bot_id) {
    searchTableRef.value?.setSearchParams({ query: String(route.query.bot_id) })
    searchTableRef.value?.reload()
  }
})
// 页面加载时自动查询 (SearchTable 内部会处理首次加载，此行可省略)
// onMounted(() => {
//   searchTableRef.value?.reload()
// })
</script>

<style scoped></style>
