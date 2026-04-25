<template>
  <div class="bot-selector">
    <ElFormItem :label="label" :prop="fieldName" :rules="validationRules">
      <!-- 单个用户模式：只读输入框 -->
      <ElInput v-if="isSingleUser" :model-value="displayValue" disabled placeholder="当前机器人" />
      <!-- 群发模式：下拉选择框，支持多选 -->
      <ElSelect
        v-else
        :model-value="modelValue"
        @update:model-value="handleChange"
        placeholder="请选择机器人（可多选）"
        multiple
        collapse-tags
        :max-collapse-tags="1"
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
    default: () => [] // 改为返回空数组的函数
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

// 自定义验证规则：支持数组和单个值
const validationRules = computed(() => {
  if (!props.required) return []
  return [
    {
      required: true,
      validator: (_rule: any, value: any, callback: any) => {
        console.log(
          'BotSelector validation - value:',
          value,
          'type:',
          Array.isArray(value) ? 'array' : typeof value
        )

        // 如果是数组，检查数组长度
        if (Array.isArray(value)) {
          if (value.length === 0) {
            callback(new Error('请选择至少一个机器人'))
          } else {
            callback()
          }
        }
        // 如果是单个值，检查是否为空
        else if (value === undefined || value === null || value === '') {
          callback(new Error('请选择机器人'))
        } else {
          callback()
        }
      },
      trigger: ['change', 'blur']
    }
  ]
})

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
