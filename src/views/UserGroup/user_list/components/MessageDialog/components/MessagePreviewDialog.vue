<template>
  <Dialog v-model="visible" title="消息预览" width="650px">
    <div class="message-preview-container">
      <!-- 机器人信息 -->
      <div
        v-if="previewData.botName || (previewData.botNames && previewData.botNames.length > 0)"
        class="preview-item"
      >
        <div class="item-label">发送机器人</div>
        <div v-if="previewData.botNames && previewData.botNames.length > 0" class="item-value">
          <div v-for="(name, index) in previewData.botNames" :key="index" class="bot-name-item">
            {{ name }}
          </div>
        </div>
        <div v-else class="item-value">{{ previewData.botName }}</div>
      </div>

      <!-- 接收用户信息 -->
      <div v-if="previewData.recipientInfo" class="preview-item">
        <div class="item-label">接收用户</div>
        <div class="item-value">{{ previewData.recipientInfo }}</div>
      </div>

      <!-- 消息内容 -->
      <div v-if="previewData.content" class="preview-item">
        <div class="item-label">消息内容</div>
        <div class="item-value content-box">{{ previewData.content }}</div>
      </div>

      <!-- 图片/视频预览 -->
      <div v-if="previewData.files && previewData.files.length > 0" class="preview-item">
        <div class="item-label">文件 ({{ previewData.files.length }})</div>
        <div class="files-container">
          <div v-for="(file, index) in previewData.files" :key="index" class="file-item">
            <!-- 图片预览 -->
            <img v-if="file.type === 'image'" :src="file.url" class="file-image" alt="图片" />
            <!-- 视频预览 -->
            <div v-else-if="file.type === 'video'" class="file-video">
              <video :src="file.url" class="video-element" muted></video>
              <div class="video-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内联按钮预览 -->
      <div v-if="previewData.buttons && previewData.buttons.length > 0" class="preview-item">
        <div class="item-label">内联按钮 ({{ previewData.buttons.length }})</div>
        <div class="buttons-container">
          <div v-for="(button, index) in previewData.buttons" :key="index" class="button-item">
            {{ button.text }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleConfirm"> 确认发送 </ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElButton } from 'element-plus'
import { Dialog } from '@/components/Dialog'

export interface MessagePreviewData {
  botName?: string
  botNames?: string[] // 多个机器人名称数组
  recipientInfo?: string
  content?: string
  files?: Array<{ type: 'image' | 'video'; url: string; name: string }>
  buttons?: Array<{ text: string; url?: string }>
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  previewData: {
    type: Object as () => MessagePreviewData,
    default: () => ({})
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.message-preview-container {
  max-height: 65vh;
  padding: 8px 4px;
  overflow-y: auto;
}

/* 预览项 */
.preview-item {
  margin-bottom: 24px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.item-label {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  align-items: center;
}

.item-label::before {
  display: inline-block;
  width: 3px;
  height: 14px;
  margin-right: 8px;
  background: #409eff;
  border-radius: 2px;
  content: '';
}

.item-value {
  padding-left: 11px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

/* 机器人名称列表 */
.bot-name-item {
  padding: 6px 12px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #303133;
  background: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.bot-name-item:last-child {
  margin-bottom: 0;
}

/* 消息内容框 */
.content-box {
  min-height: 60px;
  padding: 14px 16px;
  line-height: 1.8;
  color: #303133;
  word-break: break-word;
  white-space: pre-wrap;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 文件容器 */
.files-container {
  display: grid;
  max-width: 100%;
  padding-left: 11px;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.file-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  background: #f5f7fa;
  border-radius: 6px;
  box-shadow: 0 1px 6px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
}

.file-image,
.file-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.file-image {
  object-fit: cover;
}

.file-video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 44px;
  height: 44px;
  pointer-events: none;
  background: rgb(0 0 0 / 65%);
  border: 2px solid rgb(255 255 255 / 90%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(4px);
  align-items: center;
  justify-content: center;
}

.video-icon svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
  color: #fff;
}

/* 按钮容器 */
.buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-left: 11px;
}

.button-item {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: default;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(64 158 255 / 25%);
  transition: all 0.3s ease;
}

.button-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(64 158 255 / 35%);
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样式 */
.message-preview-container::-webkit-scrollbar {
  width: 6px;
}

.message-preview-container::-webkit-scrollbar-thumb {
  background-color: rgb(0 0 0 / 15%);
  border-radius: 3px;
}

.message-preview-container::-webkit-scrollbar-thumb:hover {
  background-color: rgb(0 0 0 / 25%);
}

.message-preview-container::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
