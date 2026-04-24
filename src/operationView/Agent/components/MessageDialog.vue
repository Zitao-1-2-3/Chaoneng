<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <Form :schema="formSchema" @register="messageFormRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">发送</ElButton>
      </div>
    </template>
  </Dialog>

  <!-- 图片预览 -->
  <ElImageViewer
    v-if="showImageViewer && previewFileType === 'image'"
    :url-list="imageViewerSrcList"
    @close="showImageViewer = false"
    :initial-index="0"
  />

  <!-- 视频预览（模仿图片查看器样式） -->
  <Teleport to="body">
    <div
      v-if="showVideoViewer && previewFileType === 'video'"
      class="el-image-viewer__wrapper"
      style="z-index: 3000"
      @click.self="closeVideoViewer"
    >
      <div class="el-image-viewer__mask" @click="closeVideoViewer"></div>

      <!-- 关闭按钮 -->
      <span class="el-image-viewer__btn el-image-viewer__close" @click="closeVideoViewer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <path
            fill="currentColor"
            d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
          />
        </svg>
      </span>

      <!-- 视频容器 -->
      <div
        class="el-image-viewer__canvas"
        style="display: flex; align-items: center; justify-content: center"
      >
        <video
          v-if="videoPreviewUrl"
          :src="videoPreviewUrl"
          controls
          autoplay
          style="max-width: 90vw; max-height: 90vh; outline: none"
          @click.stop
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </div>
  </Teleport>
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
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { v2SendGroupMessage, v2GetInlineButtonList } from '@/api/tgUser'
import { uploadFileV2 as uploadAPI } from '@/api/utils/upload' // 使用 v2 版本的上传接口
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
    type: String as () => 'mass' | 'single',
    default: 'mass'
  },
  user: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  },
  botList: {
    type: Array as () => Array<{ label: string; value: number | string }>,
    default: () => []
  },
  // 新增：自定义标题
  customTitle: {
    type: String,
    default: ''
  },
  // 新增：是否为单个用户发送（机器人信息只读）
  isSingleUser: {
    type: Boolean,
    default: false
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

const dialogTitle = computed(() => {
  // 如果有自定义标题，优先使用自定义标题
  if (props.customTitle) {
    return props.customTitle
  }
  // 否则默认使用"群发消息"
  return '群发消息'
})

const checkList = ref<(number | string)[]>([])
const menuList = ref<MenuItem[]>([])
const currentFilterType = ref<'user_custom' | 'all_user'>('user_custom')

// 新增：文件上传相关状态（支持图片和视频）
const fileListRef = ref<UploadUserFile[]>([])
const fileToUpload = ref<File | null>(null) // 只保存 File

const showImageViewer = ref(false)
const imageViewerSrcList = ref<string[]>([])
const showVideoViewer = ref(false)
const videoPreviewUrl = ref('')
const previewFileType = ref<'image' | 'video'>('image')

// 关闭视频预览
const closeVideoViewer = () => {
  showVideoViewer.value = false
  // 清理 object URL 避免内存泄漏
  if (videoPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(videoPreviewUrl.value)
  }
  videoPreviewUrl.value = ''
}

// 判断文件类型
const getFileType = (file: File | UploadUserFile): 'image' | 'video' => {
  const fileName = file.name || ''
  const fileType = (file as File).type || (file as UploadUserFile).raw?.type || ''

  if (fileType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(fileName)) {
    return 'video'
  }
  return 'image'
}

const handlePreview = (uploadFile: UploadUserFile) => {
  const fileType = getFileType(uploadFile)
  previewFileType.value = fileType

  if (fileType === 'video') {
    // 视频预览
    if (uploadFile.url) {
      videoPreviewUrl.value = uploadFile.url
      showVideoViewer.value = true
    } else if (uploadFile.raw) {
      const objectURL = URL.createObjectURL(uploadFile.raw)
      videoPreviewUrl.value = objectURL
      showVideoViewer.value = true
    } else {
      ElMessage.warning('无法预览视频，缺少视频URL')
    }
  } else {
    // 图片预览
    if (uploadFile.url) {
      imageViewerSrcList.value = [uploadFile.url]
      showImageViewer.value = true
    } else if (uploadFile.raw) {
      const objectURL = URL.createObjectURL(uploadFile.raw)
      imageViewerSrcList.value = [objectURL]
      showImageViewer.value = true
    } else {
      ElMessage.warning('无法预览文件，缺少文件URL')
    }
  }
}

// 文件选择变化（支持图片和视频）
const handleFileChange = (_file: UploadUserFile, fileList: UploadUserFile[]) => {
  if (fileList.length > 1) {
    ElMessage.warning('只能上传一个文件')
    fileListRef.value = [fileList[fileList.length - 1]]
    fileToUpload.value = fileList[fileList.length - 1].raw || null
  } else if (fileList.length === 1) {
    const uploadFile = fileList[0]
    fileToUpload.value = uploadFile.raw || null

    // 为文件生成预览URL
    if (uploadFile.raw) {
      const fileType = getFileType(uploadFile.raw)

      if (fileType === 'video') {
        // 视频文件：生成 blob URL 用于预览
        const blobUrl = URL.createObjectURL(uploadFile.raw)
        uploadFile.url = blobUrl
      }
      // 图片文件会自动生成预览，不需要特殊处理
    }

    fileListRef.value = [uploadFile]
  } else {
    fileToUpload.value = null
    fileListRef.value = []
  }
}

// 移除文件
const handleImageRemove = () => {
  fileToUpload.value = null
  fileListRef.value = []
  ElMessage.info('文件已移除')
  return true
}

// 表单相关
const { formRegister: messageFormRegister, formMethods } = useForm()
const { getFormData, setValues } = formMethods

const getContent = async () => (await getFormData())?.content || ''
const setContent = async (newContent: string) => await setValues({ content: newContent })
const { renderFormattingButtons } = useHtmlInsert(getContent, setContent)

// 获取内联菜单列表 - 使用新接口 v2GetInlineButtonList，锁定 menu_type 为 2
const fetchMenuList = async () => {
  try {
    const res = await v2GetInlineButtonList({
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
      label: '上传图片/视频',
      colProps: { span: 24 },
      formItemProps: {
        slots: {
          default: () => (
            <div class="flex flex-col gap-2">
              <ElUpload
                action="#"
                listType="picture-card"
                limit={1}
                accept="image/png,image/jpeg,image/gif,video/mp4,video/avi,video/mov,video/quicktime"
                autoUpload={false}
                fileList={fileListRef.value}
                onPreview={handlePreview}
                onChange={handleFileChange}
                onRemove={handleImageRemove}
                onExceed={() => ElMessage.warning('最多只能上传一个文件')}
                show-file-list={true}
                v-slots={{
                  file: ({ file }: { file: UploadUserFile }) => {
                    const fileType = getFileType(file)
                    if (fileType === 'video' && file.url) {
                      // 视频文件显示视频第一帧作为缩略图
                      return (
                        <div
                          style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; cursor: pointer;"
                          onClick={() => handlePreview(file)}
                        >
                          <video
                            src={file.url}
                            style="width: 100%; height: 100%; object-fit: cover;"
                            muted
                            preload="metadata"
                          />
                          {/* 播放图标覆盖层 */}
                          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">
                            <svg
                              style="width: 48px; height: 48px; color: rgba(255,255,255,0.9); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));"
                              viewBox="0 0 1024 1024"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill="currentColor"
                                d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 832a384 384 0 0 0 0-768 384 384 0 0 0 0 768zm-48-247.616L668.608 512 464 375.616v272.768zm10.624-342.656 249.472 166.336a48 48 0 0 1 0 79.872L474.624 718.272A48 48 0 0 1 400 678.336V345.6a48 48 0 0 1 74.624-39.936z"
                              />
                            </svg>
                          </div>
                        </div>
                      )
                    }
                    // 图片文件使用默认显示
                    return null
                  }
                }}
              >
                {<BaseButton type="primary">选择文件</BaseButton>}
              </ElUpload>
              <p class="text-gray-500 text-sm m-0">
                支持图片（PNG、JPEG、GIF）和视频（MP4、AVI、MOV），最多上传一个文件
              </p>
            </div>
          )
        }
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
        component: props.isSingleUser ? 'Input' : 'Select', // 单个用户时使用 Input，群发时使用 Select
        label: '机器人',
        colProps: { span: 12 },
        componentProps: props.isSingleUser
          ? {
              // 单个用户模式：只读文本框
              disabled: true,
              placeholder: '当前机器人'
            }
          : {
              // 群发模式：下拉选择框
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
        hidden: props.isSingleUser, // 单个用户模式下隐藏
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
        label: props.isSingleUser ? 'TG用户ID' : 'TG用户id列表', // 单个用户模式改标签
        colProps: { span: 24 },
        componentProps: props.isSingleUser
          ? {
              // 单个用户模式：单行输入框，不可编辑
              disabled: true,
              placeholder: '当前用户TG ID'
            }
          : {
              // 群发模式：多行文本框
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

      // 如果是单个用户模式，自动填充机器人信息和用户ID
      if (props.isSingleUser && props.user) {
        currentFilterType.value = 'user_custom' // 固定为自定义

        // 从 botList 中查找当前用户的机器人信息
        const botInfo = props.botList.find((bot) => String(bot.value) === String(props.user.bot_id))
        if (botInfo) {
          // 设置机器人 ID 和显示文本，以及用户ID
          await formMethods.setValues({
            bot_id: botInfo.label, // 显示机器人名称
            filter_type: 'user_custom', // 固定为自定义
            user_list: String(props.user.tg_user_id) // 自动填充当前用户的TG ID
          })
        }
      } else {
        currentFilterType.value = 'user_custom'
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

    // 先上传文件（图片或视频）
    let fileUrl = ''
    if (fileToUpload.value) {
      const formDataObj = new FormData()
      formDataObj.append('file', fileToUpload.value)
      try {
        const res = await uploadAPI(formDataObj)
        console.log('文件上传响应:', res)

        // 从返回值中获取 filename 并拼接完整URL
        if (res && res.data && res.data.filename) {
          // 使用当前浏览器的域名拼接 filename
          const browserOrigin = window.location.origin
          fileUrl = `${browserOrigin}/${res.data.filename}`
          console.log('拼接后的文件URL:', fileUrl)
        } else {
          ElMessage.error('文件上传失败，未返回文件名')
          submitting.value = false
          return
        }
      } catch (error: any) {
        console.error('文件上传错误:', error)
        ElMessage.error('文件上传失败: ' + (error?.message || '请重试'))
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
      // 确定实际的 bot_id
      let actualBotId: number
      if (props.isSingleUser && props.user) {
        // 单个用户模式：使用用户的 bot_id
        actualBotId = Number(props.user.bot_id)
      } else {
        // 群发模式：使用表单选择的 bot_id
        actualBotId = Number(formData.bot_id)
      }

      // 群发 - 使用新接口 v2SendGroupMessage
      const apiParams: any = {
        bot_id: actualBotId,
        content: formData.content
      }

      // 添加内联按钮（如果有）
      if (keyboards.length > 0) {
        apiParams.keyboards = keyboards
      }

      // 添加文件URL（图片或视频）
      if (fileUrl) {
        apiParams.file_url = fileUrl
      }

      // 添加接收用户列表
      if (formData.filter_type === 'user_custom') {
        if (formData.user_list) {
          const tgUserIdsArray = formData.user_list
            .split(',')
            .map((id: string) => Number(id.trim()))
            .filter((id: number) => !isNaN(id) && id !== 0)
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
      // 对于 'all_user' 类型，不传递 tg_user_ids，表示发送给所有用户

      await v2SendGroupMessage(apiParams)

      emit('success')
      ElMessage.success('发送消息请求成功')
      dialogVisible.value = false
    } catch (error: any) {
      console.error('发送消息请求失败:', error)
      const errorMsg = error?.response?.data?.msg || error?.message || '发送消息请求失败，请重试'
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

<style scoped>
/* 视频预览器样式 - 模仿 ElImageViewer */
.el-image-viewer__wrapper {
  position: fixed;
  inset: 0;
}

.el-image-viewer__mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.5;
}

.el-image-viewer__btn {
  position: absolute;
  z-index: 1;
  display: flex;
  width: 44px;
  height: 44px;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  background-color: #606266;
  border-radius: 50%;
  opacity: 0.8;
  box-sizing: border-box;
  user-select: none;
  align-items: center;
  justify-content: center;
}

.el-image-viewer__btn:hover {
  opacity: 1;
}

.el-image-viewer__close {
  top: 40px;
  right: 40px;
  width: 44px;
  height: 44px;
}

.el-image-viewer__close svg {
  width: 24px;
  height: 24px;
}

.el-image-viewer__canvas {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
