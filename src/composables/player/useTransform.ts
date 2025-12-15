import type { CSSProperties } from 'vue'
import type { PlayerContext } from './usePlayerProvide'
import { useElementSize } from '@vueuse/core'
import { computed, shallowRef, watch, watchEffect } from 'vue'
import { transformPreferenceCache } from '../../utils/cache'
import { error, log } from '../../utils/logger'

/**
 * 计算旋转视频后的缩放比例，使视频在容器中保持原始比例且不超出容器
 * @param videoWidth 视频宽度
 * @param videoHeight 视频高度
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @param angle 旋转角度（度）
 * @returns 缩放比例
 */
function calculateScale(videoWidth: number, videoHeight: number, containerWidth: number, containerHeight: number, angle: number) {
  /** 如果视频尺寸或容器尺寸无效，返回默认缩放 */
  if (!videoWidth || !videoHeight || !containerWidth || !containerHeight) {
    console.error('计算旋转视频缩放比例时，视频尺寸或容器尺寸无效，返回默认缩放1')
    return 1
  }

  /** 当角度为 0 或 180 的倍数时，不需要额外缩放，objectFit: contain 会自动处理 */
  const normalizedAngle = Math.abs(angle) % 180
  if (normalizedAngle === 0) {
    return 1
  }

  /** 角度转弧度 */
  const radians = (angle * Math.PI) / 180
  /** 绝对值处理镜像情况 */
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))

  /** 计算视频在容器中 contain 模式下的实际显示尺寸 */
  const videoRatio = videoWidth / videoHeight
  const containerRatio = containerWidth / containerHeight

  let actualVideoWidth: number
  let actualVideoHeight: number

  if (videoRatio > containerRatio) {
    // 视频更宽，以容器宽度为准
    actualVideoWidth = containerWidth
    actualVideoHeight = containerWidth / videoRatio
  }
  else {
    // 视频更高，以容器高度为准
    actualVideoHeight = containerHeight
    actualVideoWidth = containerHeight * videoRatio
  }

  /** 计算旋转后视频的包围盒尺寸 */
  const rotatedWidth = actualVideoWidth * cos + actualVideoHeight * sin
  const rotatedHeight = actualVideoWidth * sin + actualVideoHeight * cos

  /** 计算缩放比例，确保旋转后的视频完整显示在容器内 */
  const scaleW = containerWidth / rotatedWidth
  const scaleH = containerHeight / rotatedHeight
  const scale = Math.min(scaleW, scaleH)

  return scale
}

/** 画面转换 */
export function useTransform(_ctx: PlayerContext) {
  /** 旋转角度 */
  const ROTATE_ANGLE = 90
  /** 最大旋转角度 */
  const MAX_ROTATE_ANGLE = 270
  /** 旋转角度 */
  const rotate = shallowRef(0)
  /** 水平翻转 */
  const flipX = shallowRef(false)
  /** 垂直翻转 */
  const flipY = shallowRef(false)
  /** 播放器元素尺寸 */
  const playerSize = useElementSize(_ctx.refs.playerElementRef)
  /** 缩放比例 */
  const scale = computed(() => {
    return calculateScale(
      _ctx.playerCore.value?.videoWidth ?? 16,
      _ctx.playerCore.value?.videoHeight ?? 9,
      playerSize.width.value,
      playerSize.height.value,
      rotate.value,
    )
  })
  /** 样式 */
  const style = computed((): CSSProperties => {
    const transforms = [
      `rotate(${rotate.value}deg)`,
      `scale(${scale.value * (flipX.value ? -1 : 1)}, ${scale.value * (flipY.value ? -1 : 1)})`,
      'translateZ(0)',
    ]

    return {
      transform: transforms.join(' '),
    }
  })

  /** 左旋转是否禁用 */
  const isLeftDisabled = computed(() => {
    // 使用严格相等确保在-270度时禁用
    return rotate.value === -MAX_ROTATE_ANGLE
  })

  /** 右旋转是否禁用 */
  const isRightDisabled = computed(() => {
    // 使用严格相等确保在270度时禁用
    return rotate.value === MAX_ROTATE_ANGLE
  })

  /** 保存偏好设置 */
  const savePreference = async () => {
    const videoId = _ctx.rootProps.videoId
    if (videoId) {
      try {
        await transformPreferenceCache.setPreference(
          videoId,
          rotate.value,
          flipX.value,
          flipY.value,
        )
        log('旋转翻转偏好已保存')
      }
      catch (err) {
        error('保存旋转翻转偏好失败:', err)
      }
    }
  }

  /** 加载偏好设置 */
  const loadPreference = async () => {
    const videoId = _ctx.rootProps.videoId
    if (videoId) {
      try {
        const preference = await transformPreferenceCache.getPreference(videoId)
        if (preference) {
          rotate.value = preference.rotate
          flipX.value = preference.flipX
          flipY.value = preference.flipY
        }
      }
      catch (err) {
        error('加载旋转翻转偏好失败:', err)
      }
    }
  }

  /** 左旋转 */
  const left = () => {
    // 如果已经达到最小角度，不执行操作
    if (rotate.value <= -MAX_ROTATE_ANGLE)
      return
    /** 计算新角度 */
    const newAngle = rotate.value - ROTATE_ANGLE
    // 确保不超过最大角度
    rotate.value = Math.max(newAngle, -MAX_ROTATE_ANGLE)
  }

  /** 右旋转 */
  const right = () => {
    // 如果已经达到最大角度，不执行操作
    if (rotate.value >= MAX_ROTATE_ANGLE)
      return
    /** 计算新角度 */
    const newAngle = rotate.value + ROTATE_ANGLE
    // 确保不超过最大角度
    rotate.value = Math.min(newAngle, MAX_ROTATE_ANGLE)
  }

  /** 正常 */
  const normal = () => {
    rotate.value = 0
    flipX.value = false
    flipY.value = false
  }

  /** 水平翻转 */
  const toggleFlipX = () => {
    flipX.value = !flipX.value
  }

  /** 垂直翻转 */
  const toggleFlipY = () => {
    flipY.value = !flipY.value
  }

  /** 监听视频ID变化，加载对应的偏好设置 */
  watchEffect(() => {
    const videoId = _ctx.rootProps.videoId
    if (videoId) {
      loadPreference()
    }
  })

  /** 监听设置变化，自动保存偏好 */
  watch([rotate, flipX, flipY], () => {
    // 延迟保存，避免频繁写入
    setTimeout(() => {
      savePreference()
    }, 100)
  })

  return {
    rotate,
    flipX,
    flipY,
    left,
    right,
    normal,
    toggleFlipX,
    toggleFlipY,
    isLeftDisabled,
    isRightDisabled,
    transformStyle: style,
  }
}
