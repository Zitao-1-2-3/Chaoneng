<template>
  <div class="recipient-selector">
    <!-- 接收用户类型选择 -->
    <ElFormItem
      v-if="showFilterType && !isSingleUser && !isMultipleBots"
      label="接收用户"
      prop="filter_type"
      :rules="[{ required: true, message: '请选择接收用户类型', trigger: 'change' }]"
    >
      <ElRadioGroup :model-value="filterType" @update:model-value="handleFilterTypeChange">
        <ElRadio value="user_custom">自定义</ElRadio>
        <ElRadio value="all_user">全部</ElRadio>
      </ElRadioGroup>
    </ElFormItem>

    <!-- TG用户ID列表 -->
    <ElFormItem
      v-if="showUserList && shouldShowUserListInput"
      :label="isSingleUser ? 'TG用户ID' : 'TG用户ID列表'"
      prop="user_list"
    >
      <!-- 单个用户模式：只读输入框 -->
      <ElInput
        v-if="isSingleUser"
        :model-value="userList"
        @update:model-value="handleUserListChange"
        disabled
        placeholder="当前用户TG ID"
      />
      <!-- 群发模式：下拉多选框 -->
      <ElSelect
        v-else
        :model-value="selectedUserIds"
        @update:model-value="handleUserSelectionChange"
        multiple
        filterable
        placeholder="请选择用户"
        style="width: 100%"
        :loading="loadingUsers"
        :disabled="!selectedBotId || loadingUsers"
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="3"
      >
        <ElOption
          v-for="user in userOptions"
          :key="user.value"
          :label="user.label"
          :value="user.value"
        />
        <!-- 当有机器人但没有用户时显示提示 -->
        <template v-if="selectedBotId && !loadingUsers && userOptions.length === 0" #empty>
          <div class="text-center text-gray-400 py-2">此机器人下没有用户</div>
        </template>
      </ElSelect>
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, type PropType } from 'vue'
import {
  ElFormItem,
  ElRadioGroup,
  ElRadio,
  ElInput,
  ElSelect,
  ElOption,
  ElMessage
} from 'element-plus'
import { v1GetBotUserList } from '@/api/tgUser'

const props = defineProps({
  filterType: {
    type: String as PropType<'user_custom' | 'all_user'>,
    default: 'user_custom'
  },
  userList: {
    type: String,
    default: ''
  },
  isSingleUser: {
    type: Boolean,
    default: false
  },
  isMultipleBots: {
    type: Boolean,
    default: false
  },
  // 新增：是否显示类型选择
  showFilterType: {
    type: Boolean,
    default: true
  },
  // 新增：是否显示用户列表输入框
  showUserList: {
    type: Boolean,
    default: true
  },
  // 新增：选中的机器人ID（用于获取用户列表）
  selectedBotId: {
    type: [Number, String] as PropType<number | string | undefined>,
    default: undefined
  }
})

const emit = defineEmits(['update:filterType', 'update:userList'])

// 用户列表相关状态
const loadingUsers = ref(false)
const userOptions = ref<Array<{ label: string; value: number }>>([])

// 将逗号分隔的字符串转换为数组
const selectedUserIds = computed(() => {
  if (!props.userList) return []
  return props.userList
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !isNaN(id) && id !== 0)
})

// 是否应该显示用户列表输入框
const shouldShowUserListInput = computed(() => {
  // 多选机器人时不显示
  if (props.isMultipleBots) return false
  // 单个用户模式或自定义用户类型时显示
  return props.isSingleUser || props.filterType === 'user_custom'
})

// 获取机器人用户列表
const fetchBotUsers = async (botId: number | string) => {
  if (!botId) {
    userOptions.value = []
    return
  }

  loadingUsers.value = true
  try {
    const res = await v1GetBotUserList(Number(botId))
    if (res.code === '000000' && res.data) {
      userOptions.value = res.data.map((user) => ({
        label: `${user.tg_user_name || user.tg_first_name || 'Unknown'} (${user.tg_user_id})`,
        value: user.tg_user_id
      }))
    } else {
      userOptions.value = []
      ElMessage.warning('获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    userOptions.value = []
    ElMessage.error('获取用户列表失败')
  } finally {
    loadingUsers.value = false
  }
}

// 监听机器人ID变化，自动获取用户列表
watch(
  () => props.selectedBotId,
  (newBotId) => {
    if (newBotId && !props.isSingleUser && props.filterType === 'user_custom') {
      fetchBotUsers(newBotId)
    } else {
      userOptions.value = []
    }
  },
  { immediate: true }
)

// 监听filterType变化
watch(
  () => props.filterType,
  (newType) => {
    if (newType === 'user_custom' && props.selectedBotId) {
      fetchBotUsers(props.selectedBotId)
    }
  }
)

const handleFilterTypeChange = (value: 'user_custom' | 'all_user') => {
  emit('update:filterType', value)
  // 如果切换到全部用户，清空用户列表
  if (value === 'all_user') {
    emit('update:userList', '')
  }
}

const handleUserListChange = (value: string) => {
  emit('update:userList', value)
}

// 处理用户选择变化
const handleUserSelectionChange = (selectedIds: number[]) => {
  // 将数组转换为逗号分隔的字符串
  const userListStr = selectedIds.join(',')
  emit('update:userList', userListStr)
}
</script>

<style scoped>
.recipient-selector {
  width: 100%;
}
</style>
