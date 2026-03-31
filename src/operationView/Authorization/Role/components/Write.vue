<script setup lang="tsx">
import { ref, watch, nextTick, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { ElTree, ElMessage, ElCheckbox } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import operationRoutes from '@/router/modules/operation'
import { createRoleApi, updateRoleApiV2 } from '@/api/role'
import { PropType } from 'vue'

const { t } = useI18n()

// Define interface for currentRow data
interface RoleFormData {
  id?: number
  name?: string
  Name?: string // Keep compatibility
  status?: number
  permissions?: (string | number)[] | null
}

// 定义按钮列表项的接口
interface ButtonListItem {
  code: string
  label: string
}

const props = defineProps({
  currentRow: Object as PropType<RoleFormData | null | undefined>,
  dialogTitle: String,
  actionType: String,
  formLoading: Boolean
})

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const saveLoading = ref(false)

// --- 新增：定义按钮 Code 到中文名称的映射 ---
const buttonCodeMap: Record<string, string> = {
  add: t('common.add', '新增'),
  edit: t('common.edit', '编辑'),
  delete: t('common.delete', '删除'),
  query: t('common.query', '查询'),
  import: t('common.import', '导入'),
  export: t('common.export', '导出'),
  download: t('common.download', '下载'), // 示例添加
  upload: t('common.upload', '上传') // 示例添加
  // 根据你的实际路由 buttonList 中的 code 添加更多映射
}

// --- 修改：递归构建菜单树 --- (移除收集叶子节点)
function buildMenuTree(routes: any[]): any[] {
  // 需要排除的首页路由
  const excludedRoutes = ['ExchangeRate', 'ExchangeRateIndex']

  return routes
    .filter((route) => {
      // 过滤掉需要排除的路由
      if (excludedRoutes.includes(route.name)) {
        return false
      }
      // 保持原有的过滤条件
      return route.name && route.meta && route.meta.title && !route.meta.hidden
    })
    .map((route) => {
      let mappedButtonList: ButtonListItem[] | undefined = undefined
      // 检查 buttonList 是否存在且为字符串数组
      if (
        Array.isArray(route.meta?.buttonList) &&
        route.meta.buttonList.every((item) => typeof item === 'string')
      ) {
        // 使用映射转换字符串数组为对象数组
        mappedButtonList = (route.meta.buttonList as string[]).map((code) => ({
          code: code,
          label: buttonCodeMap[code] || code // 使用映射的标签，如果映射不存在则回退到 code 本身
        }))
      } else if (Array.isArray(route.meta?.buttonList)) {
        // 如果已经是对象数组 (兼容旧格式或混合格式)
        mappedButtonList = route.meta.buttonList.map((item) => ({
          code: item.code || String(item), // 尝试获取 code 或将整个项转为字符串
          label: item.label || buttonCodeMap[item.code] || String(item) // 优先 label, 再映射, 再 code/字符串
        })) as ButtonListItem[]
      }

      const children = route.children ? buildMenuTree(route.children) : undefined

      return {
        id: route.name as string,
        label: route.meta.title,
        children: children,
        buttonList: mappedButtonList
      }
    })
}
const menuTree = buildMenuTree(operationRoutes)

const treeRef = ref<InstanceType<typeof ElTree>>() // 给 treeRef 添加类型

// 新增：存储当前选中节点信息
const selectedNodeId = ref<string | null>(null)
const selectedNodeButtonList = ref<ButtonListItem[]>([])

// 新增：用于响应式跟踪当前权限的 ref
const currentPermissionsRef = ref<string[]>([])

// useForm
const { formRegister, formMethods } = useForm()
const { setValues, getFormData, getElFormExpose } = formMethods

// --- 渲染按钮复选框的辅助函数 (代码不变，但现在接收的 buttonList 数据已包含中文 label) ---
const renderButtonCheckboxes = () => {
  // 如果没有选中节点或按钮列表为空，显示提示信息
  if (!selectedNodeId.value || selectedNodeButtonList.value.length === 0) {
    return <span>{t('role.selectMenuNodeToSetButtons', '请先选择左侧菜单节点以设置按钮权限')}</span>
  }

  // 处理按钮复选框变化的函数
  const handleButtonChange = async (checked: boolean, buttonCode: string) => {
    if (!selectedNodeId.value) return // 防御性检查

    const buttonPermission = `${selectedNodeId.value}.${buttonCode}`
    let newPermissions = [...currentPermissionsRef.value]

    if (checked) {
      if (!newPermissions.includes(buttonPermission)) {
        newPermissions.push(buttonPermission)
      }
    } else {
      newPermissions = newPermissions.filter((p) => p !== buttonPermission)
    }

    currentPermissionsRef.value = newPermissions
    setValues({ permissions: newPermissions })

    const elForm = await getElFormExpose()
    elForm?.validateField('permissions')
  }

  // 返回渲染的 JSX
  return (
    <div class="button-checkbox-group" style="display: flex; flex-direction: column; gap: 5px;">
      {selectedNodeButtonList.value.map((button) => {
        // button.label 现在应该是中文了
        const permissionId = `${selectedNodeId.value}.${button.code}`
        const isChecked = computed(() => currentPermissionsRef.value.includes(permissionId))

        return (
          <ElCheckbox
            key={permissionId}
            modelValue={isChecked.value}
            onChange={(checkedValue: boolean) => handleButtonChange(checkedValue, button.code)}
            label={permissionId}
          >
            {/* 直接使用 button.label */}
            {button.label} <span style="color: #999; font-size: 12px;">({button.code})</span>
          </ElCheckbox>
        )
      })}
    </div>
  )
}

// --- 修改 formSchema ---
const formSchema = computed<FormSchema[]>(() => [
  {
    field: 'name',
    label: t('role.roleName'),
    component: 'Input',
    componentProps: { placeholder: t('role.roleName') }
  },
  {
    field: 'status',
    label: t('menu.status'),
    component: 'Select',
    componentProps: {
      placeholder: t('menu.status'),
      options: [
        { label: t('userDemo.enable'), value: 1 },
        { label: t('userDemo.disable'), value: 2 }
      ]
    }
  },
  {
    // 用于布局和显示的 "虚拟" 字段
    field: 'permissionsDisplay',
    label: t('role.menu'), // 主标签
    colProps: { span: 24 },
    formItemProps: {
      // 使用 slots.default 来自定义渲染内容
      slots: {
        default: () => (
          // 使用 Flex 布局将树和按钮区域并排显示
          <div style="display: flex; gap: 24px; width: 100%;">
            {/* 左侧：菜单权限树 */}
            <div style="flex: 1; border: 1px solid #eee; padding: 10px; border-radius: 4px;">
              {/* 添加子标题 '菜单权限' */}
              <div style="margin-bottom: 8px; font-weight: bold;">{t('role.menu', '菜单权限')}</div>
              <ElTree
                ref={treeRef}
                data={menuTree}
                show-checkbox
                node-key="id"
                highlight-current
                default-expand-all
                onCheck={handleCheckChange} // 处理菜单勾选
                onNode-click={nodeClick} // 处理节点点击以显示按钮
                style="max-height: 400px; overflow-y: auto;" // 添加滚动条
              />
            </div>
            {/* 右侧：按钮权限复选框 */}
            <div style="flex: 1; border: 1px solid #eee; padding: 10px; border-radius: 4px;">
              {/* 添加子标题 '按钮权限' */}
              <div style="margin-bottom: 8px; font-weight: bold;">
                {t('role.buttons', '按钮权限')}
              </div>
              {/* 调用渲染函数 */}
              {renderButtonCheckboxes()}
            </div>
          </div>
        )
      }
    }
  },
  {
    // 实际存储权限数据的隐藏字段
    field: 'permissions',
    component: 'Input', // 可以是任何组件，因为它不可见
    colProps: { span: 0 }, // 不占布局空间
    formItemProps: {
      style: { display: 'none' } // CSS 隐藏
    }
  }
])

// 校验规则
const rules = {
  name: [{ required: true, message: t('role.roleName') + '不能为空', trigger: 'blur' }],
  status: [{ required: true, message: t('menu.status') + '不能为空', trigger: 'change' }],
  // 校验隐藏的 'permissions' 字段
  permissions: [
    {
      required: true, // 确保权限数组不为空
      validator: (_, value, callback) => {
        // value 应该是权限数组
        if (!Array.isArray(value) || value.length === 0) {
          // 添加一个对应的翻译: '请至少分配一个菜单或按钮权限'
          callback(new Error(t('role.assignPermissions', '请至少分配一个菜单或按钮权限')))
        } else {
          callback()
        }
      },
      trigger: ['change', 'blur'] // 在数组变化或失焦时触发校验
    }
  ]
}

// --- 修改 handleCheckChange ---
const handleCheckChange = async () => {
  await nextTick()

  // 获取所有被勾选的节点（父子联动，ElTree 默认行为）
  const checkedKeys = treeRef.value?.getCheckedKeys(false) ?? []

  // 直接作为权限
  currentPermissionsRef.value = checkedKeys.map(String)
  setValues({ permissions: currentPermissionsRef.value })

  const elForm = await getElFormExpose()
  elForm?.validateField('permissions')
}

// --- 更新 nodeClick 函数 ---
const nodeClick = (nodeData: { id?: string; buttonList?: ButtonListItem[] }) => {
  selectedNodeId.value = nodeData.id || null // 获取节点ID
  // 从节点数据中获取 buttonList，如果不存在则设为空数组
  selectedNodeButtonList.value = nodeData.buttonList || []
  // 注意：点击节点本身不会勾选/取消勾选菜单项，这由 ElTree 的复选框处理
}

// --- 恢复 watch 回调 --- (不再过滤叶子节点)
watch(
  () => [props.currentRow, props.actionType],
  ([row, type]) => {
    selectedNodeId.value = null
    selectedNodeButtonList.value = []

    if (type === 'add' || !row || typeof row !== 'object' || row === null) {
      const initialValues = { name: '', status: 1, permissions: [] }
      setValues(initialValues)
      currentPermissionsRef.value = []
      nextTick(() => treeRef.value?.setCheckedKeys([], false))
    } else {
      const validRow = row as RoleFormData
      const currentPermissions = Array.isArray(validRow.permissions)
        ? validRow.permissions.map(String)
        : []
      const menuPermissions = currentPermissions.filter((p) => !p.includes('.'))

      // 移除叶子节点过滤
      // const leafMenuPermissionsToSet = menuPermissions.filter(id => leafMenuIds.value.has(id));

      const valuesToSet = {
        name: validRow.Name ?? validRow.name ?? '',
        status: validRow.status ?? 1,
        permissions: currentPermissions
      }
      setValues(valuesToSet)
      currentPermissionsRef.value = currentPermissions

      nextTick(() => {
        // Keep async for handleCheckChange if needed
        treeRef.value?.setCheckedKeys([], false)
        // 恢复为直接传递 menuPermissions
        treeRef.value?.setCheckedKeys(menuPermissions, false)
        // 移除手动调用 handleCheckChange
        // await handleCheckChange();
      })
    }
  },
  { immediate: true, deep: true }
)

// 暴露open/close/submit方法
const open = () => {
  dialogVisible.value = true
  // 清空按钮列表状态
  selectedNodeId.value = null
  selectedNodeButtonList.value = []

  // 确保在 nextTick 中执行 DOM 操作和状态更新
  nextTick(async () => {
    const elForm = await getElFormExpose()
    elForm?.clearValidate() // 清除之前的校验状态

    // 再次检查 props.currentRow 类型
    if (!props.currentRow || typeof props.currentRow !== 'object' || props.currentRow === null) {
      const initialValues = { name: '', status: 1, permissions: [] }
      setValues(initialValues)
      currentPermissionsRef.value = [] // 初始化 ref
      treeRef.value?.setCheckedKeys([], false) // 确保清空 Tree
    } else {
      // 确认 currentRow 是 RoleFormData
      const rowData = props.currentRow as RoleFormData
      const currentPermissions = Array.isArray(rowData.permissions)
        ? rowData.permissions.map(String)
        : []
      const menuPermissions = currentPermissions.filter((p) => !p.includes('.'))

      const valuesToSet = {
        name: rowData.Name ?? rowData.name ?? '',
        status: rowData.status ?? 1,
        permissions: currentPermissions // setValues 使用完整权限
      }
      setValues(valuesToSet)

      // 先清空再设置 Tree，确保状态正确
      treeRef.value?.setCheckedKeys([], false)
      treeRef.value?.setCheckedKeys(menuPermissions, false)
      // 按钮权限的回显依赖于用户后续点击节点
      currentPermissionsRef.value = currentPermissions // 初始化 ref
    }
  })
}

const close = () => {
  dialogVisible.value = false
}

// Internal submit logic (Modified for Tree Structure - 方式 B)
const submit = async () => {
  const elForm = await getElFormExpose()
  const valid = await elForm?.validate().catch((err) => {
    console.error('Form validation failed:', err)
    // 可以在这里检查具体错误，但通常 validate() 失败就足够了
    return false
  })

  // 如果校验失败，弹出提示并中止
  if (!valid) {
    ElMessage.error(t('common.formValidateError', '表单校验失败，请检查输入项'))
    return
  }

  saveLoading.value = true
  const formData = await getFormData()

  // 获取扁平权限数组
  const flatPermissions = Array.isArray(formData.permissions)
    ? formData.permissions.map(String)
    : []

  // 构建最终发送给后端的数据
  const dataToSave = {
    name: formData.name,
    status: formData.status,
    permissions: flatPermissions // 新接口使用简单的字符串数组
  }

  try {
    if (props.actionType === 'edit') {
      if (!props.currentRow || typeof props.currentRow !== 'object' || !props.currentRow.id) {
        ElMessage.error('无法编辑角色：缺少角色ID。')
        saveLoading.value = false
        return
      }
      // 使用新的更新角色接口
      const updateData = {
        id: props.currentRow.id,
        ...dataToSave
      }
      await updateRoleApiV2(updateData)
      ElMessage.success('编辑成功')
    } else if (props.actionType === 'add') {
      // 使用新的创建角色接口
      await createRoleApi(dataToSave)
      ElMessage.success('新增成功')
    }
    close()
    emit('success')
  } catch (e: any) {
    const errMsg = e?.response?.data?.message || e?.message || t('common.apiError')
    ElMessage.error(errMsg)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ open, close, submit })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :fullscreen="false" width="60%">
    <Form
      :rules="rules"
      @register="formRegister"
      :schema="formSchema"
      :loading="props.formLoading || saveLoading"
      label-position="top"
    />
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Dialog>
</template>

<style scoped>
/* 可选：为按钮复选框组添加一些样式 */
.button-checkbox-group .el-checkbox {
  display: block; /* 让每个复选框占一行 */
  margin-right: 0; /* 移除默认右边距 */
}
</style>
