<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    :data-tip="PLAY_MODE_NAMES[currentMode] || '播放模式'"
    @click="toggleMenu"
  >
    <Icon :icon="PLAY_MODE_ICONS[currentMode] || 'material-symbols:pause-rounded'" :class="styles.btn.icon" />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="styles.menu.root">
      <li
        v-for="mode in modes"
        :key="mode"
        @click="handleModeChange(mode)"
      >
        <a
          :class="[
            styles.menu.a,
            currentMode === mode && styles.menu.active,
          ]"
        >
          <Icon :icon="PLAY_MODE_ICONS[mode]" :class="styles.menu.icon" />
          <div class="flex flex-col">
            <span :class="styles.menu.label">
              {{ PLAY_MODE_NAMES[mode] }}
            </span>
            <span :class="styles.menu.desc">
              {{ PLAY_MODE_DESCRIPTIONS[mode] }}
            </span>
          </div>
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, shallowRef } from 'vue'
import { usePlayerContext } from '../../../composables/player/usePlayerProvide'
import { PLAY_MODE_DESCRIPTIONS, PLAY_MODE_ICONS, PLAY_MODE_NAMES, PlayMode } from '../../../constants/playMode'
import { error } from '../../../utils/logger'
import Popup from '../components/Popup/index.vue'
import { controlStyles } from '../styles/common'

/** 播放器上下文 */
const ctx = usePlayerContext()

/** 当前播放模式 */
const currentMode = computed(() => {
  return ctx.rootProps.currentPlayMode ?? PlayMode.STOP
})

/** 所有播放模式 */
const modes = Object.values(PlayMode)

/** 菜单可见性 */
const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)

/** 切换菜单 */
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

/** 处理播放模式切换 */
function handleModeChange(mode: PlayMode) {
  const setPlayMode = ctx.rootProps.setPlayMode
  if (setPlayMode) {
    setPlayMode(mode)
    menuVisible.value = false
  }
  else {
    error('设置播放模式回调函数未提供')
  }
}

/** 样式 */
const styles = {
  ...controlStyles,
}
</script>
