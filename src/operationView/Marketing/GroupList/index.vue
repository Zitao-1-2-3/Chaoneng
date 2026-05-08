<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchGroupList"
        :show-add-button="false"
        :action-column="actionColumn"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue'
import { ElTag, ElLink, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { getGroupList, getGroupBotList } from '@/api/group'
import type { GroupListParams } from '@/api/group/types'

// 机器人列表
const botList = ref<Array<{ label: string; value: number }>>([])

// 获取机器人列表
const fetchBotList = async () => {
  try {
    const res = await getGroupBotList()

    if (res.code === '000000' && res.data) {
      botList.value = (res.data || []).map((bot: any) => ({
        label: bot.user_name,
        value: bot.id
      }))
    } else {
      botList.value = []
    }
  } catch (error) {
    botList.value = []
  }
}

// 使用 reactive 而不是 computed
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入群组ID/群组名称/机器人ID',
      clearable: true
    }
  },
  {
    field: 'bot_id',
    component: 'Select',
    label: '机器人',
    componentProps: {
      options: botList,
      placeholder: '请选择机器人',
      clearable: true
    }
  },
  {
    field: 'date_range',
    component: 'DatePicker',
    label: '时间范围',
    componentProps: {
      type: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      style: { width: '240px' }
    }
  }
])

const columns: TableColumn[] = [
  {
    field: 'group_id',
    label: '群组ID',
    width: 150
  },
  {
    field: 'group_name',
    label: '群组名称',
    minWidth: 180,
    formatter: (row: any) => row.group_name || '-'
  },
  {
    field: 'bot_user_name',
    label: '机器人用户名',
    width: 150,
    slots: {
      default: (data: any) => {
        const username = data.row.bot_user_name
        if (!username) return <span>-</span>
        return (
          <ElLink type="primary" onClick={() => window.open(`https://t.me/${username}`, '_blank')}>
            {username}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 120
  },
  {
    field: 'bot_first_name',
    label: '机器人昵称',
    width: 150,
    formatter: (row: any) => row.bot_first_name || '-'
  },
  {
    field: 'group_size',
    label: '群人数',
    width: 100,
    slots: {
      default: (data: any) => {
        return (
          <ElTag type="info" size="small">
            {data.row.group_size || 0}
          </ElTag>
        )
      }
    }
  },
  {
    field: 'group_link',
    label: '群链接',
    width: 200,
    slots: {
      default: (data: any) => {
        const link = data.row.group_link
        if (!link) return <span>-</span>
        return (
          <ElLink type="primary" onClick={() => window.open(link, '_blank')}>
            {link}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row: any) => (row.created_at ? formatToDateTime(row.created_at) : '-')
  },
  {
    field: 'updated_at',
    label: '更新时间',
    width: 180,
    sortable: 'custom',
    formatter: (row: any) => (row.updated_at ? formatToDateTime(row.updated_at) : '-')
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 120,
  fixed: 'right',
  slots: {
    default: (data: any) => {
      return (
        <BaseButton type="success" onClick={() => handleViewDetail(data.row)}>
          发送消息
        </BaseButton>
      )
    }
  }
}

const fetchGroupList = async (params: any) => {
  try {
    const requestParams: GroupListParams = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10
    }

    // 只在有值时添加可选参数
    if (params.keyword) {
      requestParams.keyword = params.keyword
    }

    if (params.bot_id) {
      requestParams.bot_id = params.bot_id
    }

    if (params.date_range && params.date_range.length === 2) {
      // 将日期字符串转换为 Unix 时间戳（秒）
      // 开始时间：当天 00:00:00
      const startDate = new Date(`${params.date_range[0]} 00:00:00`)
      requestParams.start_time = Math.floor(startDate.getTime() / 1000).toString()

      // 结束时间：当天 23:59:59
      const endDate = new Date(`${params.date_range[1]} 23:59:59`)
      requestParams.end_time = Math.floor(endDate.getTime() / 1000).toString()
    }

    if (params.order) {
      requestParams.order = params.order
    }

    const response = await getGroupList(requestParams)

    if (response.code === '000000' && response.data) {
      return {
        list: response.data.list || [],
        total: response.data.pager?.total || 0
      }
    } else {
      ElMessage.error((response as any).msg || '获取群组列表失败')
      return { list: [], total: 0 }
    }
  } catch (error) {
    console.error('获取群组列表失败:', error)
    ElMessage.error('获取群组列表失败')
    return { list: [], total: 0 }
  }
}

const handleViewDetail = (row: any) => {
  ElMessage.info(`发送消息到群组: ${row.group_name}`)
}

// 组件挂载时获取机器人列表
onMounted(() => {
  fetchBotList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
