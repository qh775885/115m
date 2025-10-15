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
          :subtitles="DataSubtitles.state"
          :last-time="DataHistory.lastTime.value"
          :subtitles-loading="DataSubtitles.isLoading"
          :subtitles-ready="DataSubtitles.isReady"
          :on-thumbnail-request="DataThumbnails.onThumbnailRequest"
          :on-subtitle-change="handleSubtitleChange"
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
          <template #aboutContent>
            <About />
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
import type { Subtitle } from '../../components/XPlayer/types'
import type { PlayMode } from '../../constants/playMode'
import type { Entity } from '../../utils/drive115'
import { Icon } from '@iconify/vue'
import { useTitle } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'

import XPlayer from '../../components/XPlayer/index.vue'
import { controlRightStyles } from '../../components/XPlayer/styles/common'
import { PLUS_VERSION } from '../../constants'
import { useParamsVideoPage } from '../../hooks/useParams'
import { ICON_PLAYLIST, ICON_SKIP_NEXT, ICON_SKIP_PREVIOUS } from '../../icons'
import { subtitlePreference } from '../../utils/cache/subtitlePreference'
import { getAvNumber } from '../../utils/getNumber'

import { goToPlayer } from '../../utils/route'

import About from './components/About/index.vue'
import HeaderInfo from './components/HeaderInfo/index.vue'

import Playlist from './components/Playlist/index.vue'
import { useDataFileInfo } from './data/useDataFileInfo'
import { useDataHistory } from './data/useDataHistory'

import { useDataPlaylist } from './data/useDataPlaylist'
import { usePreferences } from './data/usePreferences'
import { useDataSubtitles } from './data/useSubtitlesData'
import { useDataThumbnails } from './data/useThumbnails'
import { useDataVideoSources } from './data/useVideoSource'

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
const DataVideoSources = useDataVideoSources()
/** 缩略图 */
const DataThumbnails = useDataThumbnails(preferences)
/** 字幕 */
const DataSubtitles = useDataSubtitles()

/** 文件信息 */
const DataFileInfo = useDataFileInfo()
/** 播放列表 */
const DataPlaylist = useDataPlaylist()
/** 历史记录 */
const DataHistory = useDataHistory()

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

/** 处理字幕变化 */
async function handleSubtitleChange(subtitle: Subtitle | null) {
  // 保存字幕选择
  await subtitlePreference.savePreference(
    params.pickCode.value ?? '',
    subtitle || null,
  )
}

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
    DataSubtitles.execute(
      0,
      params.pickCode.value,
      DataFileInfo.state.file_name,
      null,
    )

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
    console.error('播放列表不存在')
    return
  }

  const item = playlist.data.find((item: any) => item.pc === pickCode)
  if (!item) {
    console.error(`找不到播放项: ${pickCode}`)
    return
  }

  await handleChangeVideo(item)
}

/** 设置播放模式 */
function setPlayMode(mode: PlayMode) {
  preferences.value.playMode = mode
  console.log(`🎮 播放模式已设置为: ${mode}`)
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
  catch (error) {
    console.error(error)
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
  DataFileInfo.execute(0, params.pickCode.value).then((res) => {
    const avNumber = getAvNumber(res.file_name)
    // 设置标题
    useTitle(DataFileInfo.state.file_name || '')

    // 加载字幕
    DataSubtitles.execute(0, params.pickCode.value, res.file_name, avNumber)
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
  const currentIndex = DataPlaylist.state.data.findIndex((item: any) => item.pc === DataFileInfo.state.pick_code)
  return currentIndex > 0
})

/** 下一集 */
const canGoNext = computed(() => {
  if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
    return false
  }
  const currentIndex = DataPlaylist.state.data.findIndex((item: any) => item.pc === DataFileInfo.state.pick_code)
  return currentIndex >= 0 && currentIndex < DataPlaylist.state.data.length - 1
})

/** 跳转上一集 */
async function goToPreviousVideo() {
  try {
    if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
      console.warn('播放列表或当前视频信息不存在')
      return
    }

    const currentIndex = DataPlaylist.state.data.findIndex((item: any) => item.pc === DataFileInfo.state.pick_code)
    if (currentIndex > 0) {
      const previousItem = DataPlaylist.state.data[currentIndex - 1]
      console.log('📺 跳转上一集:', previousItem.n)
      await onChangeVideo(previousItem.pc)
    }
    else {
      console.log('🙅 已经是第一集了')
    }
  }
  catch (error) {
    console.error('跳转上一集失败:', error)
  }
}

/** 跳转下一集 */
async function goToNextVideo() {
  try {
    if (!DataPlaylist.state?.data || !DataFileInfo.state.pick_code) {
      console.warn('播放列表或当前视频信息不存在')
      return
    }

    const currentIndex = DataPlaylist.state.data.findIndex((item: any) => item.pc === DataFileInfo.state.pick_code)
    if (currentIndex >= 0 && currentIndex < DataPlaylist.state.data.length - 1) {
      const nextItem = DataPlaylist.state.data[currentIndex + 1]
      console.log('📺 跳转下一集:', nextItem.n)
      await onChangeVideo(nextItem.pc)
    }
    else {
      console.log('🙅 已经是最后一集了')
    }
  }
  catch (error) {
    console.error('跳转下一集失败:', error)
  }
}
</script>
