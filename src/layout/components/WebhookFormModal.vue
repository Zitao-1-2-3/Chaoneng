<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElSelect,
  ElOption
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// 假设你有一个封装好的 axios 实例
import request from '@/axios'
import { any } from 'vue-types'

// 定义 API 响应结构接口 - 调整 code 类型
interface ApiResponse<T = any> {
  code: string | number // <--- 修改：允许字符串或数字
  data: T
  msg?: string
}

// 定义 props
const props = defineProps<{
  visible: boolean
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据模型
const formData = reactive({
  address: '', // 被监控地址
  txid: '', // 交易哈希
  time: new Date().getTime(), // 交易发生时间
  value: '', // 余额变化数量
  coin: 'TRX', // 币种
  height: null as number | null, // 区块高度
  tokenSymbol: 'TRX', // Token符号
  tokenValue: null as string | null, // Token数量变化
  tokenAddress: null as string | null // Token地址
})

// 表单校验规则
const rules = reactive<FormRules>({
  address: [{ required: true, message: '请输入监控地址', trigger: 'blur' }],
  txid: [{ required: true, message: '请输入交易哈希', trigger: 'blur' }],
  value: [{ required: true, message: '请输入余额变化数量', trigger: 'blur' }]
})

// 监听外部传入的 visible prop 变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
      // 每次打开时重置表单数据
      Object.assign(formData, {
        address: '',
        txid: '',
        time: new Date().getTime(),
        value: '',
        coin: 'TRX',
        height: null,
        tokenSymbol: 'TRX',
        tokenValue: null,
        tokenAddress: null
      })
    }
  }
)

// 处理模态框关闭事件
const handleClose = () => {
  formRef.value?.clearValidate()
  emit('close')
}

// 处理表单提交
const handleSubmit = (formEl: FormInstance | undefined) => {
  if (!formEl) return

  formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 准备提交数据
        const postData: Record<string, any> = {
          address: formData.address,
          txid: formData.txid,
          time: new Date().getTime(),
          value: formData.value,
          coin: 'TRX',
          tokenSymbol: formData.tokenSymbol === 'TRX' ? null : formData.tokenSymbol,
          tokenAddress: formData.tokenAddress
        }

        if (formData.height !== null) {
          postData.height = formData.height
        }

        if (formData.tokenValue !== null) {
          postData.tokenValue = formData.tokenValue
        }

        console.log('提交数据:', postData)

        const res: ApiResponse = await request.post({
          url: '/public/v1/order/webhook',
          data: postData
        })

        console.log('API 响应:', res)
        ElMessage.success(res.msg || 'Webhook 配置成功！')
        handleClose()
      } catch (error: any) {
        console.error('Webhook 配置失败:', error)
        ElMessage.error(error?.message || '配置请求失败，请检查网络或联系管理员')
      } finally {
        loading.value = false
      }
    } else {
      console.log('表单校验失败!')
    }
  })
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="配置 Webhook"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <ElFormItem label="监控地址" prop="address">
        <ElInput v-model="formData.address" placeholder="请输入被监控地址哈希" clearable />
      </ElFormItem>

      <ElFormItem label="交易哈希" prop="txid">
        <ElInput v-model="formData.txid" placeholder="请输入交易哈希" clearable />
      </ElFormItem>

      <ElFormItem label="余额变化" prop="value">
        <ElInput v-model="formData.value" placeholder="例如：-0.002135942" clearable />
      </ElFormItem>

      <ElFormItem label="Token 符号">
        <ElSelect v-model="formData.tokenSymbol" placeholder="请选择Token符号" style="width: 100%">
          <ElOption label="TRX" value="TRX" />
          <ElOption label="USDT" value="USDT" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="Token 数量变化">
        <ElInput v-model="formData.tokenValue" placeholder="（可选）例如：-159" clearable />
      </ElFormItem>

      <ElFormItem label="Token 地址">
        <ElInput v-model="formData.tokenAddress" placeholder="请输入Token地址（可选）" clearable />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit(formRef)">
          确定提交
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped>
/* 可以添加一些自定义样式 */
.dialog-footer button:first-child {
  margin-right: 10px;
}
</style>
