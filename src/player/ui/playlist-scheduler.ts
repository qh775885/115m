/**
 * 115m 2.0 · 播放列表封面专用任务调度器
 * 针对上百/上千条视频的长列表场景：
 * 1. 严格限制同时执行的抽帧任务并发数（默认 2 并发，避免与主播放流抢占网络带宽）；
 * 2. 支持任务即时取消（当元素划出可视区时立即从队列中撤销并释放）；
 * 3. 支持全局清空（当关闭侧边栏或重新渲染剧集时销毁所有待执行任务）。
 */

export enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export class TaskCancelledError extends Error {
  constructor() {
    super('Task Cancelled')
    this.name = 'TaskCancelledError'
  }
}

interface QueuedTask<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: Error) => void
  status: TaskStatus
}

export class PlaylistCoverScheduler {
  private running = 0
  private queue: Array<QueuedTask<unknown>> = []

  constructor(private readonly concurrency = 2) {}

  get runningCount(): number {
    return this.running
  }

  get queueLength(): number {
    return this.queue.length
  }

  add<T>(execute: () => Promise<T>): { promise: Promise<T>, cancel: () => void } {
    let taskRef: QueuedTask<T> | null = null

    const promise = new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = {
        execute,
        resolve,
        reject,
        status: TaskStatus.Pending,
      }
      taskRef = task
      this.queue.push(task as QueuedTask<unknown>)
      this.processQueue()
    })

    const cancel = () => {
      if (!taskRef) return
      if (taskRef.status === TaskStatus.Pending) {
        taskRef.status = TaskStatus.Cancelled
        const index = this.queue.indexOf(taskRef as QueuedTask<unknown>)
        if (index !== -1) {
          this.queue.splice(index, 1)
        }
        taskRef.reject(new TaskCancelledError())
      }
    }

    return { promise, cancel }
  }

  clear(): void {
    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task && task.status === TaskStatus.Pending) {
        task.status = TaskStatus.Cancelled
        task.reject(new TaskCancelledError())
      }
    }
  }

  private processQueue(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
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
          this.running--
          task.resolve(result)
          this.processQueue()
        })
        .catch((err) => {
          task.status = TaskStatus.Completed
          this.running--
          task.reject(err instanceof Error ? err : new Error(String(err)))
          this.processQueue()
        })
    }
  }
}
