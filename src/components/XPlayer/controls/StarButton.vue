<template>
  <button
    :class="[styles.btn.root]"
    :disabled="!isMarkReady"
    data-tip="收藏"
    @click="handleToggleMark"
  >
    <Icon
      :class="[styles.btn.icon]"
      :icon="isMark ? ICON_STAR_FILL : ICON_STAR"
    />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { ICON_STAR, ICON_STAR_FILL } from '../../../icons'
import { controlRightStyles } from '../styles/common'

const props = defineProps<{
  isMark: boolean | null
  onToggleMark?: () => void | Promise<void>
}>()

const emit = defineEmits<(e: 'toggleMark') => void>()

const styles = {
  ...controlRightStyles,
}

const isMarkReady = computed(() => props.isMark !== null)

function handleToggleMark() {
  if (props.onToggleMark) {
    props.onToggleMark()
  }
  emit('toggleMark')
}
</script>
