<template>
  <div
    :class="[styles.btnText.root]"
    class="pointer-events-none"
    :data-tip="`核心: ${playerCore?.type || 'N/A'} | ${frameInfo}`"
  >
    <span class="text-xs opacity-80">
      {{ playerCore?.type || 'N/A' }}
    </span>
    <span class="text-xs opacity-60 ml-2">
      {{ frameInfo }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePlayerContext } from '../../../composables/player/usePlayerProvide'
import { controlStyles } from '../styles/common'

const styles = {
  ...controlStyles,
}

const { playerCore } = usePlayerContext()
const frameInfo = ref('--')
let lastFrameCount = 0
let lastCheckTime = 0
let updateTimer: number | null = null

/** 获取视频播放质量信息 */
function updateFrameInfo() {
  const videoEl = playerCore.value?.getRenderElement()

  if (videoEl instanceof HTMLVideoElement && videoEl.getVideoPlaybackQuality) {
    const quality = videoEl.getVideoPlaybackQuality()
    const currentFrames = quality.totalVideoFrames
    const currentTime = performance.now()

    // 计算实时帧率（FPS）
    if (lastCheckTime > 0 && currentFrames > lastFrameCount) {
      /** 转换为秒 */
      const timeDiff = (currentTime - lastCheckTime) / 1000
      const frameDiff = currentFrames - lastFrameCount
      const fps = Math.round(frameDiff / timeDiff)

      frameInfo.value = `${fps}fps`
    }

    lastFrameCount = currentFrames
    lastCheckTime = currentTime
  }

  // 每2秒更新一次（降低频率，避免影响性能）
  updateTimer = window.setTimeout(updateFrameInfo, 2000)
}

onMounted(() => {
  // 延迟启动，等视频开始播放
  updateTimer = window.setTimeout(updateFrameInfo, 2000)
})

onBeforeUnmount(() => {
  if (updateTimer !== null) {
    clearTimeout(updateTimer)
  }
})
</script>
