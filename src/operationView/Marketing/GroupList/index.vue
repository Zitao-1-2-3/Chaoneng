<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchGroupList"
        :show-add-button="false"
        :action-column="actionColumn"
      >
        <template #leftToolbar>
          <BaseButton type="success" @click="handleMassSend">
            <Icon icon="ep:promotion" class="mr-5px" />
            发送消息
          </BaseButton>
          <BaseButton type="warning" @click="handleViewMassSendRecord" class="ml-2">
            <Icon icon="ep:document" class="mr-5px" />
            消息记录
          </BaseButton>
        </template>
      </SearchTable>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref } from 'vue'
import { ElTag, ElSwitch, ElLink, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { getGroupList, updateGroupStatus } from '@/api/group'
import type { GroupListParams } from '@/api/group/types'

const searchTableRef = ref()

// 搜索表单配置
const searchSchema: FormSchema[] = [
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
    field: 'bot_type',
    component: 'Select',
    label: '机器人',
    componentProps: {
      options: [
        { label: '全部', value: undefined }
        // TODO: 动态加载机器人列表
      ],
      placeholder: '请选择机器人'
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
]

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'group_id',
    label: '群组ID',
    width: 150
  },
  {
    field: 'group_name',
    label: '群组名称',
    minWidth: 180
  },
  {
    field: 'bot_username',
    label: '机器人用户名',
    width: 150,
    slots: {
      default: (data: any) => {
        const username = data.row.bot_username
        return (
          <ElLink type="primary" onClick={() => window.open(`https://t.me/${username}`, '_blank')}>
            {username}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'bot_aid',
    label: '机器人ID',
    width: 120
  },
  {
    field: 'bot_nickname',
    label: '机器人昵称',
    width: 150
  },
  {
    field: 'member_count',
    label: '群人数',
    width: 100,
    slots: {
      default: (data: any) => {
        return (
          <ElTag type="info" size="small">
            {data.row.member_count}
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
    field: 'status',
    label: '状态',
    width: 100,
    slots: {
      default: (data: any) => {
        return (
          <ElSwitch
            v-model={data.row.status}
            activeValue={1}
            inactiveValue={2}
            onChange={() => handleStatusChange(data.row)}
          />
        )
      }
    }
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row: any) => formatToDateTime(row.created_at)
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

// 获取群组列表
const fetchGroupList = async (params: any) => {
  try {
    const requestParams: GroupListParams = {
      current_page: params.current_page || 1,
      page_size: params.page_size || 10,
      keyword: params.keyword,
      bot_type: params.bot_type,
      start_time: params.date_range?.[0],
      end_time: params.date_range?.[1]
    }

    const response = await getGroupList(requestParams)

    if (response.code === 0 && response.data) {
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

// 状态切换
const handleStatusChange = async (row: any) => {
  try {
    const response = await updateGroupStatus({
      id: row.id,
      status: row.status
    })

    if (response.code === 0) {
      ElMessage.success('状态更新成功')
    } else {
      ElMessage.error((response as any).msg || '状态更新失败')
      // 恢复原状态
      row.status = row.status === 1 ? 2 : 1
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.status = row.status === 1 ? 2 : 1
  }
}

// 查看详情/发送消息
const handleViewDetail = (row: any) => {
  ElMessage.info(`发送消息到群组: ${row.group_name}`)
  // TODO: 打开发送消息弹窗
}

// 群发消息
const handleMassSend = () => {
  ElMessage.info('打开群发消息弹窗')
  // TODO: 打开群发消息弹窗
}

// 查看群发记录
const handleViewMassSendRecord = () => {
  ElMessage.info('打开群发记录弹窗')
  // TODO: 打开群发记录弹窗
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
