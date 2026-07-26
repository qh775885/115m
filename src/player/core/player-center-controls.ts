import { Icons } from '../../shared/icons'

const CENTER_CLUSTER_CLASS = 'm115-center-cluster'

/** 居中簇内按钮的固定顺序：上一集 → 播放/暂停 → 下一集 */
const CENTER_CLUSTER_ORDER = [
  '.art-control-m115-prev-control',
  '.art-control-playAndPause',
  '.art-control-m115-next-control',
]

/**
 * 把上一集/播放/下一集三个控件搬进控制栏正中间的绝对定位容器。
 *
 * ArtPlayer 的内置播放键硬编码在 .art-controls-left 中，无法通过配置移动，
 * 因此在控件挂载后手动搬运 DOM 节点（事件绑定在节点上，搬运不会丢失）。
 * 容器额外带上 art-controls-left class，以复用 player-skin.css 的既有
 * 按钮样式和 events.ts 中的交互区域判断。
 *
 * prev/next 控件每次 controls.update 会被重建并插回左侧容器，
 * 所以每次 renderPlaybackNavControls 后都需要重新调用本函数。
 */
export function mountCenterCluster(art: any) {
  const $controls = art?.template?.$controls as HTMLElement | undefined
  const $player = art?.template?.$player as HTMLElement | undefined
  if (!$controls || !$player) return

  let cluster = $controls.querySelector<HTMLElement>(`.${CENTER_CLUSTER_CLASS}`)
  if (!cluster) {
    cluster = document.createElement('div')
    cluster.className = `art-controls-left ${CENTER_CLUSTER_CLASS}`
    $controls.appendChild(cluster)
  }

  // 按固定顺序 appendChild（对已在容器内的节点等于重排，保证顺序稳定）
  for (const selector of CENTER_CLUSTER_ORDER) {
    const el = $player.querySelector<HTMLElement>(selector)
    if (el) cluster.appendChild(el)
  }
}

export function buildNavControlItem(params: {
  controlName: string
  direction: 'prev' | 'next'
  index: number
  enabled: boolean
  title: string
  onClick: () => void
}) {
  const svgIcon = params.direction === 'next'
    ? Icons.SkipForward
    : Icons.SkipBack

  return {
    name: params.controlName,
    position: 'left' as const,
    index: params.index,
    html: `<span class="m115-control-shell m115-nav-control-button ${params.enabled ? '' : 'is-disabled'}" aria-label="${params.title}" title="${params.title}" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(236, 245, 255, 0.82);opacity:${params.enabled ? '1' : '.38'};cursor:${params.enabled ? 'pointer' : 'default'};transition:opacity .18s ease,background-color .15s ease">${svgIcon}</span>`,
    style: {
      width: 'var(--m115-control-size)',
      minWidth: 'var(--m115-control-size)',
      maxWidth: 'var(--m115-control-size)',
      height: 'var(--m115-control-size)',
      minHeight: 'var(--m115-control-size)',
      maxHeight: 'var(--m115-control-size)',
      marginRight: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: params.enabled ? '1' : '.38',
      cursor: params.enabled ? 'pointer' : 'not-allowed',
    },
    click: () => {
      if (!params.enabled) return false
      params.onClick()
      return false
    },
    mounted: ($control: HTMLElement) => {
      $control.classList.add('m115-nav-control')
      $control.classList.toggle('is-disabled', !params.enabled)
      $control.title = params.title
    },
  }
}
