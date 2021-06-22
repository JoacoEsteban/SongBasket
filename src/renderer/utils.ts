export function convertMS (milliseconds) {
  let minutes, seconds
  seconds = Math.floor(milliseconds / 1000)
  minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  return {
    minutes,
    seconds
  }
}

export function logme (...log) { return log && console.log(...log) }
export const sleep = (time: number): Promise<void> => new Promise((resolve, reject) => setTimeout(resolve, time))
export const jsonClone = obj => JSON.parse(JSON.stringify(obj))

export function dateFormatter (dateParam) {
  if (!dateParam) return null

  const now = new Date()
  dateParam = new Date(dateParam)
  // eslint-disable-next-line eqeqeq
  if (dateParam == 'Invalid Date') return null

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const date = {
    today: dateParam.getFullYear() === now.getFullYear() && dateParam.getMonth() === now.getMonth() && dateParam.getDate() === now.getDate(),
    sameYear: dateParam.getFullYear() === now.getFullYear(),
    month: months[dateParam.getMonth()].substring(0, 3),
    date: dateParam.getDate(),
    year: dateParam.getFullYear()
  }

  const time = {
    rawHours: dateParam.getHours(),
    rawMinutes: dateParam.getMinutes(),
    rawSeconds: dateParam.getSeconds()
  }

  time.hours = ((time.rawHours < 10 ? '0' : '') + time.rawHours).toString()
  time.minutes = ((time.rawMinutes < 10 ? '0' : '') + time.rawMinutes).toString()
  time.seconds = ((time.rawSeconds < 10 ? '0' : '') + time.rawSeconds).toString()

  return { date, time }
}
