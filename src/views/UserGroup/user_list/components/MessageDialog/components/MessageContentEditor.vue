<template>
  <div class="message-content-editor">
    <ElFormItem
      label="消息内容"
      prop="content"
      :rules="[{ required: true, message: '消息内容不能为空', trigger: 'blur' }]"
    >
      <ElInput
        :model-value="modelValue"
        @update:model-value="handleChange"
        type="textarea"
        :rows="4"
        placeholder="请输入消息内容"
      />
      <!-- 格式化按钮 -->
      <div v-if="showFormattingButtons" class="formatting-buttons mt-2">
        <slot name="formattingButtons"></slot>
      </div>
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { ElFormItem, ElInput } from 'element-plus'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  showFormattingButtons: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const handleChange = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.message-content-editor {
  width: 100%;
}

.formatting-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
