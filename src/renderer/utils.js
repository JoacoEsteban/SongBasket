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

export function logme (log) { return log && console.log(...log) }

export function dateFormatter (dateParam) {
  const now = new Date()
  dateParam = new Date(dateParam)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const date = {
    today: dateParam.getFullYear() === now.getFullYear() && dateParam.getMonth() === now.getMonth() && dateParam.getDate() === now.getDate(),
    sameYear: dateParam.getFullYear() === now.getFullYear(),
    month: months[dateParam.getMonth()].substring(0, 3),
    date: dateParam.getDate(),
    year: dateParam.getFullYear()
  }

  const time = {
    hours: dateParam.getHours(),
    minutes: dateParam.getMinutes() < 10 ? '0' + dateParam.getMinutes() : dateParam.getMinutes()
  }

  return {date, time}
}
