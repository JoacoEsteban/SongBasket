/* eslint-disable no-unused-vars */
type IterationCallback<T> = (item: T, index: number, array: any[]) => any
type AsyncIterationCallback<T> = (item: T, index: number, array: T[]) => Promise<any>

interface Array<T> {
  get lastIndex (): number
  get last (): T
  get head (): T
  indexOfSearch: (cb: IterationCallback<T>) => number
  lastIndexOfSearch: (cb: IterationCallback<T>) => number
  asyncForEach: (cb: AsyncIterationCallback<T>) => Promise<void>
  asyncForEachParallel: (cb: AsyncIterationCallback<T>) => Promise<void>
  asyncFilter: (cb: AsyncIterationCallback<T>) => Promise<T[]>
}
