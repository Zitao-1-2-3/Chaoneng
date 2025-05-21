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
import { ref, computed, onMounted, h } from 'vue'
import { ElButton, ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { getAutoManageAddressListApi, deleteAutoManageAddressApi } from '@/api/hosted_list'
import { getBotListApi } from '@/api/botlist'
import type {
  AutoManageAddressItem,
  AutoManageAddressListParams,
  BotOption
} from '@/api/hosted_list/types'
import { formatToDateTime } from '@/utils/dateUtil'

const { t } = useI18n()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<AutoManageAddressItem | null>(null)

const botOptions = ref<BotOption[]>([])
const isBotOptionsLoaded = ref(false)

const fetchBotOptions = async () => {
  try {
    const res = await getBotListApi({})
    if (!res || !res.data || !Array.isArray(res.data.list)) {
      console.error('Invalid bot list data structure:', res)
      botOptions.value = [{ label: '全部', value: '' }]
      isBotOptionsLoaded.value = true
      return
    }
    const bots = (res.data.list || []).map((bot: any) => {
      const botId = bot.id || bot.tg_bot_id
      const botLabel = `${bot.name || '未知名称'} (${bot.firstname || botId})`
      return {
        label: botLabel,
        value: botId
      }
    })
    botOptions.value = [{ label: '全部', value: '' }, ...bots.filter((b) => b.value !== undefined)]
    isBotOptionsLoaded.value = true
  } catch (error) {
    console.error('获取机器人选项失败:', error)
    botOptions.value = [{ label: '全部', value: '' }]
    isBotOptionsLoaded.value = true
  }
}

onMounted(() => {
  fetchBotOptions()
})

const columns: TableColumn[] = [
  {
    field: 'tg_bot_id',
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
    field: 'tg_name',
    label: '用户名',
    width: 150,
    formatter: (row: AutoManageAddressItem) => row.tg_name || '-'
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
  width: 120,
  fixed: 'right',
  slots: {
    default: (data: { row: AutoManageAddressItem }) => {
      return (
        <BaseButton type="danger" onClick={() => handleDeleteConfirmation(data.row)}>
          取消托管
        </BaseButton>
      )
    }
  }
}

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'tg_bot_id',
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
    field: 'query',
    label: '关键字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入托管地址/用户名'
    }
  }
])

const fetchAutoManageList = async (params: AutoManageAddressListParams) => {
  try {
    const queryParams: AutoManageAddressListParams = {
      ...params,
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10,
      tg_bot_id: params.tg_bot_id === '' ? undefined : params.tg_bot_id,
      address: params.address || undefined
    }
    const res = await getAutoManageAddressListApi(queryParams)
    const mappedList = (res.data.list || []).map((item: any): AutoManageAddressItem => {
      const createTimeMs =
        typeof item.create_time === 'number' ? item.create_time * 1000 : item.create_time
      const finishTimeMs =
        typeof item.finish_time === 'number' && item.finish_time > 0
          ? item.finish_time * 1000
          : undefined
      return {
        ...item,
        create_time: createTimeMs,
        finish_time: finishTimeMs,
        bot_name: item.bot_name || `Bot ${item.tg_bot_id}`
      }
    })
    return {
      list: mappedList,
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取托管地址列表失败:', error)
    ElMessage.error('获取托管地址列表失败')
    return { list: [], total: 0 }
  }
}

const deleteAddressAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.id) {
    try {
      await deleteAutoManageAddressApi(currentRowForDelete.value.id)
      ElMessage.success('取消托管成功')
      return true
    } catch (error) {
      console.error('取消托管失败:', error)
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

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}
</script>

<style scoped>
.app-container {
  padding: 15px;
}
</style>
