<template>
  <el-autocomplete
    v-model="emailInput"
    :fetch-suggestions="querySearch"
    placeholder="请输入邮箱"
    class="email-autocomplete"
    @select="handleSelect"
    @input="handleInput"
    @blur="handleBlur"
    clearable
    style="width: 100%"
  >
    <template #default="{ item }">
      <div class="suggestion-item">{{ item.value }}</div>
    </template>
  </el-autocomplete>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElAutocomplete } from 'element-plus'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

// 邮箱输入值
const emailInput = ref('')

// 常用邮箱域名列表
const emailDomains = [
  '@gmail.com',
  '@qq.com',
  '@163.com',
  '@126.com',
  '@outlook.com',
  '@hotmail.com',
  '@yahoo.com',
  '@sina.com',
  '@sohu.com',
  '@foxmail.com'
]

// 初始化：设置传入的邮箱值
if (props.modelValue) {
  emailInput.value = props.modelValue
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== emailInput.value) {
      emailInput.value = newValue || ''
    }
  }
)

// 查询建议列表
const querySearch = (queryString: string, cb: (suggestions: any[]) => void) => {
  if (!queryString) {
    cb([])
    return
  }

  // 如果已经包含 @，只返回当前输入
  if (queryString.includes('@')) {
    cb([{ value: queryString }])
    return
  }

  // 根据输入的前缀生成建议列表
  const suggestions = emailDomains.map((domain) => ({
    value: queryString + domain
  }))

  cb(suggestions)
}

// 处理选择建议
const handleSelect = (item: { value: string }) => {
  emailInput.value = item.value
  emit('update:modelValue', item.value)
}

// 处理输入变化
const handleInput = (value: string) => {
  emit('update:modelValue', value)
}

// 处理失焦事件
const handleBlur = () => {
  emit('blur')
}
</script>

<style scoped>
.email-autocomplete {
  width: 100% !important;
}

.email-autocomplete :deep(.el-input) {
  width: 100% !important;
}

.email-autocomplete :deep(.el-input__wrapper) {
  width: 100% !important;
}

.suggestion-item {
  padding: 4px 0;
  font-size: 14px;
}
</style>
