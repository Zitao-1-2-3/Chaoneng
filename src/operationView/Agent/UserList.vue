<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        v-if="isBotListLoaded"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchAccountList"
        :showAddButton="false"
        ref="searchTableRef"
        @ready="onSearchTableReady"
      >
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
import { ref, onMounted, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElMessage, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { FormSchema } from '@/components/Form'
import type { TableColumn } from '@/components/Table'
import { v2GetUserList, v2ExportUserList } from '@/api/agent/user_list'
import { getAgentBotListApi } from '@/api/agent/bot'
import { useRoute, useRouter } from 'vue-router'
import { downloadByData } from '@/utils/download'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const route = useRoute()
const router = useRouter()

// 机器人下拉options，全部string类型
const isBotListLoaded = ref(false)
const botOptions = ref<{ label: string; value: string }[]>([{ label: '全部', value: '' }])
const botMap = ref<Map<number, any>>(new Map()) // 机器人ID到机器人信息的映射

// 获取机器人列表（使用运营端的机器人列表接口）
const fetchBotList = async () => {
  isBotListLoaded.value = false
  try {
    const res = await getAgentBotListApi({
      current_page: 1,
      page_size: 1000
    })

    // 建立机器人映射
    const bots = (res.data.list || []).map((bot: any) => {
      // 存储到映射中
      botMap.value.set(bot.id, bot)

      return {
        label: `${bot.user_name} (${bot.first_name})`,
        value: String(bot.id)
      }
    })

    botOptions.value = [{ label: '全部', value: '' }, ...bots]
    isBotListLoaded.value = true

    console.log('[fetchBotList] 机器人列表加载成功, 数量:', bots.length)
  } catch (error) {
    handleErrorMessage(error, '获取机器人列表失败')
    isBotListLoaded.value = true
  }
}

// 表格字段
const columns: TableColumn[] = [
  {
    field: 'tg_id',
    label: 'TG用户ID',
    width: 120
  },
  {
    field: 'nickname',
    label: 'TG用户昵称'
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    type: 'link',
    url: (row) => `https://t.me/${row.tg_name}`
  },
  {
    field: 'tg_bot_id',
    label: '机器人ID',
    slots: {
      default: ({ row }: any) => {
        return (
          <ElLink type="primary" onClick={() => openBotList(row.bot_info.tg_bot_id)}>
            {row.tg_bot_id}
          </ElLink>
        )
      }
    }
  },
  {
    field: 'bot_info.bot_name',
    label: '机器人用户名'
  },
  {
    field: 'user_name',
    label: '代理名称'
  },
  {
    field: 'trx_mount',
    label: 'TRX余额',
    sortable: 'custom',
    formatter: (row) => `${row.trx_mount || 0} TRX`
  },
  {
    field: 'usdt_mount',
    sortable: 'custom',
    label: 'USDT余额',
    hidden: true,
    formatter: (row) => `${row.usdt_mount || 0} USDT`
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    sortable: 'custom',
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'update_time',
    label: '更新时间',
    width: 180,
    sortable: 'custom',
    formatter: (row) => (row.update_time ? formatToDateTime(row.update_time * 1000) : '-')
  }
]

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    component: 'Select' as const,
    label: '机器人',
    componentProps: {
      options: botOptions.value,
      placeholder: '请选择机器人',
      valueKey: 'value',
      labelKey: 'label'
    }
  },
  {
    field: 'query',
    component: 'Input' as const,
    label: '关键词',
    componentProps: {
      placeholder: '请输入用户名/昵称'
    }
  },
  {
    field: 'dateRange',
    component: 'DatePicker' as const,
    label: '创建时间',
    componentProps: {
      type: 'datetimerange',
      valueFormat: 'x',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期'
    }
  }
])

// API 封装 - 获取账户信息（用 operationView/Agent 的接口）
const fetchAccountList = async (params: any) => {
  try {
    // 映射参数字段
    const adaptedParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.query) adaptedParams.keyword = params.query // query → keyword
    if (params?.bot_id) adaptedParams.bot_id = Number(params.bot_id)

    // 处理排序参数 - 需要映射字段名
    if (params?.order) {
      // 字段名映射：前端 → 后端
      const fieldMap: Record<string, string> = {
        trx_mount: 'trx_balance', // TRX余额
        usdt_mount: 'usdt_balance', // USDT余额
        create_time: 'created_at', // 创建时间
        update_time: 'updated_at' // 更新时间
      }

      // 解析排序参数，格式：'field_name ASC' 或 'field_name DESC'
      const [field, direction] = params.order.split(' ')
      const mappedField = fieldMap[field] || field
      adaptedParams.order = `${mappedField} ${direction}`
    }

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      adaptedParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      adaptedParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('[fetchAccountList] 调用新接口 v2GetUserList, 参数:', adaptedParams)

    // 使用新接口 v2GetUserList
    const response = await v2GetUserList(adaptedParams)

    // 映射返回数据字段
    const list = (response.data?.list || []).map((item: any) => {
      // 从机器人映射中获取机器人信息
      const botInfo = botMap.value.get(item.bot_id)

      return {
        id: item.id,
        tg_id: item.tg_user_id, // tg_user_id → tg_id
        tg_bot_id: item.bot_id, // bot_id → tg_bot_id
        nickname: item.tg_first_name, // tg_first_name → nickname
        tg_name: item.tg_user_name, // tg_user_name → tg_name
        trx_mount: item.trx_balance, // trx_balance → trx_mount
        usdt_mount: item.usdt_balance, // usdt_balance → usdt_mount
        create_time: item.created_at, // created_at（秒）→ create_time（秒，formatter中会转毫秒）
        update_time: item.updated_at, // updated_at（秒）→ update_time（秒，formatter中会转毫秒）
        bot_info: {
          tg_bot_id: item.bot_id,
          bot_name: botInfo?.user_name || '' // 从机器人映射中获取机器人用户名
        },
        user_name: botInfo?.agent_name || '' // 从机器人映射中获取代理名称
      }
    })

    console.log('[fetchAccountList] 返回数据:', {
      total: response.data?.pager?.total,
      count: list.length
    })

    // 添加数据为空提示
    const hasSearchCondition = !!(params?.query || params?.bot_id || params?.dateRange)
    handleListMessage(list, hasSearchCondition, '用户')

    return {
      list,
      total: response.data?.pager?.total || 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return { list: [], total: 0 }
  }
}

const searchTableRef = ref()

const openBotList = (botId: number) => {
  router.push({
    path: '/agent/bot_list',
    query: {
      bot_id: botId
    }
  })
}

function onSearchTableReady(instance) {
  instance.reload()
}

// 处理导出
const handleExport = async () => {
  try {
    const params = await searchTableRef.value?.searchMethods.getFormData()

    // 映射导出参数
    const exportParams: any = {
      current_page: params?.current_page || 1,
      page_size: params?.page_size || 10
    }

    if (params?.query) exportParams.keyword = params.query
    if (params?.bot_id) exportParams.bot_id = Number(params.bot_id)

    // 处理时间范围 - 转换为 Unix 时间戳（秒级）
    if (params?.dateRange && params.dateRange.length === 2) {
      exportParams.start_time = Math.floor(new Date(params.dateRange[0]).getTime() / 1000)
      exportParams.end_time = Math.floor(new Date(params.dateRange[1]).getTime() / 1000)
    }

    console.log('[handleExport] 调用新接口 v2ExportUserList, 参数:', exportParams)

    // 使用新接口 v2ExportUserList
    const res = await v2ExportUserList(exportParams)

    if (res.data instanceof Blob) {
      downloadByData(res.data, '机器人用户列表.xlsx')
      handleSuccessMessage('用户列表导出成功')
    } else {
      ElMessage.error('文件数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '用户列表导出失败')
  }
}

onMounted(async () => {
  await fetchBotList()
  const query = route.query
  if (query.bot_id) {
    const botId = botOptions.value.find((opt) => opt.value === String(query.bot_id))?.value
    if (botId !== undefined) {
      searchTableRef.value?.setSearchParams({ bot_id: botId })
      searchTableRef.value?.reload()
    }
  } else if (query.tg_id) {
    searchTableRef.value?.setSearchParams({ tg_id: String(query.tg_id) })
    searchTableRef.value?.reload()
  }
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
