<script setup lang="ts">
import { computed, provide } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { ConfigGlobal } from '@/components/ConfigGlobal'
import { useDesign } from '@/hooks/web/useDesign'
// import { ElNotification } from 'element-plus'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('app')

const appStore = useAppStore()

const currentSize = computed(() => appStore.getCurrentSize)

const greyMode = computed(() => appStore.getGreyMode)

const systemType = import.meta.env.VITE_SYSTEM_TYPE || 'Management'

// 可以提供给后代组件使用
provide('systemType', systemType)

// 可以在控制台输出当前系统类型（开发调试用）
if (import.meta.env.DEV) {
  console.log('当前系统类型:', systemType)
}

appStore.initTheme()

// ElNotification({
//   title: '提示',
//   type: 'warning',
//   duration: 0,
//   dangerouslyUseHTMLString: true,
//   message:
//     '<div><p><strong>遇事不决，请先查阅常见问题，说不定你能找到相关解答</strong></p><p><a href="https://element-plus-admin-doc.cn/guide/fqa.html" target="_blank">链接地址</a></p></div>'
// })
</script>

<template>
  <ConfigGlobal :size="currentSize">
    <RouterView :class="greyMode ? `${prefixCls}-grey-mode` : ''" />
  </ConfigGlobal>
</template>

<style lang="less">
@prefix-cls: ~'@{adminNamespace}-app';

.size {
  width: 100%;
  height: 100%;
}

html,
body {
  padding: 0 !important;
  margin: 0;
  overflow: hidden;
  .size;

  #app {
    .size;
  }
}

.@{prefix-cls}-grey-mode {
  filter: grayscale(100%);
}
</style>
