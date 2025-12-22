<template>
  <div
    :class="[styles.btnText.root]"
    class="pointer-events-none"
    :data-tip="`播放核心: ${playerCore?.type || 'N/A'}`"
  >
    <span class="text-xs opacity-80">
      {{ playerCore?.type || 'N/A' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '../../../composables/player/usePlayerProvide'
import { controlStyles } from '../styles/common'

const styles = {
  ...controlStyles,
}

const { playerCore } = usePlayerContext()
</script>
