<template>
  <div>
    <Form :isCol="true" labelPosition="top" :schema="paymentSchema" @register="formRegister" />

    <!-- 福利收款钱包地址列表 -->
    <div class="weal-address-section">
      <div class="section-header">
        <span class="section-title">【福利】收款钱包地址</span>
      </div>

      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :fetch-data-api="fetchWealAddresses"
        :table-props="{ border: true }"
        :show-search="false"
        :pagination="{
          pageSize: 4,
          pageSizes: [4, 10, 20, 30, 40, 40, 50, 100]
        }"
      >
        <!-- 工具栏插槽 -->
        <template #toolbar>
          <el-button type="primary" @click="handleAddAddress">
            <Icon icon="ep:plus" class="mr-5px" />
            添加地址
          </el-button>
          <el-button type="danger" @click="handleBatchDeleteDialog">
            <Icon icon="ep:delete" class="mr-5px" />
            批量删除
          </el-button>
        </template>
      </SearchTable>
    </div>

    <!-- 添加地址对话框 -->
    <Dialog v-model="dialogVisible" title="添加福利收款地址" width="600px" max-height="300px">
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px">
          <span style=" font-size: 14px;font-weight: 500">钱包地址</span>
          <span style=" margin-left: 8px; font-size: 12px;color: #909399">
            （每行一个地址，支持批量添加）
          </span>
        </div>
        <el-input
          v-model="addressForm.addresses"
          type="textarea"
          :rows="12"
          placeholder="请输入福利收款钱包地址，每行一个"
          style="font-family: monospace"
        />
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmAdd">
            <Icon icon="ep:check" class="mr-5px" />
            确定添加
          </el-button>
        </div>
      </template>
    </Dialog>

    <!-- 批量删除地址对话框 -->
    <Dialog
      v-model="batchDeleteVisible"
      title="批量删除福利收款地址"
      width="600px"
      max-height="300px"
    >
      <div style="margin-bottom: 16px">
        <div style="margin-bottom: 8px">
          <span style=" font-size: 14px;font-weight: 500">要删除的钱包地址</span>
          <span style=" margin-left: 8px; font-size: 12px;color: #909399">
            （每行一个地址，支持批量删除）
          </span>
        </div>
        <el-input
          v-model="batchDeleteForm.addresses"
          type="textarea"
          :rows="12"
          placeholder="请输入要删除的钱包地址，每行一个"
          style="font-family: monospace"
        />
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="batchDeleteVisible = false">取消</el-button>
          <el-button type="danger" @click="handleConfirmBatchDelete">
            <Icon icon="ep:delete" class="mr-5px" />
            确定删除
          </el-button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, h, onMounted } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Icon } from '@/components/Icon'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import type { TableColumn } from '@/components/Table'
import { ElButton } from 'element-plus'
import { formatToDateTime } from '@/utils/dateUtil'
import { v1AddAddressList, v1DeleteAddressList, v1GetAddressList } from '@/api/botlist'

// 表单相关
const { formRegister, formMethods } = useForm()

// SearchTable 引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 当前机器人ID（从父组件传入）
const currentBotId = ref<number>(0)

// 对话框相关
const dialogVisible = ref(false)
const addressForm = reactive({
  addresses: ''
})

// 批量删除对话框相关
const batchDeleteVisible = ref(false)
const batchDeleteForm = reactive({
  addresses: ''
})

// 删除地址函数（需要在 columns 之前定义）
const handleDeleteAddress = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await v1DeleteAddressList({
      bot_id: currentBotId.value,
      list: [row.address]
    })

    ElMessage.success('删除成功')
    reloadTable()
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMsg = error?.msg || error?.message || '删除失败'
      ElMessage.error(errorMsg)
    }
  }
}

// SearchTable 列配置
const columns = ref<TableColumn[]>([
  {
    field: 'address',
    label: '地址',
    minWidth: '200px'
  },
  {
    field: 'created_at',
    label: '创建时间',
    width: '180px',
    formatter: (row) => formatToDateTime(row.created_at * 1000)
  },
  {
    field: 'updated_at',
    label: '修改时间',
    width: '180px',
    formatter: (row) => formatToDateTime(row.updated_at * 1000)
  },
  {
    label: '操作',
    field: 'action',
    width: '120px',
    fixed: 'right',
    formatter: (row) => {
      return h(
        ElButton,
        {
          type: 'danger',
          size: 'small',
          onClick: () => handleDeleteAddress(row)
        },
        () => '删除'
      )
    }
  }
])

// 获取福利地址列表（供 SearchTable 使用）
const fetchWealAddresses = async (params: any) => {
  try {
    if (!currentBotId.value) {
      return { list: [], totalCount: 0 }
    }

    const res = await v1GetAddressList({
      bot_id: currentBotId.value,
      kind: 6, // 福利地址
      current_page: params.current_page || 1,
      page_size: params.page_size || 4
    })

    const data = res.data || {}
    return {
      list: data.list || [],
      totalCount: data.pager?.total || 0
    }
  } catch (error) {
    console.error('获取福利地址列表失败:', error)
    return { list: [], totalCount: 0 }
  }
}

// 刷新表格
const reloadTable = () => {
  searchTableRef.value?.reload()
}

// 收款配置表单（移除福利地址字段）
const paymentSchema = reactive<FormSchema[]>([
  {
    field: 'energy_address',
    component: 'Input' as const,
    label: '【1小时能量闪租】收款钱包地址',
    componentProps: {
      placeholder: '请输入闪充收款钱包地址'
    },
    formItemProps: {
      rules: []
    }
  },
  {
    field: 'receive_address',
    component: 'Input' as const,
    label: {
      text: '【余额充值】收款钱包地址',
      tips: '如果不填则使用1小时能量闪租的收款钱包地址'
    },
    componentProps: {
      placeholder: '请输入余额收款钱包地址'
    },
    formItemProps: {
      rules: []
    }
  },
  {
    field: 'energy_usdt_address',
    component: 'Input' as const,
    label: {
      text: '【按笔数购买】TRX/USDT收款钱包地址',
      tips: '请区分闪兑收款地址，不能相同'
    },
    componentProps: {
      placeholder: '请输入TRX/USDT收款钱包地址'
    },
    formItemProps: {
      rules: [
        {
          validator: (_: any, value: string, callback: (error?: Error) => void) => {
            // 当前值为空时不验证
            if (!value) {
              callback()
              return
            }
            // 使用setTimeout来确保能获取到最新的表单数据
            setTimeout(async () => {
              try {
                const formData = await formMethods.getFormData()
                if (formData && formData.energy_address && value === formData.energy_address) {
                  callback(new Error('TRX/USDT收款钱包地址不能与闪租收款钱包地址相同'))
                } else {
                  callback()
                }
              } catch (error) {
                callback()
              }
            }, 0)
          },
          trigger: 'blur'
        }
      ]
    }
  },
  {
    field: 'transfer_address',
    component: 'Input' as const,
    label: {
      text: '【闪兑TRX/USDT】收款钱包地址',
      tips: '请区分其他收款地址，不能相同'
    },
    componentProps: {
      placeholder: '请输入闪兑收款钱包地址'
    },
    formItemProps: {
      rules: [
        {
          validator: (_: any, value: string, callback: (error?: Error) => void) => {
            // 当前值为空时不验证
            if (!value) {
              callback()
              return
            }
            // 使用setTimeout来确保能获取到最新的表单数据
            setTimeout(async () => {
              try {
                const formData = await formMethods.getFormData()
                // 验证不能与其他地址相同
                if (formData.energy_address && value === formData.energy_address) {
                  callback(new Error('闪兑收款地址不能与闪租收款地址相同'))
                } else if (formData.energy_usdt_address && value === formData.energy_usdt_address) {
                  callback(new Error('闪兑收款地址不能与按笔数购买收款地址相同'))
                } else {
                  callback()
                }
              } catch (error) {
                callback()
              }
            }, 0)
          },
          trigger: 'blur'
        }
      ]
    }
  }
])

// 添加地址
const handleAddAddress = () => {
  addressForm.addresses = ''
  dialogVisible.value = true
}

// 确认添加
const handleConfirmAdd = async () => {
  if (!addressForm.addresses.trim()) {
    ElMessage.warning('请输入地址')
    return
  }

  const addressList = addressForm.addresses
    .split(/[\n\r]+/)
    .map((addr: string) => addr.trim())
    .filter((addr: string) => addr !== '')

  if (addressList.length === 0) {
    ElMessage.warning('未输入有效地址')
    return
  }

  try {
    await v1AddAddressList({
      bot_id: currentBotId.value,
      kind: 6,
      list: addressList
    })
    ElMessage.success(`成功添加 ${addressList.length} 个地址`)
    dialogVisible.value = false
    reloadTable()
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || '添加失败'
    ElMessage.error(errorMsg)
  }
}

// 设置当前机器人ID（供父组件调用）
const setBotId = (botId: number) => {
  currentBotId.value = botId
  // 设置 botId 后刷新表格
  if (searchTableRef.value) {
    reloadTable()
  }
}

// 组件挂载后设置初始 pageSize
onMounted(() => {
  // 等待 SearchTable 组件完全初始化
  setTimeout(() => {
    if (searchTableRef.value && (searchTableRef.value as any).tableState) {
      ;(searchTableRef.value as any).tableState.pageSize.value = 4
    }
  }, 100)
})

// 打开批量删除对话框
const handleBatchDeleteDialog = () => {
  batchDeleteForm.addresses = ''
  batchDeleteVisible.value = true
}

// 确认批量删除
const handleConfirmBatchDelete = async () => {
  if (!batchDeleteForm.addresses.trim()) {
    ElMessage.warning('请输入要删除的地址')
    return
  }

  const addressList = batchDeleteForm.addresses
    .split(/[\n\r]+/)
    .map((addr: string) => addr.trim())
    .filter((addr: string) => addr !== '')

  if (addressList.length === 0) {
    ElMessage.warning('未输入有效地址')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除 ${addressList.length} 个地址吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await v1DeleteAddressList({
      bot_id: currentBotId.value,
      list: addressList
    })

    ElMessage.success(`成功删除 ${addressList.length} 个地址`)
    batchDeleteVisible.value = false
    reloadTable()
  } catch (error: any) {
    if (error !== 'cancel') {
      const errorMsg = error?.msg || error?.message || '批量删除失败'
      ElMessage.error(errorMsg)
    }
  }
}

// 暴露表单方法和其他方法
defineExpose({
  formMethods,
  setBotId,
  reloadTable
})
</script>

<style scoped>
.weal-address-section {
  padding: 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
