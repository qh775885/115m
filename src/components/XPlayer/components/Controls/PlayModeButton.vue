<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    data-tip="播放模式"
    @click="toggleMenu"
  >
    <Icon icon="material-symbols:pause-rounded" :class="styles.btn.icon" />
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
import { PlayMode, PLAY_MODE_DESCRIPTIONS, PLAY_MODE_ICONS, PLAY_MODE_NAMES } from '../../../../constants/playMode'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import Popup from '../Popup/index.vue'

/** 播放器上下文 */
const ctx = usePlayerContext()

/** 当前播放模式 */
const currentMode = computed(() => {
  try {
    const getCurrentPlayMode = ctx.rootProps.getCurrentPlayMode
    const mode = getCurrentPlayMode ? getCurrentPlayMode() : PlayMode.STOP
    console.log('当前播放模式:', mode)
    return mode
  } catch (error) {
    console.error('获取播放模式失败:', error)
    return PlayMode.STOP
  }
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
const handleModeChange = (mode: PlayMode) => {
  if (mode !== currentMode.value) {
    const setPlayMode = ctx.rootProps.setPlayMode
    if (setPlayMode) {
      setPlayMode(mode)
      console.log(`🎮 播放模式已切换为: ${PLAY_MODE_NAMES[mode]}`)
      menuVisible.value = false
    } else {
      console.error('设置播放模式回调函数未提供')
    }
  }
}

/** 样式 */
const styles = {
  ...controlStyles,
}
</script>
