import type Artplayer from 'artplayer'

export function bindKeyboardShortcuts(art: Artplayer): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      art.toggle()
    }
    else if (e.code === 'ArrowLeft') {
      art.seek = art.currentTime - 5
    }
    else if (e.code === 'ArrowRight') {
      art.seek = art.currentTime + 5
    }
    else if (e.code === 'ArrowUp') {
      e.preventDefault()
      art.volume = Math.min(1, art.volume + 0.1)
      art.emit('video:volumechange')
    }
    else if (e.code === 'ArrowDown') {
      e.preventDefault()
      art.volume = Math.max(0, art.volume - 0.1)
      art.emit('video:volumechange')
    }
    else if (e.code === 'KeyF') {
      art.fullscreen = !art.fullscreen
    }
  }

  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}
