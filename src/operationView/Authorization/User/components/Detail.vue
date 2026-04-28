<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Descriptions, DescriptionsSchema } from '@/components/Descriptions'
import { Dialog } from '@/components/Dialog'
import { useI18n } from '@/hooks/web/useI18n'
import { getUserDetailApi } from '@/api/manageUser'

const { t } = useI18n()

const props = defineProps({
  userId: [Number, String],
  dialogTitle: String,
  actionType: String
})

const dialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<any>({})

const detailSchema = computed<DescriptionsSchema[]>(() => [
  { field: 'username', label: t('userDemo.username') },
  { field: 'role_name', label: t('userDemo.role') },
  {
    field: 'status',
    label: t('userDemo.status'),
    formatter: (val: any) => (val === 1 ? t('userDemo.enable') : t('userDemo.disable'))
  }
])

watch(
  () => [props.userId, props.actionType],
  async ([id, type]) => {
    if (!id || type === 'add') {
      detailData.value = {}
    } else {
      detailLoading.value = true
      try {
        const res = await getUserDetailApi(id)
        detailData.value = res?.data || {}
      } finally {
        detailLoading.value = false
      }
    }
  },
  { immediate: true }
)

const open = () => {
  dialogVisible.value = true
}
const close = () => {
  dialogVisible.value = false
}
defineExpose({ open, close })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :fullscreen="false" width="40%">
    <Descriptions :schema="detailSchema" :data="detailData" :loading="detailLoading" />
  </Dialog>
</template>
