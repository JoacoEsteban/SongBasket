exports.logme = (logger) => logger === undefined ? console.log('Logging...') : console.log('//LOG// ', logger)

exports.dateFormatter = (dateParam) => {
  let now = new Date()
  dateParam = new Date(dateParam)
  let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  let date = {
    today: dateParam.getFullYear() === now.getFullYear() && dateParam.getMonth() === now.getMonth() && dateParam.getDate() === now.getDate(),
    sameYear: dateParam.getFullYear() === now.getFullYear(),
    month: months[dateParam.getMonth()].substring(0, 3),
    date: dateParam.getDate(),
    year: dateParam.getFullYear()
  }

  let time = {
    hours: dateParam.getHours(),
    minutes: dateParam.getMinutes() < 10 ? '0' + dateParam.getMinutes() : dateParam.getMinutes()
  }

  return {date, time}
}
