export default {
  calculateBestMatch (track) {
    // TODO ------- Remove this 2 lines
    if (!track.flags) track.flags = {}
    if (track.conversion) return !(track.flags.converted = true)
    // -------
    if (track.flags.converted) return null

    // let durations = track.conversion.map(t => {
    //   let vidDuration = t - track.duration_s
    //   return vidDuration > 0 ? vidDuration : vidDuration * -1
    // })

    // let bestMatch = 0
    // for (let i = 1; i < durations.length; i++) {
    //   let dur = durations[i]
    //   if (dur < durations[bestMatch]) bestMatch = i
    // }

    return track
  }
}
