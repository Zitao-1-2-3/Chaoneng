<script lang="tsx">
import { defineComponent, computed, ref } from 'vue'
import { Collapse } from '@/components/Collapse'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { SizeDropdown } from '@/components/SizeDropdown'
import { UserInfo } from '@/components/UserInfo'
import { Screenfull } from '@/components/Screenfull'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { Icon } from '@/components/Icon'
import WebhookFormModal from './WebhookFormModal.vue'
import { getCustomerServiceListApi } from '@/api/customer_service'
import { ElMessage } from 'element-plus'
import { BaseButton } from '@/components/Button'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
const locale = computed(() => appStore.getLocale)

const VITE_NODE_ENV = import.meta.env.VITE_NODE_ENV === 'development' ? 'dev' : 'prod'

export default defineComponent({
  name: 'ToolHeader',
  components: { WebhookFormModal },
  setup() {
    // 使用 ref 创建本地响应式状态来控制模态框的可见性
    const isWebhookFormVisible = ref(false)

    // 处理打开 Webhook 表单的点击事件
    const handleOpenWebhookForm = () => {
      isWebhookFormVisible.value = true
      console.log('打开 Webhook 表单（本地状态）')
    }

    // 处理关闭模态框的事件
    const handleCloseWebhookForm = () => {
      isWebhookFormVisible.value = false
    }

    // 联系客服功能
    const handleContactCustomerService = async () => {
      try {
        // 调用客服列表 API 获取第一个客服
        const res = await getCustomerServiceListApi({
          current_page: 1,
          page_size: 1,
          status: 1 // 只获取启用状态的客服
        })

        if (res.data.list && res.data.list.length > 0) {
          const firstCustomerService = res.data.list[0]
          let tgName = firstCustomerService.tg_name

          // 去掉 @ 符号（如果有的话）
          if (tgName.startsWith('@')) {
            tgName = tgName.substring(1)
          }

          // 跳转到 Telegram
          const telegramUrl = `https://t.me/${tgName}`
          window.open(telegramUrl, '_blank')
        } else {
          ElMessage.warning('暂无可用客服')
        }
      } catch (error) {
        console.error('获取客服信息失败:', error)
        ElMessage.error('获取客服信息失败')
      }
    }

    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="custom-hover" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="<md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          {VITE_NODE_ENV === 'dev' ? (
            <div
              class="custom-hover mr-2 flex items-center cursor-pointer"
              onClick={handleOpenWebhookForm}
            >
              <Icon
                icon="ant-design:form-outlined"
                size={18}
                color="var(--top-header-text-color)"
              ></Icon>
            </div>
          ) : undefined}
          <BaseButton type="primary" onClick={handleContactCustomerService}>
            联系客服
          </BaseButton>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {size.value ? (
            <SizeDropdown class="custom-hover" color="var(--top-header-text-color)"></SizeDropdown>
          ) : undefined}
          {locale.value ? (
            <LocaleDropdown
              class="custom-hover"
              color="var(--top-header-text-color)"
            ></LocaleDropdown>
          ) : undefined}
          <UserInfo></UserInfo>
        </div>

        <WebhookFormModal visible={isWebhookFormVisible.value} onClose={handleCloseWebhookForm} />
      </div>
    )
  }
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{adminNamespace}-tool-header';

.@{prefix-cls} {
  transition: left var(--transition-time-02);
}
</style>
