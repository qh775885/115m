export function parseDuration(value?: string): number {
  if (typeof value !== 'string' || !value) return 0
  const parts = value.split(':').map(part => Number(part))
  if (parts.some(part => Number.isNaN(part))) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return 0
}

/** 任务状态 */
export enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

/** 任务取消错误 */
export class TaskCancelledError extends Error {
  constructor() {
    super('Task Cancelled')
  }
}

interface TaskItem<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: Error) => void
  status: TaskStatus
}

/**
 * 任务调度器（支持取消）
 */
export class Scheduler {
  private running = 0
  private queue: Array<TaskItem<unknown>> = []

  constructor(private readonly limit = 3) {}

  private processQueue() {
    while (this.running < this.limit && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) return

      if (task.status === TaskStatus.Cancelled) {
        task.reject(new TaskCancelledError())
        continue
      }

      this.running++
      task.status = TaskStatus.Running

      task.execute()
        .then((result) => {
          task.status = TaskStatus.Completed
          task.resolve(result)
        })
        .catch((error) => {
          task.reject(error instanceof Error ? error : new Error(String(error)))
        })
        .finally(() => {
          this.running--
          this.processQueue()
        })
    }
  }

  add<T>(execute: () => Promise<T>) {
    let taskRef: TaskItem<T> | null = null

    const promise = new Promise<T>((resolve, reject) => {
      const task: TaskItem<T> = {
        execute,
        resolve,
        reject: (reason) => reject(reason),
        status: TaskStatus.Pending,
      }
      taskRef = task
      this.queue.push(task as TaskItem<unknown>)
      this.processQueue()
    })

    const cancel = () => {
      if (!taskRef) return
      if (taskRef.status !== TaskStatus.Pending) return
      taskRef.status = TaskStatus.Cancelled
    }

    return { promise, cancel }
  }
}

export function findScrollContainer(element: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = element.parentElement
  while (node) {
    const style = getComputedStyle(node)
    const overflowY = style.overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return window
}

/**
 * 创建可见性检测器
 * @param element 目标元素
 * @param onVisible 可见时回调
 * @param onHidden 不可见时回调
 * @param options IntersectionObserver 选项
 */
export function createVisibilityObserver(
  element: HTMLElement,
  onVisible: () => void,
  onHidden: () => void,
  options?: IntersectionObserverInit,
): { destroy: () => void } {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) {
        onVisible()
      }
      else {
        onHidden()
      }
    },
    {
      threshold: 0,
      rootMargin: '100px',
      ...options,
    },
  )

  observer.observe(element)

  return {
    destroy: () => observer.disconnect(),
  }
}
