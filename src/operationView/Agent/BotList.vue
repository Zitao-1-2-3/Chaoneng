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
import { ElTag, ElMessage, ElMessageBox, ElLink } from 'element-plus' // 引入ElMessageBox
import { Icon } from '@/components/Icon'
import { SearchTable, useSearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentBotListApi,
  updateAgentBotStatusApi,
  AgentBotQueryParams,
  AgentBotItem,
  UpdateAgentBotStatusPayload,
  exportAgentBotListApi
} from '@/api/agent/bot' // 更新导入路径
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useRoute, useRouter } from 'vue-router'

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
    // 直接传递 useSearchTable 处理好的参数
    const res = await getAgentBotListApi(params)
    // 直接返回 API 响应数据，useSearchTable 会处理 list 和 totalCount
    return res.data
  } catch (error) {
    console.error('获取机器人列表失败:', error)
    ElMessage.error('获取机器人列表失败')
    // 返回符合函数签名的空结构
    return { list: [], total: 0 }
  }
}

// 更新机器人状态API封装
const updateBotStatus = async (id: number | string, status: number) => {
  try {
    const payload: UpdateAgentBotStatusPayload = { id, status }
    await updateAgentBotStatusApi(payload)
    ElMessage.success(status === 1 ? '启用成功' : '禁用成功')
    // 刷新列表
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('更新机器人状态失败:', error)
    ElMessage.error('更新机器人状态失败')
  }
}

// --- SearchTable 配置 ---

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query', // 对应 AgentBotQueryParams 的 query 字段
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '机器人ID/用户名/所属代理' // 明确提示搜索范围
    }
  },
  {
    field: 'status', // 对应 AgentBotQueryParams 的 status 字段
    component: 'Select',
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '全部', value: '' }, // 使用空字符串代表全部
        { label: '启用', value: 1 }, // 假设 1 代表启用
        { label: '禁用', value: 2 } // 假设 2 代表禁用
      ]
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'tg_bot_id',
    label: '机器人ID'
  },
  {
    field: 'name',
    label: '机器人用户名'
  },
  {
    field: 'username',
    label: '代理名称'
  },
  {
    field: 'firstname',
    label: '机器人昵称',
    formatter: (row: AgentBotItem) => {
      return <span>{row.firstname}</span>
    }
  },
  {
    field: 'tg_admin',
    label: '管理员TG号'
  },
  {
    field: 'apl_key',
    label: 'API密钥'
  },
  {
    field: 'account_num',
    label: '用户数量',
    slots: {
      default: (data: any) => {
        return (
          <ElLink
            type="primary"
            style="cursor:pointer"
            onClick={() => handleUserCountClick(data.row.id)}
          >
            {data.row.account_num}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'order_count',
    label: '交易订单数'
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
    field: 'create_time',
    label: '创建时间',
    formatter: (row: AgentBotItem) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'update_time',
    label: '最后活动时间',
    formatter: (row: AgentBotItem) => (row.update_time ? formatToDateTime(row.update_time) : '-')
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
    await exportAgentBotListApi(params)
    ElMessage.success('导出已开始，请稍候')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
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

<style scoped>
.app-container {
  padding: 20px;
}

/* 如果需要可以添加更多样式 */
</style>
