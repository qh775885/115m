<template>
  <div class="dropdown dropdown-top dropdown-end">
    <!-- 播放模式按钮 -->
    <button
      tabindex="0"
      role="button"
      :class="[
        styles.btn.root,
        styles.btn.base,
      ]"
      :data-tip="PLAY_MODE_NAMES[currentMode]"
    >
      <Icon :icon="PLAY_MODE_ICONS[currentMode]" :class="styles.btn.icon" />
    </button>

    <!-- 播放模式选择菜单 -->
    <ul
      tabindex="0"
      :class="styles.dropdown.menu"
    >
      <li
        v-for="mode in modes"
        :key="mode"
        @click="handleModeChange(mode)"
      >
        <a
          :class="[
            styles.dropdown.item,
            currentMode === mode && styles.dropdown.itemActive,
          ]"
        >
          <Icon :icon="PLAY_MODE_ICONS[mode]" :class="styles.dropdown.icon" />
          <div :class="styles.dropdown.content">
            <div :class="styles.dropdown.title">
              {{ PLAY_MODE_NAMES[mode] }}
            </div>
            <div :class="styles.dropdown.description">
              {{ PLAY_MODE_DESCRIPTIONS[mode] }}
            </div>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { PlayMode, PLAY_MODE_DESCRIPTIONS, PLAY_MODE_ICONS, PLAY_MODE_NAMES } from '../../../../constants/playMode'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

/** 播放器上下文 */
const ctx = usePlayerContext()

/** 当前播放模式 */
const currentMode = computed(() => {
  const getCurrentPlayMode = ctx.rootProps.getCurrentPlayMode
  return getCurrentPlayMode ? getCurrentPlayMode() : PlayMode.STOP
})

/** 所有播放模式 */
const modes = Object.values(PlayMode)

/** 处理播放模式切换 */
const handleModeChange = (mode: PlayMode) => {
  if (mode !== currentMode.value) {
    const setPlayMode = ctx.rootProps.setPlayMode
    if (setPlayMode) {
      setPlayMode(mode)
      console.log(`🎮 播放模式已切换为: ${PLAY_MODE_NAMES[mode]}`)
    } else {
      console.error('设置播放模式回调函数未提供')
    }
  }
}

/** 样式 */
const styles = {
  btn: {
    root: [
      'btn btn-ghost btn-circle btn-sm',
      'tooltip tooltip-left',
      'hover:bg-base-content/10',
      'transition-colors duration-200',
    ],
    base: [
      'text-base-content/80',
      'hover:text-base-content',
    ],
    icon: 'w-5 h-5',
  },
  dropdown: {
    menu: [
      'dropdown-content menu',
      'bg-base-200/95 backdrop-blur-sm',
      'rounded-box shadow-lg',
      'w-64 p-2',
      'border border-base-content/10',
    ],
    item: [
      'flex flex-row items-start gap-3',
      'p-3 rounded-lg',
      'hover:bg-base-content/10',
      'transition-colors duration-200',
      'cursor-pointer',
    ],
    itemActive: [
      'bg-primary/20',
      'text-primary',
    ],
    icon: 'w-5 h-5 mt-0.5 flex-shrink-0',
    content: 'flex flex-col gap-1',
    title: 'font-medium text-sm',
    description: 'text-xs opacity-70',
  },
}
</script>
