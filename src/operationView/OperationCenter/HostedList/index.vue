<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotOptionsLoaded"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchAutoManageList"
        :action-column="actionColumn"
        :fetch-del-api="deleteAddressAction"
        :show-add-button="false"
        ref="searchTableRef"
        @search="onSearch"
      />
      <div v-else> 机器人列表加载中... </div>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import {
  v2GetHostingList,
  v2RemoveHosting,
  v2GetAgentBotList,
  v2RecycleOrder
} from '@/api/trust_transaction'
import type {
  AutoManageAddressItem,
  BotOption,
  HostingListParamsV2,
  V2AgentBotListParams
} from '@/api/trust_transaction/types'
import { formatToDateTime } from '@/utils/dateUtil'

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<AutoManageAddressItem | null>(null)

const botOptions = ref<BotOption[]>([])
const isBotOptionsLoaded = ref(false)

const fetchBotOptions = async () => {
  try {
    const queryParams: V2AgentBotListParams = {
      page_size: 1000,
      current_page: 1
    }

    console.log('[fetchBotOptions] 调用新接口 v2GetAgentBotList, 参数:', queryParams)

    const res = await v2GetAgentBotList(queryParams)
    if (res.code === '000000' && res.data) {
      const bots = (res.data.list || []).map((bot: any) => {
        return {
          label: `${bot.user_name} (${bot.first_name})`,
          value: bot.id
        }
      })
      botOptions.value = [{ label: '全部', value: '' }, ...bots]
      isBotOptionsLoaded.value = true

      console.log('[fetchBotOptions] 机器人列表加载成功, 数量:', bots.length)
    }
  } catch (error) {
    console.error('获取机器人选项失败:', error)
    ElMessage.error('获取机器人选项失败')
    botOptions.value = [{ label: '全部', value: '' }]
    isBotOptionsLoaded.value = true
  }
}

onMounted(() => {
  fetchBotOptions()
})

const columns: TableColumn[] = [
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 120
  },
  {
    field: 'bot_name',
    label: '机器人用户名',
    width: 150,
    formatter: (row: AutoManageAddressItem) => row.bot_name || '-'
  },
  {
    field: 'user_name',
    label: '用户名',
    width: 150,
    formatter: (row: AutoManageAddressItem) => row.user_name || '-'
  },
  {
    field: 'address',
    label: '托管地址',
    minWidth: 250
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row: AutoManageAddressItem) => formatToDateTime(row.create_time)
  },
  {
    field: 'finish_time',
    label: '更新时间',
    width: 180,
    formatter: (row: AutoManageAddressItem) =>
      row.finish_time ? formatToDateTime(row.finish_time) : '-'
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  fixed: 'right',
  slots: {
    default: (data: { row: AutoManageAddressItem }) => {
      return (
        <div style="display: flex; gap: 8px;">
          <BaseButton type="primary" onClick={() => handleRecycleAndReset(data.row)}>
            回收与重置
          </BaseButton>
          <BaseButton type="danger" onClick={() => handleDeleteConfirmation(data.row)}>
            取消托管
          </BaseButton>
        </div>
      )
    }
  }
}

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    label: '机器人',
    component: 'Select',
    componentProps: {
      placeholder: '请选择机器人',
      options: botOptions.value,
      clearable: true,
      filterable: true
    }
  },
  {
    field: 'keyword',
    label: '关键字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入托管地址/用户名'
    }
  }
])

const fetchAutoManageList = async (params: any) => {
  try {
    const queryParams: HostingListParamsV2 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 只有当 bot_id 有值时才添加参数
    if (params.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }

    // 只有当 keyword 有值时才添加参数
    if (params.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim()
    }

    console.log('[fetchAutoManageList] 调用新接口 v2GetHostingList, 参数:', queryParams)

    // 使用新接口 v2GetHostingList
    const res = await v2GetHostingList(queryParams)

    if (res.code === '000000' && res.data) {
      const mappedList = (res.data.list || []).map((item: any): AutoManageAddressItem => {
        return {
          id: item.id,
          tg_bot_id: item.bot_id,
          bot_id: item.bot_id,
          address: item.address,
          create_time: item.created_at,
          finish_time: item.updated_at,
          bot_name: item.bot_name,
          user_name: item.user_name,
          tg_name: item.user_name,
          order_id: item.order_id
        }
      })

      console.log('[fetchAutoManageList] 返回数据:', {
        total: res.data.pager?.total,
        count: mappedList.length
      })

      return {
        list: mappedList,
        total: res.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取托管地址列表失败:', error)
    ElMessage.error('获取托管地址列表失败')
    return { list: [], total: 0 }
  }
}

const deleteAddressAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.address) {
    try {
      console.log(
        '[deleteAddressAction] 调用新接口 v2RemoveHosting, 地址:',
        currentRowForDelete.value.address
      )

      // 使用新接口 v2RemoveHosting
      await v2RemoveHosting({ address: currentRowForDelete.value.address })
      ElMessage.success('取消托管成功')
      return true
    } catch (error) {
      console.error('取消托管失败:', error)
      ElMessage.error('取消托管失败')
      return false
    }
  }
  return false
}

const handleDeleteConfirmation = (row: AutoManageAddressItem) => {
  currentRowForDelete.value = row
  if (searchTableRef.value) {
    searchTableRef.value.delete(row)
  } else {
    console.warn('SearchTable ref is not available.')
  }
}

const handleRecycleAndReset = async (row: AutoManageAddressItem) => {
  if (!row.order_id) {
    ElMessage.warning('订单号不存在，无法执行回收与重置操作')
    return
  }

  try {
    console.log('[handleRecycleAndReset] 调用新接口 v2RecycleOrder, 订单号:', row.order_id)

    // 使用新接口 v2RecycleOrder
    const res = await v2RecycleOrder({ order_id: row.order_id })

    if (res.code === '000000') {
      ElMessage.success('回收与重置成功')
      // 刷新列表
      if (searchTableRef.value) {
        searchTableRef.value.reload()
      }
    } else {
      ElMessage.error((res as any).msg || '回收与重置失败')
    }
  } catch (error) {
    console.error('回收与重置失败:', error)
    ElMessage.error('回收与重置失败')
  }
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
