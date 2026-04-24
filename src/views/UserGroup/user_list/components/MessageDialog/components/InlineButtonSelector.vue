<template>
  <div class="inline-button-selector">
    <ElFormItem label="内联按钮">
      <div class="flex flex-col gap-2 w-full">
        <BaseButton link type="primary" plain @click="handleEditClick" class="self-start">
          编辑内联按钮
        </BaseButton>
        <ElCheckboxGroup
          v-if="menuList.length > 0"
          :model-value="modelValue"
          @update:model-value="handleChange"
          class="flex flex-wrap gap-2"
        >
          <ElCheckbox v-for="menu in menuList" :key="menu.id" :label="menu.id">
            {{ menu.menu_name }}
          </ElCheckbox>
        </ElCheckboxGroup>
        <p v-else class="text-gray-500 text-sm m-0">暂无可用的内联按钮，请先前往菜单管理添加。</p>
      </div>
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import { ElFormItem, ElCheckboxGroup, ElCheckbox } from 'element-plus'
import { BaseButton } from '@/components/Button'
import type { MenuItem } from '@/api/menu_list/types'

defineProps({
  modelValue: {
    type: Array as PropType<(number | string)[]>,
    default: () => []
  },
  menuList: {
    type: Array as PropType<MenuItem[]>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const handleChange = (value: (number | string)[]) => {
  emit('update:modelValue', value)
}

const handleEditClick = () => {
  emit('edit')
}
</script>

<style scoped>
.inline-button-selector {
  width: 100%;
}
</style>
