export type dateFormatted = {
  today: boolean,
  sameYear: boolean,
  month: string,
  date: number,
  year: number,
  raw: Date,
}

export type timeFormatted = {
  rawHours: number,
  rawMinutes: number,
  rawSeconds: number,
  hours: string,
  minutes: string,
  seconds: string,
}
// ------------------------------------------

export function convertMS (milliseconds: number) {
  let minutes, seconds
  seconds = Math.floor(milliseconds / 1000)
  minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  return {
    minutes,
    seconds
  }
}

export const sleep = (time: number): Promise<void> => new Promise((resolve, reject) => setTimeout(resolve, time))
export const jsonClone = (obj: any) => JSON.parse(JSON.stringify(obj))

export function dateFormatter (dateParam: Date | number | string) {
  if (!dateParam) return null

  dateParam = new Date(dateParam)
  if (isNaN(dateParam.getTime())) return null

  const now = new Date()

  const date: dateFormatted = {
    today: dateParam.getFullYear() === now.getFullYear() && dateParam.getMonth() === now.getMonth() && dateParam.getDate() === now.getDate(),
    sameYear: dateParam.getFullYear() === now.getFullYear(),
    month: months[dateParam.getMonth()].substring(0, 3),
    date: dateParam.getDate(),
    year: dateParam.getFullYear(),
    raw: dateParam,
  }

  const rawHours = dateParam.getHours()
  const rawMinutes = dateParam.getMinutes()
  const rawSeconds = dateParam.getSeconds()
  const time: timeFormatted = {
    rawHours,
    rawMinutes,
    rawSeconds,
    hours: ((rawHours < 10 ? '0' : '') + rawHours).toString(),
    minutes: ((rawMinutes < 10 ? '0' : '') + rawMinutes).toString(),
    seconds: ((rawSeconds < 10 ? '0' : '') + rawSeconds).toString(),
  }

  return { date, time }
}

// ------------------------------------------

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
