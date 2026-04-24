<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="el-image-viewer__wrapper"
      style="z-index: 3000"
      @click.self="handleClose"
    >
      <div class="el-image-viewer__mask" @click="handleClose"></div>

      <!-- 关闭按钮 -->
      <span class="el-image-viewer__btn el-image-viewer__close" @click="handleClose">
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
        <div v-if="videoUrl" class="video-preview-wrapper" @click.stop>
          <video
            v-if="visible"
            ref="videoPlayerRef"
            class="video-js vjs-default-skin vjs-big-play-centered"
            controls
            preload="auto"
          >
            <p class="vjs-no-js">您的浏览器不支持视频播放，请升级浏览器。</p>
          </video>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible'])

const videoPlayerRef = ref<HTMLVideoElement | null>(null)
let player: Player | null = null

// 初始化 Video.js 播放器
const initVideoPlayer = () => {
  // 先清理旧的播放器实例
  disposeVideoPlayer()

  // 等待下一帧再初始化，确保 DOM 完全更新
  setTimeout(() => {
    if (videoPlayerRef.value && props.videoUrl) {
      try {
        player = videojs(videoPlayerRef.value, {
          controls: true,
          autoplay: true,
          preload: 'auto',
          fluid: true,
          aspectRatio: '16:9',
          language: 'zh-CN',
          playbackRates: [0.5, 1, 1.5, 2],
          controlBar: {
            volumePanel: {
              inline: false
            }
          },
          sources: [
            {
              src: props.videoUrl,
              type: 'video/mp4'
            }
          ]
        })
      } catch (error) {
        console.error('Video.js 初始化失败:', error)
      }
    }
  }, 100)
}

// 销毁 Video.js 播放器
const disposeVideoPlayer = () => {
  if (player) {
    try {
      player.dispose()
    } catch (error) {
      console.error('Video.js 销毁失败:', error)
    } finally {
      player = null
    }
  }
}

// 关闭视频预览
const handleClose = () => {
  disposeVideoPlayer()
  emit('update:visible', false)
}

// 监听视频预览弹窗打开，初始化播放器
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      await nextTick()
      // 再等待一帧，确保 v-if 创建的元素和 ref 都已更新
      await nextTick()
      initVideoPlayer()
    } else {
      disposeVideoPlayer()
    }
  }
)

// 组件卸载时清理播放器
onBeforeUnmount(() => {
  disposeVideoPlayer()
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

/* Video.js 播放器容器 */
.video-preview-wrapper {
  width: 100%;
  max-width: 90vw;
  max-height: 90vh;
}

.video-preview-wrapper .video-js {
  width: 100%;
  height: auto;
  max-height: 90vh;
}

/* Video.js 自定义样式 */
.video-js .vjs-big-play-button {
  width: 3em;
  height: 1.5em;
  font-size: 3em;
  line-height: 1.5em;
  background-color: rgb(0 0 0 / 70%);
  border: 0.0667em solid rgb(255 255 255 / 80%);
  border-radius: 0.3em;
}

.video-js:hover .vjs-big-play-button,
.video-js .vjs-big-play-button:focus {
  background-color: rgb(0 0 0 / 90%);
}
</style>
