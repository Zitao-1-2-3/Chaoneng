<template>
  <div class="file-uploader">
    <ElFormItem label="上传图片/视频">
      <div class="flex flex-col gap-2 w-full">
        <div
          v-if="fileList.length > 0"
          :style="{
            color: fileList.length >= 10 ? '#f56c6c' : '#409eff',
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '8px'
          }"
        >
          {{ fileList.length }}/10
        </div>
        <ElUpload
          action="#"
          list-type="picture-card"
          :limit="10"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,video/mp4,video/avi,video/mov,video/quicktime"
          :auto-upload="false"
          :file-list="fileList"
          :on-preview="handlePreview"
          :on-change="handleChange"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
          :show-file-list="true"
          class="compact-upload"
        >
          <template #file="{ file }">
            <div
              v-if="getFileType(file) === 'video' && file.url"
              class="video-thumbnail-wrapper"
              @click="handlePreview(file)"
            >
              <video
                :src="file.url"
                class="video-thumbnail"
                muted
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              ></video>
              <div class="play-icon-overlay">
                <svg class="play-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span class="el-upload-list__item-delete" @click.stop="handleRemove(file)">
                <svg class="el-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="currentColor"
                    d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
                  />
                </svg>
              </span>
            </div>
          </template>
          <BaseButton type="primary" size="small">选择文件</BaseButton>
        </ElUpload>
        <p class="text-gray-500 text-sm m-0">
          支持图片（PNG、JPEG、JPG、GIF、WEBP）和视频（MP4、AVI、MOV），最多上传 10 个文件
        </p>
      </div>
    </ElFormItem>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import { ElFormItem, ElUpload, ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { BaseButton } from '@/components/Button'

defineProps({
  fileList: {
    type: Array as PropType<UploadUserFile[]>,
    default: () => []
  }
})

const emit = defineEmits(['preview', 'change', 'remove'])

const getFileType = (file: File | UploadUserFile): 'image' | 'video' => {
  const fileName = file.name || ''
  const fileType = (file as File).type || (file as UploadUserFile).raw?.type || ''

  if (fileType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(fileName)) {
    return 'video'
  }
  return 'image'
}

const handlePreview = (uploadFile: UploadUserFile) => {
  emit('preview', uploadFile)
}

const handleChange = (file: UploadUserFile, fileList: UploadUserFile[]) => {
  emit('change', file, fileList)
}

const handleRemove = (file: UploadUserFile) => {
  emit('remove', file)
  return true
}

const handleExceed = () => {
  ElMessage.warning('最多只能上传 10 个文件')
}
</script>

<style scoped>
.file-uploader {
  position: relative;
  width: 100%;
}

.compact-upload :deep(.el-upload-list--picture-card) {
  --el-upload-list-picture-card-size: 80px;
}

.compact-upload :deep(.el-upload--picture-card) {
  --el-upload-picture-card-size: 80px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-upload :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
  margin: 0 8px 8px 0;
}

.video-thumbnail-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  align-items: center;
  justify-content: center;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail::-webkit-media-controls-panel {
  display: none !important;
}

/* stylelint-disable-next-line selector-pseudo-element-no-unknown */
.video-thumbnail::--webkit-media-controls-play-button {
  display: none !important;
}

.video-thumbnail::-webkit-media-controls {
  display: none !important;
}

.play-icon-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  width: 28px;
  height: 28px;
  pointer-events: none;
  background: rgb(0 0 0 / 60%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  align-items: center;
  justify-content: center;
}

.video-thumbnail-wrapper:hover .play-icon-overlay {
  background: rgb(0 0 0 / 75%);
  transform: translate(-50%, -50%) scale(1.1);
}

.play-icon {
  width: 14px;
  height: 14px;
  margin-left: 1px;
  color: #fff;
}

.el-upload-list__item-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 10;
  display: flex;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-color: rgb(0 0 0 / 50%);
  border-radius: 50%;
  opacity: 0;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}

.video-thumbnail-wrapper:hover .el-upload-list__item-delete {
  opacity: 1;
}

.el-upload-list__item-delete:hover {
  background-color: var(--el-color-danger);
}

.el-upload-list__item-delete .el-icon {
  width: 12px;
  height: 12px;
  color: #fff;
}
</style>
