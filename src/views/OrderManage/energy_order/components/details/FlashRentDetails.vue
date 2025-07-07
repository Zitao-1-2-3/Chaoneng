<script setup lang="ts">
import { computed, h } from 'vue'
import { ElLink } from 'element-plus'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import isEmpty from 'lodash-es/isEmpty'

const props = defineProps({
  orderData: {
    type: Object,
    default: () => ({})
  }
})

// 闪租详情 schema
const flashRentDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'stroke_num', label: '闪租笔数' }, // Assuming 'stroke_num' applies
  {
    field: 'flash_price',
    label: '闪租能量价格',
    slots: {
      default: (data: any) =>
        h('span', {}, data.flash_price + ' ' + data.pay_unit + '/' + data.energy_rent_text)
    }
  },
  { field: 'receive_address', label: '接收地址', span: 24 },
  { field: 'from_address', label: '发放能量地址', span: 24 },
  {
    field: 'txid',
    label: '交易hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (isEmpty(data?.txid)) return h('span', '-')
        return h(
          ElLink,
          {
            href: `${import.meta.env.VITE_TRONSCAN_URL}/#/transaction/${data.txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => data.txid
        )
      }
    }
  }
])
</script>

<template>
  <Descriptions :schema="flashRentDetailSchema" :data="orderData" :column="2" border />
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>
