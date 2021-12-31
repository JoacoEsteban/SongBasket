/* eslint-disable no-unused-vars */
type IterationCallback = (item: {}, index: number, array: any[]) => any

interface Array<T> {
  get lastIndex (): number;
  get last (): T;
  get head (): T;
  indexOfSearch: (cb: IterationCallback) => number;
  lastIndexOfSearch: (cb: IterationCallback) => number;
  asyncForEach: (cb: IterationCallback) => Promise<void>;
  asyncFilter: (cb: IterationCallback) => Promise<T[]>;
}
