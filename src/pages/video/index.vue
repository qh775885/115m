<template>
  <div :class="styles.container.main">
    <!-- 主内容区域 -->
    <div :class="styles.container.pageMain">
      <div
        :class="[
          styles.player.container,
          preferences.showPlaylist && styles.player.containerFold,
        ]"
      >
        <!-- 视频播放器 -->
        <XPlayer
          ref="xplayerRef"
          v-model:show-playlist="preferences.showPlaylist"
          v-model:volume="preferences.volume"
          v-model:muted="preferences.muted"
          v-model:playback-rate="preferences.playbackRate"
          v-model:auto-load-thumbnails="preferences.autoLoadThumbnails"
          v-model:disabled-h-d-r="preferences.disabledHDR"
          v-model:thumbnails-sampling-interval="preferences.thumbnailsSamplingInterval"
          v-model:auto-play="preferences.autoPlay"
          :class="[styles.player.video]"
          :style="{
            aspectRatio,
          }"
          :video-id="params.pickCode.value"
          :sources="DataVideoSources.list"
          :last-time="DataHistory.lastTime.value"
          :on-thumbnail-request="DataThumbnails.onThumbnailRequest"
          :on-timeupdate="handleTimeupdate"
          :on-seeking="DataHistory.handleSeek"
          :on-seeked="DataHistory.handleSeek"
          :on-canplay="handleStartAutoBuffer"
          :get-current-playlist="getCurrentPlaylist"
          :get-current-pick-code="getCurrentPickCode"
          :on-change-video="onChangeVideo"
          :current-play-mode="preferences.playMode"
          :set-play-mode="setPlayMode"
          :on-previous-video="goToPreviousVideo"
          :on-next-video="goToNextVideo"
        >
          <template #headerLeft>
            <HeaderInfo
              :file-info="DataFileInfo"
              :playlist="DataPlaylist"
            />
          </template>
          <template #controlsRight>
            <!-- 收藏按钮 -->
            <StarButton
              :is-mark="DataMark.isMark.value"
              :on-toggle-mark="DataMark.toggleMark"
            />
            <!-- 播放列表切换按钮 -->
            <button
              :class="[
                styles.controls.btn.root,
                preferences.showPlaylist && 'btn-active btn-primary',
              ]"
              data-tip="播放列表(B)"
              @click="togglePlaylist"
            >
              <Icon :icon="ICON_PLAYLIST" :class="[styles.controls.btn.icon]" />
            </button>

            <!-- 上一集按钮 -->
            <button
              v-if="DataPlaylist.state?.data && canGoPrevious"
              :class="[styles.controls.btn.root]"
              data-tip="上一集 (←)"
              @click="goToPreviousVideo"
            >
              <Icon :icon="ICON_SKIP_PREVIOUS" :class="[styles.controls.btn.icon]" />
            </button>

            <!-- 下一集按钮 -->
            <button
              v-if="DataPlaylist.state?.data && canGoNext"
              :class="[styles.controls.btn.root]"
              data-tip="下一集 (→)"
              @click="goToNextVideo"
            >
              <Icon :icon="ICON_SKIP_NEXT" :class="[styles.controls.btn.icon]" />
            </button>
          </template>
        </XPlayer>
      </div>
    </div>

    <!-- 页面下方内容 -->
    <div v-if="PLUS_VERSION" :class="styles.container.pageFlow" />

    <!-- 播放列表侧边栏 (固定定位) -->
    <div
      v-if="preferences.showPlaylist"
      :class="styles.playlist.container"
    >
      <Playlist
        :class="styles.playlist.content"
        :pick-code="params.pickCode.value"
        :playlist="DataPlaylist"
        :visible="preferences.showPlaylist"
        @play="handleChangeVideo"
        @close="handleClosePlaylist"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type XPlayerInstance from '../../components/XPlayer/index.vue'
import type { PlayMode } from '../../constants/playMode'
import type { Entity } from '../../utils/drive115'
import type { PlaylistItem } from '../../utils/drive115/api/entity'
import { Icon } from '@iconify/vue'
import { useTitle } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'

import StarButton from '../../components/XPlayer/controls/StarButton.vue'
import XPlayer from '../../components/XPlayer/index.vue'
import { controlRightStyles } from '../../components/XPlayer/styles/common'
import { useParamsVideoPage } from '../../composables/global/useParams'
import { PLUS_VERSION } from '../../constants'
import { ICON_PLAYLIST, ICON_SKIP_NEXT, ICON_SKIP_PREVIOUS } from '../../icons'

import { error, warn } from '../../utils/logger'

import { goToPlayer } from '../../utils/route'

import HeaderInfo from './components/HeaderInfo/index.vue'
import Playlist from './components/Playlist/index.vue'
import { useFileInfo } from './composables/useFileInfo'

import { useHistory } from './composables/useHistory'
import { useMark } from './composables/useMark'
import { usePlaylist } from './composables/usePlaylist'
import { usePreferences } from './composables/usePreferences'
import { useThumbnails } from './composables/useThumbnails'
import { useVideoSource } from './composables/useVideoSource'

const styles = {
  // 容器样式
  container: {
    main: [
      'flex flex-col items-center',
      'min-h-screen gap-5',
      'bg-base-100 text-gray-100',
      '[--app-playlist-width:min(400px,30vw)]',
    ],
    showPlaylist: 'show-playlist',
    pageMain: ['relative w-full h-screen overflow-hidden'],
    pageFlow: 'flex flex-col gap-8 px-6 xl:px-36 py-8 w-full',
  },
  // 播放器样式
  player: {
    container:
      'relative w-full h-screen flex items-center justify-center transition-all duration-200 ease-in-out transform-gpu',
    containerFold: 'w-[calc(100%-var(--app-playlist-width))]!',
    video: 'absolute m-auto w-full h-full overflow-hidden',
  },
  // 播放列表样式
  playlist: {
    container: 'fixed top-0 right-0 h-screen z-50 w-(--app-playlist-width)! bg-base-200',
    content: 'h-full',
  },
  // 控制样式
  controls: {
    btn: controlRightStyles.btn,
  },
}

/** 播放器 Ref */
const xplayerRef = ref<InstanceType<typeof XPlayerInstance>>()
/** 偏好设置 */
const preferences = usePreferences()
/** 参数 */
const params = useParamsVideoPage()
/** 视频源 */
const DataVideoSources = useVideoSource()
/** 缩略图 */
const DataThumbnails = useThumbnails(preferences)

/** 文件信息 */
const DataFileInfo = useFileInfo()
/** 播放列表 */
const DataPlaylist = usePlaylist()
/** 历史记录 */
const DataHistory = useHistory()
/** 收藏 */
const DataMark = useMark(DataFileInfo)

/** 是否正在切换视频 */
const changeing = shallowRef(false)
/** 视频尺寸 */
const videoSize = computed(() => {
  return {
    width: Number(DataFileInfo.state?.width) ?? 1920,
    height: Number(DataFileInfo.state?.height) ?? 1080,
  }
})
/** 视频比例 */
const videoRatio = computed(() => {
  return videoSize.value.width / videoSize.value.height
})
/** 播放器比例 */
const aspectRatio = computed(() => {
  if (videoRatio.value < 1) {
    return '1/1'
  }

  if (videoRatio.value > 1.78) {
    return '16/10'
  }

  return `${videoSize.value.width} / ${videoSize.value.height}`
})

/** 播放器列表切换 */
async function handleChangeVideo(item: Entity.PlaylistItem) {
  try {
    changeing.value = true
    if (!params.cid.value) {
      throw new Error('cid is required')
    }
    goToPlayer({
      cid: params.cid.value,
      pickCode: item.pc,
    })
    params.getParams()
    DataVideoSources.clear()
    DataThumbnails.clear()
    DataHistory.clear()

    await nextTick()
    await loadData(false)
  }
  finally {
    changeing.value = false
  }
}

/** 开始自动缓冲缩略图 */
function handleStartAutoBuffer() {
  DataThumbnails.autoBuffer()
}

/** 处理时间更新 */
function handleTimeupdate(time: number) {
  if (changeing.value) {
    return
  }
  if (!DataHistory.isinit.value) {
    return
  }
  if (time <= 0) {
    return
  }
  DataHistory.handleTimeupdate(time)
  if (!params.pickCode.value) {
    throw new Error('pickCode is required')
  }
  DataPlaylist.updateItemTime(params.pickCode.value, time)
}

/** 关闭播放列表 */
function handleClosePlaylist() {
  preferences.value.showPlaylist = false
}

/** 切换播放列表 */
function togglePlaylist() {
  preferences.value.showPlaylist = !preferences.value.showPlaylist
}

/** 获取当前播放列表 */
function getCurrentPlaylist() {
  return DataPlaylist.state
}

/** 获取当前播放代码 */
function getCurrentPickCode(): string | null {
  return params.pickCode.value || null
}

/** 视频切换回调 */
async function onChangeVideo(pickCode: string) {
  const playlist = DataPlaylist.state
  if (!playlist?.data) {
    error('播放列表不存在')
    return
  }

  const item = playlist.data.find((item: PlaylistItem) => item.pc === pickCode)
  if (!item) {
    error(`找不到播放项: ${pickCode}`)
    return
  }

  await handleChangeVideo(item)
}

/** 设置播放模式 */
function setPlayMode(mode: PlayMode) {
  preferences.value.playMode = mode
}

/** 加载数据 */
async function loadData(isFirst = true) {
  if (!params.pickCode.value) {
    throw new Error('pickCode is required')
  }
  if (!params.cid.value) {
    throw new Error('cid is required')
  }
  try {
    await DataHistory.fetch(params.pickCode.value)
  }
  catch (err) {
    error('加载播放历史失败:', err)
  }
  // 加载视频源
  DataVideoSources.fetch(params.pickCode.value).then(() => {
    // 初始化缩略图
    DataThumbnails.initialize(
      DataVideoSources.list.value,
      preferences.value.thumbnailsSamplingInterval,
    )
  })

  // 加载文件信息
  DataFileInfo.execute(0, params.pickCode.value).then(() => {
    // 设置标题
    useTitle(DataFileInfo.state.file_name || '')
  })

  // 加载播放列表
  isFirst && DataPlaylist.execute(0, params.cid.value)
}

// 挂载
onMounted(async () => {
  await loadData()
})

/** 上一集 */
const canGoPrevious = computed(() => {
  if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
    return false
  }
  const currentIndex = DataPlaylist.state.data.findIndex((item: PlaylistItem) => item.pc === DataFileInfo.state.pick_code)
  return currentIndex > 0
})

/** 下一集 */
const canGoNext = computed(() => {
  if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
    return false
  }
  const currentIndex = DataPlaylist.state.data.findIndex((item: PlaylistItem) => item.pc === DataFileInfo.state.pick_code)
  return currentIndex >= 0 && currentIndex < DataPlaylist.state.data.length - 1
})

/** 跳转上一集 */
async function goToPreviousVideo() {
  try {
    if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
      warn('播放列表或当前视频信息不存在')
      return
    }

    const currentIndex = DataPlaylist.state.data.findIndex((item: PlaylistItem) => item.pc === DataFileInfo.state.pick_code)
    if (currentIndex > 0) {
      const previousItem = DataPlaylist.state.data[currentIndex - 1]
      await onChangeVideo(previousItem.pc)
    }
  }
  catch (err) {
    error('跳转上一集失败:', err)
  }
}

/** 跳转下一集 */
async function goToNextVideo() {
  try {
    if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
      warn('播放列表或当前视频信息不存在')
      return
    }

    const currentIndex = DataPlaylist.state.data.findIndex((item: PlaylistItem) => item.pc === DataFileInfo.state.pick_code)
    if (currentIndex >= 0 && currentIndex < DataPlaylist.state.data.length - 1) {
      const nextItem = DataPlaylist.state.data[currentIndex + 1]
      await onChangeVideo(nextItem.pc)
    }
  }
  catch (err) {
    error('跳转下一集失败:', err)
  }
}
</script>
