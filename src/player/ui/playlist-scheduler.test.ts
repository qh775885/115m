import { describe, expect, it, vi } from 'vitest'
import { PlaylistCoverScheduler, TaskCancelledError } from './playlist-scheduler'

describe('PlaylistCoverScheduler', () => {
  it('限制最大并发任务数为指定的限制', async () => {
    const scheduler = new PlaylistCoverScheduler(2)
    let concurrent = 0
    let maxConcurrent = 0

    const makeTask = (ms: number) => () =>
      new Promise<number>((resolve) => {
        concurrent++
        maxConcurrent = Math.max(maxConcurrent, concurrent)
        setTimeout(() => {
          concurrent--
          resolve(ms)
        }, ms)
      })

    const p1 = scheduler.add(makeTask(20)).promise
    const p2 = scheduler.add(makeTask(20)).promise
    const p3 = scheduler.add(makeTask(20)).promise

    expect(scheduler.runningCount).toBe(2)
    expect(scheduler.queueLength).toBe(1)

    await Promise.all([p1, p2, p3])
    expect(maxConcurrent).toBe(2)
    expect(scheduler.runningCount).toBe(0)
  })

  it('排队中的任务在执行前调用 cancel 会被立即移出并不被执行', async () => {
    const scheduler = new PlaylistCoverScheduler(1)
    const task1 = vi.fn().mockImplementation(() => new Promise(r => setTimeout(r, 30)))
    const task2 = vi.fn().mockResolvedValue('ok')

    scheduler.add(task1)
    const { promise: p2, cancel: cancel2 } = scheduler.add(task2)

    expect(scheduler.queueLength).toBe(1)
    cancel2()
    expect(scheduler.queueLength).toBe(0)

    await expect(p2).rejects.toThrow(TaskCancelledError)
    expect(task2).not.toHaveBeenCalled()
  })

  it('clear 能够取消所有排队中的任务', async () => {
    const scheduler = new PlaylistCoverScheduler(1)
    const task1 = () => new Promise(r => setTimeout(r, 20))
    const task2 = vi.fn().mockResolvedValue('ok2')
    const task3 = vi.fn().mockResolvedValue('ok3')

    scheduler.add(task1)
    const { promise: p2 } = scheduler.add(task2)
    const { promise: p3 } = scheduler.add(task3)

    expect(scheduler.queueLength).toBe(2)
    scheduler.clear()
    expect(scheduler.queueLength).toBe(0)

    await expect(p2).rejects.toThrow(TaskCancelledError)
    await expect(p3).rejects.toThrow(TaskCancelledError)
    expect(task2).not.toHaveBeenCalled()
    expect(task3).not.toHaveBeenCalled()
  })
})
