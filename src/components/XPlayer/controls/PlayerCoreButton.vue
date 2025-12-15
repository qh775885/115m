<template>
  <button
    ref="buttonRef"
    :class="[styles.btnText.root]"
    data-tip="切换核心"
    @click="toggleVisible"
  >
    {{ playerCore?.type || 'N/A' }}
  </button>

  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="[styles.menu.root]">
      <li
        v-for="coreType in coreTypes"
        :key="coreType.value"
      >
        <a
          :class="[styles.menu.a, {
            [styles.menu.active]: playerCore?.type === coreType.value,
          }]"
          @click="switchCore(coreType.value)"
        >
          <span :class="[styles.menu.label]">
            {{ coreType.label }}
          </span>
          <span :class="[styles.menu.desc]">
            {{ coreType.desc }}
          </span>
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { PlayerCoreType } from '../../../composables/player/playerCore/types'
import { usePlayerContext } from '../../../composables/player/usePlayerProvide'
import Popup from '../components/Popup/index.vue'
import { controlStyles } from '../styles/common'

const styles = {
  ...controlStyles,
}

const { playerCore, source } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

/** 播放器核心类型列表（不含 HLS，HLS 由系统自动选择） */
const coreTypes = [
  { value: PlayerCoreType.Native, label: 'Native', desc: '原生播放器' },
  { value: PlayerCoreType.AvPlayer, label: 'AvPlayer', desc: '高兼容性' },
]

function toggleVisible() {
  menuVisible.value = !menuVisible.value
}

/** 切换播放器核心 */
async function switchCore(coreType: PlayerCoreType) {
  menuVisible.value = false

  if (playerCore.value?.type === coreType) {
    return
  }

  await source.switchPlayerCore(coreType)
}
</script>
