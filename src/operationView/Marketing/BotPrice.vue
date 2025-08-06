<template>
  <div class="app-container">
    <ContentWrap>
      <div v-if="configData">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="金额">{{ configData.amount }}</el-descriptions-item>
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
          <el-input v-model="formData.amount" placeholder="请输入金额" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
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
  ElInput,
  ElButton
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { getSysConfListApi, updateSysConfApi } from '@/api/marketing/agent_price'

const configData = ref<any>(null)
const dialogVisible = ref(false)
const formRef = ref<InstanceType<typeof ElForm> | null>(null)
const formData = reactive({
  id: null,
  amount: '' as string | number
})

const fetchData = async () => {
  try {
    const res = await getSysConfListApi()
    if (res && res.data) {
      configData.value = res.data
    } else {
      ElMessage.error('获取配置失败')
    }
  } catch (error) {
    console.error('获取配置失败:', error)
    ElMessage.error('获取配置失败，请稍后重试')
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
  return configData.value ? formatTime(configData.value.update_time) : ''
})

onMounted(() => {
  fetchData()
})

const handleEdit = () => {
  if (configData.value) {
    formData.id = configData.value.id
    formData.amount = configData.value.amount * 1
    dialogVisible.value = true
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await updateSysConfApi({
      ...formData,
      amount: parseFloat(parseFloat(String(formData.amount)).toFixed(2)) // 转换为数字
    })
    ElMessage.success('更新成功')
    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error('更新失败')
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
