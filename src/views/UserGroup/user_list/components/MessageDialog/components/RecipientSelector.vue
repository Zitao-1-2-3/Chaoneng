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
      :rules="userListRules"
    >
      <!-- 单个用户模式：只读输入框 -->
      <ElInput
        v-if="isSingleUser"
        :model-value="userList"
        @update:model-value="handleUserListChange"
        disabled
        placeholder="当前用户TG ID"
      />
      <!-- 群发模式：多行文本框 -->
      <ElInput
        v-else
        :model-value="userList"
        @update:model-value="handleUserListChange"
        type="textarea"
        :rows="3"
        placeholder="请输入TG用户ID，多个用英文逗号隔开"
      />
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { ElFormItem, ElRadioGroup, ElRadio, ElInput } from 'element-plus'

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
  }
})

const emit = defineEmits(['update:filterType', 'update:userList'])

// 是否应该显示用户列表输入框
const shouldShowUserListInput = computed(() => {
  // 多选机器人时不显示
  if (props.isMultipleBots) return false
  // 单个用户模式或自定义用户类型时显示
  return props.isSingleUser || props.filterType === 'user_custom'
})

// 用户列表校验规则
const userListRules = computed(() => {
  if (props.filterType === 'user_custom') {
    return [
      {
        required: true,
        validator: (_rule: any, value: string, callback: Function) => {
          if (!value) {
            callback(new Error('自定义用户时，TG用户ID列表不能为空'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
  return []
})

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
</script>

<style scoped>
.recipient-selector {
  width: 100%;
}
</style>
