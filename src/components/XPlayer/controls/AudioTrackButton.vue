<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    :disabled="!playerCore?.canplay || playerCore?.type !== PlayerCoreType.AvPlayer"
    data-tip="音频轨道"
    @click="toggleVisible"
  >
    <Icon :class="[styles.btn.icon]" :icon="ICON_AUDIO_TRACK" />
  </button>

  <Popup
    v-if="avPlayerCore"
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="[styles.menu.root]">
      <li
        v-for="(stream) in avPlayerCore.audioStreams"
        :key="stream.id"
      >
        <a
          :class="[styles.menu.a, {
            [styles.menu.active]: avPlayerCore.audioStreamId === stream.id,
          }]"
          :disabled="!avPlayerCore.isSupportStream(stream)"
          @click="avPlayerCore.setAudioStream(stream.id)"
        >
          <span :class="[styles.menu.label]">
            {{ stream.id }}. {{ stream.metadata.title ?? 'Untitled' }}
          </span>
          <span :class="[styles.menu.desc]">
            {{ stream.metadata.language }}
          </span>
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, shallowRef } from 'vue'
import { PlayerCoreType } from '../../../composables/player/playerCore/types'
import { usePlayerContext } from '../../../composables/player/usePlayerProvide'
import Popup from '../components/Popup/index.vue'
import { controlStyles } from '../styles/common'
import { ICON_AUDIO_TRACK } from '../utils/icon'

const styles = {
  ...controlStyles,
}

const { playerCore } = usePlayerContext()
const avPlayerCore = computed(() => {
  return playerCore.value?.type === PlayerCoreType.AvPlayer
    ? (playerCore.value as any)
    : null
})

const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

function toggleVisible() {
  menuVisible.value = !menuVisible.value
}
</script>
