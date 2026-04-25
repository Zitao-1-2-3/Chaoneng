<template>
  <Dialog v-model="visible" title="消息预览" width="650px">
    <div class="message-preview-wrapper">
      <!-- 机器人信息 -->
      <div
        v-if="previewData.botName || (previewData.botNames && previewData.botNames.length > 0)"
        class="preview-info-item"
      >
        <div class="info-label">发送机器人</div>
        <div v-if="previewData.botNames && previewData.botNames.length > 0" class="info-value">
          <div v-for="(name, index) in previewData.botNames" :key="index" class="bot-name-tag">
            {{ name }}
          </div>
        </div>
        <div v-else class="info-value">{{ previewData.botName }}</div>
      </div>

      <!-- 接收用户信息 -->
      <div v-if="previewData.recipientInfo" class="preview-info-item">
        <div class="info-label">接收用户</div>
        <div class="info-value">{{ previewData.recipientInfo }}</div>
      </div>

      <!-- Telegram 风格消息预览 -->
      <div class="telegram-preview-section">
        <div class="section-label">消息预览：</div>
        <div class="telegram-message-container">
          <!-- 如果有文件，遍历显示 -->
          <template v-if="previewData.files && previewData.files.length > 0">
            <div
              v-for="(file, index) in previewData.files"
              :key="`file-${index}`"
              class="telegram-message-card"
            >
              <!-- 图片/视频 -->
              <div class="telegram-media-container">
                <template v-if="file.type === 'video'">
                  <video
                    :src="file.url"
                    class="telegram-media-content"
                    muted
                    preload="metadata"
                    disablePictureInPicture
                    controlslist="nodownload noremoteplayback"
                  ></video>
                  <div class="telegram-video-icon">▶</div>
                </template>
                <template v-else>
                  <img :src="file.url" class="telegram-media-content" alt="图片" />
                </template>
              </div>

              <!-- 只在最后一个文件上显示文字内容和内联按钮 -->
              <template v-if="index === previewData.files.length - 1">
                <!-- 文字内容 -->
                <div v-if="previewData.content" class="telegram-message-text">
                  {{ previewData.content }}
                </div>

                <!-- 内联按钮 -->
                <div
                  v-if="previewData.buttons && previewData.buttons.length > 0"
                  class="telegram-inline-buttons"
                >
                  <div
                    v-for="(button, btnIndex) in previewData.buttons"
                    :key="btnIndex"
                    class="telegram-inline-button"
                  >
                    {{ button.text }}
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- 如果没有文件，只显示文字和按钮 -->
          <template v-else>
            <div class="telegram-message-card text-only">
              <!-- 文字内容 -->
              <div v-if="previewData.content" class="telegram-message-text">
                {{ previewData.content }}
              </div>
              <div v-else class="telegram-message-text empty">无文字内容</div>

              <!-- 内联按钮 -->
              <div
                v-if="previewData.buttons && previewData.buttons.length > 0"
                class="telegram-inline-buttons"
              >
                <div
                  v-for="(button, btnIndex) in previewData.buttons"
                  :key="btnIndex"
                  class="telegram-inline-button"
                >
                  {{ button.text }}
                </div>
              </div>
            </div>
          </template>
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
.message-preview-wrapper {
  max-height: 65vh;
  padding: 8px 4px;
  overflow-y: auto;
}

/* 信息项样式 */
.preview-info-item {
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.info-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.bot-name-tag {
  display: inline-block;
  padding: 4px 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 4px;
}

/* Telegram 预览区域 */
.telegram-preview-section {
  margin-top: 24px;
}

.section-label {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* Telegram 消息容器 */
.telegram-message-container {
  display: flex;
  min-height: 200px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.telegram-message-card {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin-bottom: 8px;
  overflow: hidden;
  background: #dcf8c6;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
  align-self: center;
}

.telegram-message-card.text-only {
  /* 与有文件时保持相同宽度 */
  width: 100%;
  max-width: 100%;
  align-self: center;
}

.telegram-media-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #000;
  border-radius: 8px 8px 0 0;
}

.telegram-media-content {
  display: block;
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
}

.telegram-video-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 40px;
  color: white;
  text-shadow: 0 0 8px rgb(0 0 0 / 80%);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.telegram-message-text {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #000;
  word-break: break-word;
  white-space: pre-wrap;
}

.telegram-message-text.empty {
  font-style: italic;
  color: #909399;
}

.telegram-inline-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px 8px;
}

.telegram-inline-button {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #08c;
  text-align: center;
  cursor: default;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.telegram-inline-button:hover {
  background: #f5f5f5;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样式 */
.message-preview-wrapper::-webkit-scrollbar {
  width: 6px;
}

.message-preview-wrapper::-webkit-scrollbar-thumb {
  background-color: rgb(0 0 0 / 15%);
  border-radius: 3px;
}

.message-preview-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: rgb(0 0 0 / 25%);
}

.message-preview-wrapper::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
