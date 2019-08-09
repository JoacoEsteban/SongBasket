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
