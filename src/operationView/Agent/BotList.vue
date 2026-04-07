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
  UpdateAgentBotStatusPayload,
  exportAgentBotListApi
} from '@/api/agent/bot'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useRoute, useRouter } from 'vue-router'
import { downloadByData } from '@/utils/download'

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
    const res = await getAgentBotListApi(params)
    // 适配新的分页格式：从 pager 对象中获取 total
    // 字段映射：将后端返回的字段名映射到前端使用的字段名
    const mappedList = (res.data.list || []).map((item: any) => ({
      ...item,
      username: item.user_name, // 映射 user_name -> username
      firstname: item.first_name, // 映射 first_name -> firstname
      account_num: item.user_count || 0, // 映射 user_count -> account_num（用户数量）
      order_count: item.order_count || 0 // 交易订单数
    }))

    return {
      list: mappedList,
      total: res.data.pager?.total || 0
    }
  } catch (error) {
    console.error('获取机器人列表失败:', error)
    ElMessage.error('获取机器人列表失败')
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
    field: 'keyword', // 使用新接口的 keyword 参数
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入关键字搜索'
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
    field: 'id', // 新接口字段：id (原来是tg_bot_id)
    label: '机器人ID'
  },
  {
    field: 'username', // 新接口字段：username (原来是name)
    label: '机器人用户名'
  },
  {
    field: 'agent_name', // 新接口字段：agent_name (原来是username)
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
    field: 'token', // 新接口字段：token (原来是apl_key)
    label: 'API密钥'
  },
  {
    field: 'account_num',
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
            {data.row.account_num}
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
    field: 'created_at', // 新接口字段：created_at (原来是create_time)
    label: '创建时间',
    minWidth: 160,
    showOverflowTooltip: false,
    formatter: (row: AgentBotItem) =>
      row.created_at ? formatToDateTime(row.created_at * 1000) : '-'
  },
  {
    field: 'updated_at', // 新接口字段：updated_at (原来是update_time)
    label: '最后活动时间',
    minWidth: 160,
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
    const res = await exportAgentBotListApi(params)
    if (res.data instanceof Blob) {
      downloadByData(res.data, '机器人列表.xlsx')
      ElMessage.success('导出已开始，请稍候')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
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
