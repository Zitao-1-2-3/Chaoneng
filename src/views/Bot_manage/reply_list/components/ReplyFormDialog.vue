<template>
  <Dialog
    v-if="props.modelValue"
    :model-value="props.modelValue"
    @update:modelValue="handleModelUpdate"
    :title="dialogTitle"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <Form
      ref="formComponentRef"
      :schema="formSchema"
      :rules="formRules"
      @register="formRegister"
      label-width="100px"
    />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, watch, computed, type PropType, nextTick } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, type FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import type { ReplyItem, ReplySaveParams, BotOption } from '@/api/reply_list/types'
import { useHtmlInsert } from '@/hooks/web/useHtmlInsert'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  rowData: { type: Object as PropType<ReplyItem | null>, default: null },
  botOptions: { type: Array as PropType<BotOption[]>, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const { required } = useValidator()
const { formRegister, formMethods } = useForm()
const { getElFormExpose, setValues, getFormData } = formMethods
const formComponentRef = ref<InstanceType<typeof Form> | null>(null)

const submitLoading = ref(false)

const dialogTitle = computed(() => (props.isEdit ? '编辑关键词回复' : '新增关键词回复'))

const getContent = async () => (await getFormData())?.content || ''
const setContent = async (newContent: string) => await setValues({ content: newContent })
const { renderFormattingButtons } = useHtmlInsert(getContent, setContent)

const formSchema = computed<FormSchema[]>(() => {
  const baseSchema: FormSchema[] = [
    {
      field: 'content',
      label: '回复内容',
      component: 'Input',
      componentProps: {
        type: 'textarea',
        rows: 5,
        placeholder: '请输入回复内容',
        remark: renderFormattingButtons
      },
      colProps: { span: 24 }
    } as any,
    {
      field: 'status',
      label: '状态',
      component: 'RadioButton',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 2 }
        ]
      },
      value: 1, // Default for add mode, will be overwritten by setValues in edit mode
      colProps: { span: 24 }
    }
  ]

  if (props.isEdit) {
    return baseSchema // Edit mode: only content and status
  } else {
    // Add mode: include bot_id and keyword at the beginning
    return [
      {
        field: 'bot_id',
        label: '机器人',
        component: 'Select',
        componentProps: {
          placeholder: '请选择机器人',
          options: props.botOptions,
          filterable: true
        },
        colProps: { span: 24 }
      },
      {
        field: 'keyword',
        label: '关键词',
        component: 'Input',
        componentProps: {
          placeholder: '请输入关键词'
        },
        colProps: { span: 24 }
      },
      ...baseSchema
    ]
  }
})

const formRules = computed(() => {
  const rules: Record<string, any[]> = {
    content: [required('回复内容不能为空')],
    status: [required('请选择状态')]
  }
  if (!props.isEdit) {
    rules.bot_id = [required('请选择机器人')]
    rules.keyword = [required('关键词不能为空')]
  }
  return rules
})

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      const elForm = await getElFormExpose()
      // Ensure schema is updated before resetting fields
      await nextTick()
      elForm?.resetFields()

      if (props.isEdit && props.rowData) {
        const formValuesToSet = {
          // Only set fields that are visible in edit mode's schema
          content: props.rowData.content,
          status: props.rowData.status
        }
        setValues(formValuesToSet)
      } else {
        // Add mode
        setValues({
          // bot_id and keyword are part of schema in add mode
          bot_id: props.botOptions.length > 0 ? props.botOptions[0].value : undefined,
          keyword: '',
          content: '', // Default content for add mode
          status: 1 // Default status for add mode
        })
      }
    }
  }
)

const handleModelUpdate = (value: boolean) => {
  emit('update:modelValue', value)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  const elForm = await getElFormExpose()
  elForm?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let params: ReplySaveParams

        if (props.isEdit && props.rowData?.id) {
          const editFormData = (await getFormData()) as { content?: string; status?: number }
          if (
            typeof props.rowData.tg_bot_id !== 'number' ||
            typeof props.rowData.key_name !== 'string'
          ) {
            ElMessage.error('无法编辑：原始机器人ID或关键词信息丢失')
            submitLoading.value = false
            return
          }
          const originalKeyName = props.rowData.key_name.trim()
          params = {
            id: props.rowData.id,
            tg_bot_id: props.rowData.tg_bot_id,
            key_name: originalKeyName ? [originalKeyName] : [],
            content: editFormData.content,
            status: editFormData.status!
          }
        } else {
          const addFormData = (await getFormData()) as {
            bot_id?: string
            keyword?: string
            content?: string
            status?: number
          }
          const processedKeywords = addFormData.keyword
            ? addFormData.keyword
                .split(',')
                .map((k) => k.trim())
                .filter((k) => k)
            : []
          const botIdAsNumber = Number(addFormData.bot_id!)
          if (isNaN(botIdAsNumber)) {
            ElMessage.error('机器人ID无效，请重新选择')
            submitLoading.value = false
            return
          }
          params = {
            tg_bot_id: botIdAsNumber,
            key_name: processedKeywords,
            content: addFormData.content,
            status: addFormData.status!
          }
        }
        emit('submitted', params)
      } catch (error) {
        console.error('表单数据处理失败:', error)
        ElMessage.error('表单数据处理失败')
      } finally {
        submitLoading.value = false
      }
    } else {
      ElMessage.error('表单验证失败，请检查填写内容')
    }
  })
}

defineExpose({ submitLoading })
</script>

<style scoped>
/* Add any specific styles for the dialog form here */
</style>
