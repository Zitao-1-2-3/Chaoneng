<template>
  <span>{{ formattedTime }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatUnixTime, formatUnixTimeLocale } from '@/utils/dateFormat'

interface Props {
  timestamp: number | string | null | undefined
  format?: string
  useLocale?: boolean
  locale?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'YYYY-MM-DD HH:mm:ss',
  useLocale: false,
  locale: 'zh-CN'
})

const formattedTime = computed(() => {
  if (props.useLocale) {
    return formatUnixTimeLocale(props.timestamp, props.locale)
  }
  return formatUnixTime(props.timestamp, props.format)
})
</script>
