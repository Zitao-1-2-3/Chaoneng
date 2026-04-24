<template>
  <div class="bot-selector">
    <ElFormItem
      :label="label"
      :prop="fieldName"
      :rules="required ? [{ required: true, message: '请选择机器人', trigger: 'change' }] : []"
    >
      <!-- 单个用户模式：只读输入框 -->
      <ElInput v-if="isSingleUser" :model-value="displayValue" disabled placeholder="当前机器人" />
      <!-- 群发模式：下拉选择框，支持多选 -->
      <ElSelect
        v-else
        :model-value="modelValue"
        @update:model-value="handleChange"
        placeholder="请选择机器人"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        style="width: 100%"
      >
        <ElOption v-for="bot in botList" :key="bot.value" :label="bot.label" :value="bot.value" />
      </ElSelect>
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { ElFormItem, ElInput, ElSelect, ElOption } from 'element-plus'

interface BotOption {
  label: string
  value: number | string
}

const props = defineProps({
  modelValue: {
    type: [Number, String, Array] as PropType<number | string | (number | string)[]>,
    default: undefined
  },
  botList: {
    type: Array as PropType<BotOption[]>,
    default: () => []
  },
  isSingleUser: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: '机器人'
  },
  fieldName: {
    type: String,
    default: 'bot_id'
  },
  required: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 单个用户模式下的显示值
const displayValue = computed(() => {
  if (!props.isSingleUser) return ''
  const found = props.botList.find((b) => String(b.value) === String(props.modelValue))
  return found ? found.label : String(props.modelValue ?? '')
})

const handleChange = (value: number | string | (number | string)[]) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.bot-selector {
  width: 100%;
}
</style>
