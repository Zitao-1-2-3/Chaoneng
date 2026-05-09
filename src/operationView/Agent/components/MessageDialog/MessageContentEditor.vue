<template>
  <div class="message-content-editor">
    <ElFormItem
      label="消息内容"
      prop="content"
      :rules="[{ required: true, message: '消息内容不能为空', trigger: 'blur' }]"
    >
      <ElInput
        ref="textareaRef"
        :model-value="modelValue"
        @update:model-value="handleChange"
        type="textarea"
        :rows="4"
        placeholder="请输入消息内容"
      />
    </ElFormItem>
    <!-- 格式化按钮 - 在 FormItem 外面，这样会显示在验证错误提示的下方 -->
    <div v-if="showFormattingButtons" class="formatting-buttons">
      <slot name="formattingButtons"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const textareaRef = ref()

const handleChange = (value: string) => {
  emit('update:modelValue', value)
}

// 暴露 textarea ref 给父组件
defineExpose({
  textareaRef
})
</script>

<style scoped>
.message-content-editor {
  width: 100%;
}

.formatting-buttons {
  display: flex;
  padding-left: 120px; /* 与 label-width 对齐 */
  margin-top: -12px;
  margin-bottom: 18px;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
