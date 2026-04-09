<template>
  <div class="app-container">
    <ContentWrap>
      <div v-if="configData">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="金额">{{ configData.bot_fee }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ formattedTime }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px">
          <BaseButton type="primary" @click="handleEdit">编辑</BaseButton>
        </div>
      </div>
      <div v-else>
        <el-skeleton :rows="2" animated />
      </div>
    </ContentWrap>

    <!-- 编辑表单 -->
    <Dialog v-model="dialogVisible" title="编辑配置" width="500px">
      <el-form :model="formData" ref="formRef" label-width="80px">
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :precision="2"
            :step="0.1"
            :min="0"
            placeholder="请输入金额"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed, reactive } from 'vue'
import {
  ElMessage,
  ElDescriptions,
  ElDescriptionsItem,
  ElSkeleton,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElButton
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { v2GetSystemPrice, v2UpdateSystemPrice } from '@/api/marketing/agent_price'
import type { V2SystemPriceResponse } from '@/api/marketing/agent_price_types'
import { handleListMessage, handleErrorMessage, handleSuccessMessage } from '@/utils/messageHelper'

const configData = ref<V2SystemPriceResponse | null>(null)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<InstanceType<typeof ElForm> | null>(null)
const formData = reactive({
  amount: 0 as number
})

const fetchData = async () => {
  try {
    const res = await v2GetSystemPrice()
    if (res && res.data) {
      configData.value = res.data
    } else {
      ElMessage.error('数据格式错误')
    }
  } catch (error) {
    handleErrorMessage(error, '获取配置失败')
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  const hours = ('0' + date.getHours()).slice(-2)
  const minutes = ('0' + date.getMinutes()).slice(-2)
  const seconds = ('0' + date.getSeconds()).slice(-2)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formattedTime = computed(() => {
  return configData.value ? formatTime(configData.value.updated_at) : ''
})

onMounted(() => {
  fetchData()
})

const handleEdit = () => {
  if (configData.value) {
    formData.amount = Number(configData.value.bot_fee) || 0
    dialogVisible.value = true
  }
}

const submitForm = async () => {
  if (!formRef.value || !configData.value) return

  submitting.value = true
  try {
    await formRef.value.validate()

    // 只传 id 和要修改的 bot_fee 字段
    const updatedPrice = {
      id: configData.value.id,
      bot_fee: formData.amount
    }

    console.log('=== 机器人价格配置 - 提交更新 ===')
    console.log('完整提交参数:', JSON.stringify(updatedPrice, null, 2))

    await v2UpdateSystemPrice(updatedPrice)
    handleSuccessMessage('更新成功')
    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    handleErrorMessage(error, '更新失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
