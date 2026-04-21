<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <Descriptions
      v-if="props.type === 'single' && props.user"
      :data="props.user"
      :schema="userDescriptionSchema"
      title="用户信息"
      class="mb-20px"
    />
    <Form :schema="formSchema" @register="messageFormRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">发送</ElButton>
      </div>
    </template>
  </Dialog>
  <ElImageViewer
    v-if="showImageViewer"
    :url-list="imageViewerSrcList"
    @close="showImageViewer = false"
    :initial-index="0"
  />
</template>

<script setup lang="tsx">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ElButton,
  ElMessage,
  ElCheckbox,
  ElCheckboxGroup,
  ElUpload,
  ElImageViewer
} from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { v1SendGroupMessage, v1SendMessage, v1GetInlineButtonList } from '@/api/tgUser'
import { uploadImage as uploadAPI } from '@/api/utils/upload'
import type { MenuItem } from '@/api/menu_list/types'
import { useRouter } from 'vue-router'
import { BaseButton } from '@/components/Button'
import { useHtmlInsert } from '@/hooks/web/useHtmlInsert'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as () => 'single' | 'mass',
    default: 'single'
  },
  user: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  },
  botList: {
    type: Array as () => Array<{ label: string; value: number | string }>,
    default: () => []
  }
})
console.log('props', props)
const emit = defineEmits(['update:modelValue', 'success'])

const { required } = useValidator()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const router = useRouter()

const dialogTitle = computed(() => (props.type === 'single' ? '发送消息' : '群发消息'))

const checkList = ref<(number | string)[]>([])
const menuList = ref<MenuItem[]>([])
const currentFilterType = ref<'user_custom' | 'all_user'>('user_custom')

// 新增：图片上传相关状态
const fileListRef = ref<UploadUserFile[]>([])
const fileToUpload = ref<File | null>(null) // 只保存 File

const showImageViewer = ref(false)
const imageViewerSrcList = ref<string[]>([])

const handlePreview = (uploadFile: UploadUserFile) => {
  if (uploadFile.url) {
    imageViewerSrcList.value = [uploadFile.url]
    showImageViewer.value = true
  } else if (uploadFile.raw) {
    // Fallback if url is not present, create an object URL
    // ElUpload usually provides 'url' for previewable files
    const objectURL = URL.createObjectURL(uploadFile.raw)
    imageViewerSrcList.value = [objectURL]
    showImageViewer.value = true
    // Note: Manually created object URLs should ideally be revoked when no longer needed
    // For simplicity here, we rely on ElUpload providing the URL or the browser handling GC.
  } else {
    ElMessage.warning('无法预览图片，缺少图片URL')
  }
}

// 文件选择变化
const handleFileChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  if (fileList.length > 1) {
    ElMessage.warning('只能上传一张图片')
    fileListRef.value = [fileList[fileList.length - 1]]
    fileToUpload.value = fileList[fileList.length - 1].raw || null
  } else if (fileList.length === 1) {
    fileToUpload.value = fileList[0].raw || null
    fileListRef.value = [fileList[0]]
  } else {
    fileToUpload.value = null
    fileListRef.value = []
  }
}

// 移除图片
const handleImageRemove = () => {
  fileToUpload.value = null
  fileListRef.value = []
  ElMessage.info('图片已移除')
  return true
}

// 用户信息 Descriptions 配置
const userDescriptionSchema = computed<DescriptionsSchema[]>(() => [
  { field: 'bot_user_name', label: '机器人名称' },
  { field: 'bot_first_name', label: '机器人用户名' },
  { field: 'tg_user_name', label: 'TG用户昵称' },
  { field: 'tg_user_id', label: 'TG用户ID' }
])

// 表单相关
const { formRegister: messageFormRegister, formMethods } = useForm()
const { getFormData, setValues } = formMethods

const getContent = async () => (await getFormData())?.content || ''
const setContent = async (newContent: string) => await setValues({ content: newContent })
const { renderFormattingButtons } = useHtmlInsert(getContent, setContent)

// 获取内联菜单列表 - 使用新接口 v1GetInlineButtonList，锁定 menu_type 为 2
const fetchMenuList = async () => {
  try {
    const res = await v1GetInlineButtonList({
      menu_type: 2, // 锁定为内联按钮类型
      current_page: 1,
      page_size: 100 // 获取足够多的菜单项
    })

    console.log('res', res)
    if (res.code === '000000' && res.data) {
      menuList.value = res.data.list || []
    } else {
      menuList.value = []
    }
  } catch (error: any) {
    menuList.value = []
    console.error('获取内联菜单失败:', error)
    ElMessage.error('获取内联菜单失败: ' + (error?.msg || '未知错误'))
  }
}

// 根据类型动态生成表单配置
const formSchema = computed<FormSchema[]>(() => {
  const baseSchema: FormSchema[] = [
    {
      field: 'content',
      component: 'Input',
      label: '消息内容',
      colProps: { span: 24 },
      componentProps: {
        type: 'textarea',
        rows: 4,
        placeholder: '请输入消息内容',
        remark: renderFormattingButtons
      },
      formItemProps: {
        rules: [required('消息内容不能为空')]
      }
    },
    {
      field: 'image_upload_control',
      label: '上传图片',
      colProps: { span: 24 },
      formItemProps: {
        slots: {
          default: () => (
            <ElUpload
              action="#"
              listType="picture-card"
              limit={1}
              accept="image/png, image/jpeg, image/gif"
              autoUpload={false}
              fileList={fileListRef.value}
              onPreview={handlePreview}
              onChange={handleFileChange}
              onRemove={handleImageRemove}
              onExceed={() => ElMessage.warning('最多只能上传一张图片')}
              show-file-list={true}
            >
              {<BaseButton type="primary">选择图片</BaseButton>}
            </ElUpload>
          )
        }
      },
      hidden: () => {
        return props.type === 'single'
      }
    },
    {
      field: 'inline_buttons',
      component: 'CheckboxGroup',
      label: '内联按钮',
      colProps: { span: 24 },
      componentProps: {
        // 不使用 options，而是使用自定义 slot
      },
      formItemProps: {
        slots: {
          default: () => {
            return (
              <div class="flex flex-col gap-2 w-full">
                <BaseButton link type="primary" plain onClick={goToMenu} class="self-start">
                  去菜单管理添加
                </BaseButton>
                {menuList.value.length > 0 ? (
                  <ElCheckboxGroup v-model={checkList.value} class="flex flex-wrap gap-2">
                    {menuList.value.map((menu) => (
                      // 关键：在 ElCheckboxGroup 中，label 属性是选中时的值
                      // 不要同时设置 value 属性，只设置 label
                      <ElCheckbox key={menu.id} label={menu.id}>
                        {menu.menu_name}
                      </ElCheckbox>
                    ))}
                  </ElCheckboxGroup>
                ) : (
                  <p class="text-gray-500 text-sm m-0">
                    暂无可用的内联按钮，请先前往菜单管理添加。
                  </p>
                )}
              </div>
            )
          }
        }
      }
    }
  ]

  if (props.type === 'mass') {
    const massSpecificSchemaItems: FormSchema[] = [
      {
        field: 'bot_id',
        component: 'Select',
        label: '选择机器人',
        colProps: { span: 12 },
        componentProps: {
          options: props.botList,
          placeholder: '请选择机器人'
        },
        formItemProps: {
          rules: [required('请选择机器人')]
        }
      },
      {
        field: 'filter_type',
        component: 'RadioGroup',
        label: '接受用户',
        value: 'user_custom',
        colProps: { span: 12 },
        componentProps: {
          options: [
            { label: '自定义', value: 'user_custom' },
            { label: '全部', value: 'all_user' }
          ],
          onChange: async (value: 'user_custom' | 'all_user') => {
            currentFilterType.value = value
            if (value === 'all_user') {
              const formData = await formMethods.getFormData()
              if (formData && Object.prototype.hasOwnProperty.call(formData, 'user_list')) {
                formMethods.setValues({ user_list: undefined })
              }
            }
          }
        },
        formItemProps: {
          rules: [required('请选择接受用户类型')]
        }
      }
    ]

    if (currentFilterType.value === 'user_custom') {
      massSpecificSchemaItems.push({
        field: 'user_list',
        component: 'Input',
        label: 'TG用户id列表',
        colProps: { span: 24 },
        componentProps: {
          type: 'textarea',
          rows: 3,
          placeholder: '请输入TG用户id，多个用英文逗号隔开'
        },
        formItemProps: {
          rules: [
            {
              required: true,
              validator: (_rule, value, callback) => {
                if (currentFilterType.value === 'user_custom' && !value) {
                  callback(new Error('自定义用户时，TG用户id列表不能为空'))
                } else {
                  callback()
                }
              }
            }
          ]
        }
      })
    }
    return [...massSpecificSchemaItems, ...baseSchema]
  } else {
    return baseSchema
  }
})

// 监听对话框打开，获取机器人列表和内联菜单
watch(
  () => dialogVisible.value,
  async (val) => {
    if (val) {
      await fetchMenuList()
      const elForm = await formMethods.getElFormExpose()
      elForm?.resetFields()
      checkList.value = []
      fileToUpload.value = null
      fileListRef.value = []

      if (props.type === 'mass') {
        currentFilterType.value = 'user_custom'
      } else if (props.type === 'single') {
        // Handle prefill for single message if needed in the future
      }
    } else {
      menuList.value = []
    }
  },
  { immediate: true }
)

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false
}

const goToMenu = () => {
  router.push('/bot_manage/menu_list')
  dialogVisible.value = false
}

// 提交消息
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()
  if (!elForm) {
    ElMessage.error('表单实例获取失败')
    return
  }

  await elForm.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()
    submitting.value = true

    // 先上传图片
    let imageUrl = ''
    if (fileToUpload.value) {
      const formDataObj = new FormData()
      formDataObj.append('file', fileToUpload.value)
      try {
        const res = await uploadAPI(formDataObj)
        console.log('图片上传响应:', res)

        // 从返回值中获取 filename
        if (res && res.data && res.data.filename) {
          // 使用当前浏览器的域名拼接 filename
          const browserOrigin = window.location.origin
          imageUrl = `${browserOrigin}/${res.data.filename}`
          console.log('拼接后的图片URL:', imageUrl)
        } else {
          ElMessage.error('图片上传失败，未返回文件名')
          submitting.value = false
          return
        }
      } catch (error: any) {
        console.error('图片上传错误:', error)
        ElMessage.error('图片上传失败: ' + (error?.message || '请重试'))
        submitting.value = false
        return
      }
    }

    // 从 checkList 中提取纯数字 ID
    const keyboards = checkList.value
      .map((item: any) => {
        // 如果是对象，提取 id 属性
        if (typeof item === 'object' && item !== null && 'id' in item) {
          return Number(item.id)
        }
        // 如果是数字或字符串，直接转换
        return typeof item === 'number' ? item : Number(item)
      })
      .filter((id: number) => !isNaN(id))

    console.log('checkList.value:', checkList.value)
    console.log('keyboards (纯数字数组):', keyboards)

    try {
      if (props.type === 'single') {
        // 使用新接口 v1SendMessage
        const apiParams: any = {
          user_id: props.user?.id,
          content: formData.content
        }
        if (keyboards.length > 0) {
          apiParams.keyboards = keyboards
        }
        // 注意：单个消息发送接口不支持图片，如果有图片需求需要确认后端接口
        await v1SendMessage(apiParams)
      } else {
        // 群发 - 使用新接口 v1SendGroupMessage
        const apiParams: any = {
          bot_id: Number(formData.bot_id),
          receive_type: formData.filter_type,
          content: formData.content
        }

        if (keyboards.length > 0) {
          apiParams.keyboards = keyboards
        }
        if (imageUrl) {
          apiParams.image = imageUrl
        }

        if (formData.filter_type === 'user_custom') {
          if (formData.user_list) {
            const tgUserIdsArray = formData.user_list
              .split(',')
              .map((id) => Number(id.trim()))
              .filter((id) => !isNaN(id) && id !== 0)
            if (tgUserIdsArray.length > 0) {
              apiParams.tg_user_ids = tgUserIdsArray
            } else {
              ElMessage.error('自定义用户列表解析后为空或格式不正确，请检查输入')
              submitting.value = false
              return
            }
          } else {
            // 这个分支理论上会被表单校验的 validator 阻止，但作为保险
            ElMessage.error('自定义用户时，TG用户id列表不能为空')
            submitting.value = false
            return
          }
        }
        // 对于非 'user_custom' 类型，tg_user_ids 不需要传递

        await v1SendGroupMessage(apiParams)
      }

      emit('success')
      ElMessage.success(`${props.type === 'single' ? '消息' : '群发消息'}发送成功`)
      dialogVisible.value = false
    } catch (error: any) {
      console.error('消息发送失败:', error)
      const errorMsg = error?.response?.data?.msg || error?.message || '消息发送失败，请重试'
      ElMessage.error(errorMsg)
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  // if (dialogVisible.value) {
  //   fetchMenuList();
  // }
})
</script>
