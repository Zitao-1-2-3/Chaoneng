<template>
  <Dialog v-model="dialogVisible" title="群发记录">
    <SearchTable
      :columns="tableColumns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchMassSendRecords"
      ref="searchTableRef"
      :default-params="defaultParams"
      :show-add-button="false"
    >
      <!-- 不需要添加按钮，可以根据需要添加其他工具栏内容 -->
      <template #searchButtons>
        <!-- 可以在这里添加额外按钮 -->
      </template>
    </SearchTable>
    <!-- 修改后的详情弹窗 -->
    <Dialog v-model="detailDialogVisible" title="群发详情" append-to-body width="600px">
      <div v-if="currentRecord && Object.keys(currentRecord).length > 0">
        <h3 class="text-lg font-semibold mb-2">内容详情</h3>

        <div class="mb-4">
          <p class="font-medium">接收用户:</p>
          <div class="pl-4 text-sm">
            <span v-if="currentRecord.ReceiveType === 'user_custom'">
              {{ currentRecord.tg_user_ids || '未指定用户' }}
            </span>
            <span v-else-if="currentRecord.ReceiveType === 'all_user'">全部用户</span>
            <span v-else>所有用户 (类型: {{ currentRecord.ReceiveType }})</span>
          </div>
        </div>

        <ElDivider content-position="center">预览效果</ElDivider>

        <div class="preview-container bg-gray-100 p-4 rounded-md mx-auto max-w-md">
          <div class="telegram-message-bubble bg-white p-3 rounded-lg shadow">
            <!-- 图片预览 -->
            <div v-if="currentRecord.image" class="mb-2 image-preview-container">
              <ElImage
                :src="currentRecord.image"
                alt="消息图片"
                fit="contain"
                class="max-w-full h-auto max-h-60px rounded"
                :preview-src-list="[currentRecord.image]"
              />
            </div>
            <!-- 消息内容 -->
            <p class="text-sm whitespace-pre-wrap">{{ currentRecord.content }}</p>
          </div>

          <!-- 内联按钮预览 -->
          <div
            v-if="currentRecord.keyboards && currentRecord.keyboards.length > 0"
            class="mt-2 inline-buttons-preview"
          >
            <div
              v-for="(button, index) in currentRecord.keyboards"
              :key="index"
              class="keyboard-button-wrapper p-1"
            >
              <ElButton class="w-full text-sm" disabled>
                {{ button.text }}
              </ElButton>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        <p>暂无详情数据。</p>
      </div>
      <template #footer>
        <ElButton @click="detailDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, defineProps, defineEmits, defineExpose } from 'vue'
import { ElTag, ElDivider, ElImage, ElMessage, ElMessageBox, ElButton } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import { SearchTable } from '@/components/SearchTable'
import type { DescriptionsSchema } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getMassSendRecordsApi,
  getMassSendRecordDetailApi,
  deleteMassSendRecordApi,
  resendMassSendRecordApi
} from '@/api/tgUser'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  botList: {
    type: Array as () => Array<{ label: string; value: number | string }>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 机器人选项
const botOptions = computed<Array<{ label: string; value: number | string }>>(() => props.botList)

// SearchTable引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 默认查询参数
const defaultParams = reactive({
  bot_id: undefined,
  date_range: []
})

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    component: 'Select',
    label: '机器人',
    colProps: { span: 6 },
    componentProps: {
      options: botOptions.value,
      placeholder: '请选择机器人',
      clearable: true
    }
  }
])

// 表格列配置
const tableColumns: TableColumn[] = [
  {
    field: 'tg_bot_id',
    label: '机器人ID',
    width: 120
  },
  {
    field: 'bot_name',
    label: '机器人用户名',
    width: 150
  },
  {
    field: 'status',
    label: '发送状态',
    width: 100,
    formatter: (row) => (row.status == 1 ? '发送中' : '已完成')
  },
  {
    field: 'Percent',
    label: '进度',
    width: 80,
    formatter: (row) => `${row.Percent === undefined ? 'N/A' : row.Percent + '%'}`
  },
  {
    field: 'ok_num',
    label: '发送成功',
    width: 100,
    formatter: (row) => `${row.ok_num === undefined ? 'N/A' : row.ok_num + '个用户'}`
  },
  {
    field: 'fail_num',
    label: '发送失败',
    width: 100,
    formatter: (row) => `${row.fail_num === undefined ? 'N/A' : row.fail_num + '个用户'}`
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'action',
    label: '操作',
    fixed: 'right',
    slots: {
      default: ({ row }: { row: any }) => {
        return (
          <div class="flex items-center">
            <BaseButton type="primary" onClick={() => viewDetail(row)}>
              查看详情
            </BaseButton>
            <BaseButton type="warning" class="ml-2" onClick={() => handleResend(row)}>
              再发一次
            </BaseButton>
            <BaseButton type="danger" class="ml-2" onClick={() => handleDelete(row)}>
              删除
            </BaseButton>
          </div>
        )
      }
    }
  }
]

// 详情相关
const detailDialogVisible = ref(false)
const currentRecord = ref<Record<string, any>>({})

// API封装 - 获取群发记录
const fetchMassSendRecords = async (params: any) => {
  try {
    const queryParams: any = {
      bot_id: params.bot_id,
      page_size: params.pageSize || 10,
      current_page: params.currentPage || 1
    }
    if (params.date_range && params.date_range.length === 2) {
      queryParams.start_date = params.date_range[0]
      queryParams.end_date = params.date_range[1]
    }

    const response = await getMassSendRecordsApi(queryParams)
    // Ensure the list data (response.data.list) contains all necessary fields for detail view:
    // content, keyboards, ReceiveType, tg_user_ids, image, etc.
    return {
      list: response.data.list || [],
      total: response.data.total || 0
    }
  } catch (error) {
    console.error('获取群发记录失败:', error)
    ElMessage.error('获取记录失败')
    return { list: [], total: 0 }
  }
}

// 查看详情 - 修改为直接使用 row 数据
const viewDetail = async (row: any) => {
  if (row && typeof row === 'object') {
    currentRecord.value = { ...row } // Create a shallow copy to avoid potential reactivity issues with the original row
    detailDialogVisible.value = true
  } else {
    ElMessage.error('无法加载详情：数据无效。')
    currentRecord.value = {} // Reset on error or invalid data
  }
}

// 再发一次 处理函数
const handleResend = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要再次发送这条群发消息吗？ (记录ID: ${row.id})`, '确认重发', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await resendMassSendRecordApi(row.id)
    ElMessage.success('消息已成功再次发送！')
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('再次发送消息失败:', error)
      const errorMsg =
        (error as any)?.response?.data?.msg ||
        (error as Error)?.message ||
        '再次发送消息失败，请重试。'
      ElMessage.error(errorMsg)
    } else {
      ElMessage.info('操作已取消')
    }
  }
}

// 删除 处理函数
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条群发记录吗？ (记录ID: ${row.id})<br/><strong>此操作不可恢复。</strong>`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        dangerouslyUseHTMLString: true
      }
    )

    await deleteMassSendRecordApi(row.id)
    ElMessage.success('群发记录已删除！')
    searchTableRef.value?.reload()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除群发记录失败:', error)
      const errorMsg =
        (error as any)?.response?.data?.msg || (Error as any)?.message || '删除失败，请重试。'
      ElMessage.error(errorMsg)
    } else {
      ElMessage.info('操作已取消')
    }
  }
}

// 打开弹窗方法
const open = () => {
  dialogVisible.value = true
  setTimeout(() => {
    searchTableRef.value?.reload()
  }, 0)
}

// 暴露方法给父组件
defineExpose({
  open
})
</script>

<style scoped>
.preview-container {
  /* Styles for the main preview area if needed */
}

.telegram-message-bubble {
  /* Styles for the message bubble itself */
  word-break: break-word;
}

.image-preview-container .el-image {
  max-height: 200px; /* Increased max-height for image */
  border-radius: 6px;
}

.inline-buttons-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Responsive grid for buttons */
  gap: 8px; /* Gap between buttons */
}

.keyboard-button-wrapper {
  /* Wrapper for each button if needed for layout */
}

.keyboard-button-wrapper .el-button {
  width: 100%; /* Make buttons take full width of their grid cell */
}
</style>
