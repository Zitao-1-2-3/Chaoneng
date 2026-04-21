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
import { v1GetHostingList, v1RemoveHosting } from '@/api/hosted_list'
import { v1GetBotList } from '@/api/botlist'
import type { AutoManageAddressItem, BotOption, HostingListParamsV1 } from '@/api/hosted_list/types'
import { formatToDateTime } from '@/utils/dateUtil'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const currentRowForDelete = ref<AutoManageAddressItem | null>(null)

// 当前选择的来源
const selectedSource = ref<number | string>('')

const botOptions = ref<BotOption[]>([])
const isBotOptionsLoaded = ref(false)

const fetchBotOptions = async () => {
  try {
    const res = await v1GetBotList({ page_size: 1000, current_page: 1 })
    if (res.code === '000000' && res.data) {
      const bots = (res.data.list || []).map((bot: any) => {
        return {
          label: `${bot.user_name} (${bot.first_name})`,
          value: bot.id
        }
      })
      botOptions.value = [{ label: '全部', value: '' }, ...bots]
      isBotOptionsLoaded.value = true
    }
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    botOptions.value = [{ label: '全部', value: '' }]
    isBotOptionsLoaded.value = true
  }
}

onMounted(() => {
  fetchBotOptions()
})

const columns = computed<TableColumn[]>(() => {
  const allCols: any[] = [
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
      label: 'TG用户名',
      width: 150,
      hideWhen: 2, // 来源为 H5(2) 时隐藏
      formatter: (row: AutoManageAddressItem) => row.user_name || '-'
    },
    {
      field: 'user_account',
      label: '用户账号',
      width: 150,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row: any) => row.user_account || '-'
    },
    {
      field: 'user_email',
      label: '用户邮箱',
      minWidth: 180,
      hideWhen: 1, // 来源为机器人(1)时隐藏
      formatter: (row: any) => row.user_email || '-'
    },
    {
      field: 'source',
      label: '来源',
      width: 100,
      formatter: (row: any) => {
        return row.origin === 1 ? '机器人' : row.origin === 2 ? 'H5' : '-'
      }
    },
    {
      field: 'address',
      label: '托管地址',
      minWidth: 250
    },
    {
      field: 'create_time',
      label: '创建时间',
      sortable: 'custom',
      width: 180,
      formatter: (row: AutoManageAddressItem) => formatToDateTime(row.create_time)
    },
    {
      field: 'finish_time',
      label: '更新时间',
      sortable: 'custom',
      width: 180,
      formatter: (row: AutoManageAddressItem) =>
        row.finish_time ? formatToDateTime(row.finish_time) : '-'
    }
  ]

  // 根据来源过滤列
  const filteredCols = allCols.filter((col) => {
    if (!col.hideWhen) return true
    return selectedSource.value !== col.hideWhen
  })

  console.log(
    '[托管列表 columns] 过滤后的列数:',
    filteredCols.length,
    '来源:',
    selectedSource.value
  )

  return filteredCols
})

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
    field: 'origin',
    label: '来源',
    component: 'Select',
    componentProps: {
      placeholder: '请选择来源',
      options: [
        { label: '全部', value: '' },
        { label: 'H5', value: 2 },
        { label: '机器人', value: 1 }
      ],
      clearable: true
    }
  },
  {
    field: 'keyword',
    label: {
      text: '关键字',
      tips: '支持托管地址/TG用户名/用户账号/用户邮箱查询'
    },
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键字搜索'
    }
  }
])

const fetchAutoManageList = async (params: any) => {
  try {
    // 更新选中的来源，用于控制列的显示/隐藏
    selectedSource.value = params.origin || ''
    console.log(
      '[fetchAutoManageList] selectedSource:',
      selectedSource.value,
      'params.origin:',
      params.origin
    )

    const queryParams: HostingListParamsV1 = {
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

    // 添加来源参数
    if (params.origin !== undefined && params.origin !== '') {
      queryParams.origin = Number(params.origin)
    }

    // 处理排序参数 - 字段名映射
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at',
        finish_time: 'updated_at'
      }

      // 解析排序参数，格式：column ASC 或 column DESC
      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        queryParams.order = `${mappedField} ${direction}`
      }
    }

    // 使用新接口 v1GetHostingList
    const res = await v1GetHostingList(queryParams)

    if (res.code === '000000' && res.data) {
      const mappedList = (res.data.list || []).map((item: any): AutoManageAddressItem => {
        return {
          id: item.id,
          tg_bot_id: item.bot_id,
          bot_id: item.bot_id,
          address: item.address,
          create_time: item.created_at * 1000, // Unix时间戳（秒）转毫秒
          finish_time: item.updated_at * 1000, // Unix时间戳（秒）转毫秒
          bot_name: item.bot_name,
          user_name: item.user_name,
          tg_name: item.user_name,
          order_id: item.order_id,
          user_account: item.username || '-',
          user_email: item.email || '-',
          origin: item.origin
        }
      })

      return {
        list: mappedList,
        total: res.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
  } catch (error) {
    handleErrorMessage(error, '获取托管列表失败')
    return { list: [], total: 0 }
  }
}

const deleteAddressAction = async () => {
  if (currentRowForDelete.value && currentRowForDelete.value.address) {
    try {
      // 使用新接口 v1RemoveHosting
      await v1RemoveHosting({ address: currentRowForDelete.value.address })
      ElMessage.success('取消托管成功')
      handleSuccessMessage('取消托管成功')
      return true
    } catch (error) {
      handleErrorMessage(error, '取消托管失败')
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
