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
    <!-- 详情弹窗 -->
    <Dialog v-model="detailDialogVisible" title="群发详情" append-to-body width="700px">
      <div v-if="currentRecord && Object.keys(currentRecord).length > 0" class="detail-content">
        <!-- 基本信息 -->
        <div class="info-section mb-4">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">机器人:</span>
              <span class="info-value">{{ currentRecord.bot_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">发送状态:</span>
              <span class="info-value">
                <ElTag :type="currentRecord.status === 1 ? 'warning' : 'success'">
                  {{ currentRecord.status === 1 ? '发送中' : '已完成' }}
                </ElTag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">进度:</span>
              <span class="info-value">{{ currentRecord.Percent || 0 }}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">成功数:</span>
              <span class="info-value text-green-600">{{ currentRecord.ok_num || 0 }} 个用户</span>
            </div>
            <div class="info-item">
              <span class="info-label">失败数:</span>
              <span class="info-value text-red-600">{{ currentRecord.fail_num || 0 }} 个用户</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间:</span>
              <span class="info-value">{{ formatTime(currentRecord.create_time) }}</span>
            </div>
          </div>
        </div>

        <!-- 接收用户信息 -->
        <div class="info-section mb-4">
          <h3 class="section-title">接收用户</h3>
          <div class="pl-4">
            <template v-if="currentRecord.ReceiveType === 'user_custom'">
              <p class="text-sm text-gray-600 mb-2">
                指定用户 ({{ getUserCount(currentRecord.tg_user_ids) }} 个)
              </p>
              <div class="user-ids-display">
                {{ formatUserIds(currentRecord.tg_user_ids) }}
              </div>
            </template>
            <template v-else-if="currentRecord.ReceiveType === 'all_user'">
              <p class="text-sm">
                <ElTag type="info">全部用户</ElTag>
              </p>
            </template>
            <template v-else>
              <p class="text-sm text-gray-500">
                所有用户 (类型: {{ currentRecord.ReceiveType }})
              </p>
            </template>
          </div>
        </div>

        <ElDivider content-position="center">消息预览</ElDivider>

        <!-- 消息预览 -->
        <div class="preview-container bg-gray-100 p-4 rounded-md mx-auto max-w-md">
          <div class="telegram-message-bubble bg-white p-3 rounded-lg shadow">
            <!-- 图片/视频预览 -->
            <div
              v-if="currentRecord.image || currentRecord.file_url"
              class="mb-2 media-preview-container"
            >
              <template v-if="isVideoFile(currentRecord.image || currentRecord.file_url)">
                <div class="video-wrapper">
                  <video
                    v-if="detailDialogVisible"
                    ref="videoPlayerRef"
                    class="video-js vjs-default-skin vjs-big-play-centered"
                    controls
                    preload="auto"
                    :poster="currentRecord.video_thumbnail || currentRecord.thumbnail"
                  >
                    <p class="vjs-no-js"> 您的浏览器不支持视频播放，请升级浏览器。 </p>
                  </video>
                </div>
              </template>
              <template v-else>
                <ElImage
                  :src="currentRecord.image || currentRecord.file_url"
                  alt="消息图片"
                  fit="contain"
                  class="max-w-full h-auto rounded"
                  :preview-src-list="[currentRecord.image || currentRecord.file_url]"
                />
              </template>
            </div>

            <!-- 消息内容 -->
            <p v-if="currentRecord.content" class="text-sm whitespace-pre-wrap">
              {{ currentRecord.content }}
            </p>
            <p v-else class="text-sm text-gray-400 italic">无文字内容</p>
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
                {{ getButtonText(button) }}
              </ElButton>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-8">
        <p>暂无详情数据</p>
      </div>
      <template #footer>
        <ElButton @click="detailDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { ElDivider, ElImage, ElMessage, ElMessageBox, ElButton, ElTag } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { v1GetMassSendList, v1DeleteMassSend, v1SendGroupMessage } from '@/api/tgUser'
import type { MassSendListParamsV1 } from '@/api/tgUser/types'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

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

// 机器人信息映射表
const botInfoMap = computed(() => {
  const map = new Map<number, string>()
  props.botList.forEach((bot: any) => {
    // 从 label 中提取机器人用户名（格式：user_name (first_name)）
    const match = bot.label.match(/^([^\s]+)/)
    if (match && bot.value) {
      map.set(Number(bot.value), match[1])
    }
  })
  return map
})

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
    sortable: 'custom',
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

// Video.js 播放器相关
const videoPlayerRef = ref<HTMLVideoElement | null>(null)
let player: Player | null = null

// API封装 - 获取群发记录
const fetchMassSendRecords = async (params: any) => {
  try {
    const queryParams: MassSendListParamsV1 = {
      current_page: Number(params.current_page) || 1,
      page_size: Number(params.page_size) || 10
    }

    // 只有当 bot_id 有值时才添加参数
    if (params.bot_id !== undefined && params.bot_id !== '') {
      queryParams.bot_id = Number(params.bot_id)
    }

    // 处理排序参数
    if (params.order) {
      const fieldMapping: Record<string, string> = {
        create_time: 'created_at'
      }

      const orderParts = params.order.split(' ')
      if (orderParts.length === 2) {
        const [field, direction] = orderParts
        const mappedField = fieldMapping[field] || field
        queryParams.order = `${mappedField} ${direction}`
      }
    }

    // 使用新接口 v1GetMassSendList
    const response = await v1GetMassSendList(queryParams)

    if (response.code === '000000' && response.data) {
      const mappedList = (response.data.list || []).map((item: any) => {
        // 从 botInfoMap 中获取机器人用户名
        const botUserName = botInfoMap.value.get(item.bot_id) || ''

        return {
          id: item.id,
          tg_bot_id: item.bot_id,
          bot_name: botUserName,
          status: item.status,
          Percent: item.percent,
          ok_num: item.ok_num,
          fail_num: item.fail_num,
          create_time: item.created_at,
          // 详情字段 - 完整映射所有字段
          content: item.content,
          keyboards: item.keyboards, // 内联按钮数组
          ReceiveType: item.receive_type,
          tg_user_ids: item.tg_user_ids, // 用户ID列表
          image: item.file_url || item.image, // 兼容旧字段
          file_url: item.file_url // 文件URL（图片或视频）
        }
      })

      return {
        list: mappedList,
        total: response.data.pager?.total || 0
      }
    }

    return { list: [], total: 0 }
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

// 初始化 Video.js 播放器
const initVideoPlayer = () => {
  // 先清理旧的播放器实例
  disposeVideoPlayer()

  // 等待下一帧再初始化，确保 DOM 完全更新
  setTimeout(() => {
    if (videoPlayerRef.value) {
      try {
        const videoUrl = currentRecord.value.image || currentRecord.value.file_url
        const posterUrl = currentRecord.value.video_thumbnail || currentRecord.value.thumbnail

        player = videojs(videoPlayerRef.value, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          fluid: true, // 响应式
          aspectRatio: '16:9',
          language: 'zh-CN',
          playbackRates: [0.5, 1, 1.5, 2], // 播放速度选项
          poster: posterUrl || undefined,
          controlBar: {
            volumePanel: {
              inline: false
            }
          },
          sources: [
            {
              src: videoUrl,
              type: 'video/mp4'
            }
          ]
        })
      } catch (error) {
        console.error('Video.js 初始化失败:', error)
      }
    }
  }, 100)
}

// 销毁 Video.js 播放器
const disposeVideoPlayer = () => {
  if (player) {
    try {
      player.dispose()
    } catch (error) {
      console.error('Video.js 销毁失败:', error)
    } finally {
      player = null
    }
  }
}

// 监听详情弹窗打开，初始化视频播放器
watch(detailDialogVisible, async (newVal) => {
  if (newVal) {
    // 弹窗打开时，等待 DOM 渲染完成
    await nextTick()
    // 再等待一帧，确保 v-if 创建的元素和 ref 都已更新
    await nextTick()
    if (isVideoFile(currentRecord.value.image || currentRecord.value.file_url)) {
      initVideoPlayer()
    }
  } else {
    // 弹窗关闭时，销毁播放器（但不清空数据）
    disposeVideoPlayer()
  }
})

// 组件卸载时清理播放器
onBeforeUnmount(() => {
  disposeVideoPlayer()
})

// 判断是否为视频文件
const isVideoFile = (url: string): boolean => {
  if (!url) return false
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm', '.m4v']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some((ext) => lowerUrl.includes(ext))
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  if (!timestamp) return '-'
  return formatToDateTime(timestamp * 1000)
}

// 获取用户数量
const getUserCount = (userIds: any): number => {
  if (!userIds) return 0
  if (Array.isArray(userIds)) return userIds.length
  if (typeof userIds === 'string') return userIds.split(',').filter((id) => id.trim()).length
  return 1
}

// 格式化用户ID显示
const formatUserIds = (userIds: any): string => {
  if (!userIds) return '未指定用户'

  let ids: string[] = []
  if (Array.isArray(userIds)) {
    ids = userIds.map((id) => String(id))
  } else if (typeof userIds === 'string') {
    ids = userIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id)
  } else {
    ids = [String(userIds)]
  }

  // 如果用户太多，只显示前5个
  if (ids.length > 5) {
    return ids.slice(0, 5).join(', ') + ` ... (共 ${ids.length} 个)`
  }
  return ids.join(', ')
}

// 获取按钮文本
const getButtonText = (button: any): string => {
  if (!button) return '按钮'
  if (typeof button === 'string') return button
  return button.text || button.name || button.label || '按钮'
}

// 再发一次 处理函数 - 使用群发消息接口重新发送
const handleResend = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要再次发送这条群发消息吗？`, '确认重发', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    console.log('再发一次 - 原始数据:', row)

    // 使用群发消息接口 v1SendGroupMessage，参数与原记录一致
    const apiParams: any = {
      bot_id: row.tg_bot_id,
      content: row.content
    }

    // 添加内联按钮（如果有）
    if (row.keyboards && row.keyboards.length > 0) {
      // keyboards 应该是按钮ID数组
      apiParams.keyboards = row.keyboards
        .map((btn: any) => {
          // 如果是对象，提取ID；如果已经是数字，直接使用
          return typeof btn === 'object' ? btn.id : Number(btn)
        })
        .filter((id: number) => !isNaN(id))
    }

    // 添加文件URL（图片或视频）
    if (row.image || row.file_url) {
      apiParams.file_url = row.file_url || row.image
    }

    // 添加接收用户列表（如果有 tg_user_ids 就传递）
    if (row.tg_user_ids) {
      // 智能处理 tg_user_ids：支持字符串、数组、逗号分隔的字符串
      let userIds: number[] = []

      if (Array.isArray(row.tg_user_ids)) {
        // 如果已经是数组，直接转换为数字数组
        userIds = row.tg_user_ids
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id !== 0)
      } else if (typeof row.tg_user_ids === 'string') {
        // 如果是字符串，按逗号分割后转换
        userIds = row.tg_user_ids
          .split(',')
          .map((id: string) => Number(id.trim()))
          .filter((id: number) => !isNaN(id) && id !== 0)
      } else if (typeof row.tg_user_ids === 'number') {
        // 如果是单个数字
        userIds = [row.tg_user_ids]
      }

      if (userIds.length > 0) {
        apiParams.tg_user_ids = userIds
        console.log('添加 tg_user_ids:', userIds)
      }
    }

    console.log('再发一次 - 发送参数:', apiParams)

    await v1SendGroupMessage(apiParams)
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

    // 使用新接口 v1DeleteMassSend
    await v1DeleteMassSend(row.id)
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
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.info-section {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.section-title {
  padding-bottom: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  min-width: 80px;
  font-size: 14px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.user-ids-display {
  padding: 8px 12px;
  font-size: 13px;
  color: #4b5563;
  word-break: break-all;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.telegram-message-bubble {
  word-break: break-word;
}

.media-preview-container .el-image {
  display: block;
  max-height: 300px;
  margin: 0 auto;
  border-radius: 6px;
}

.video-wrapper {
  max-width: 100%;
  margin: 0 auto;
}

.video-wrapper .video-js {
  width: 100%;
  max-height: 300px;
  border-radius: 6px;
}

/* Video.js 自定义样式 */
.video-js .vjs-big-play-button {
  width: 3em;
  height: 1.5em;
  font-size: 3em;
  line-height: 1.5em;
  background-color: rgb(0 0 0 / 70%);
  border: 0.0667em solid rgb(255 255 255 / 80%);
  border-radius: 0.3em;
}

.video-js:hover .vjs-big-play-button,
.video-js .vjs-big-play-button:focus {
  background-color: rgb(0 0 0 / 90%);
}

.inline-buttons-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.keyboard-button-wrapper .el-button {
  width: 100%;
}
</style>
