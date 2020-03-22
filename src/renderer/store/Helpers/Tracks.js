export default {
  calculateBestMatch (track) {
    if (track.flags.processed) return null

    track.conversion.nameTokens = [...track.data.name.split(' ').map(str => makeValidRegex(str)).filter(str => str.length > 2), ...track.data.artists.map(a => a.name)] // All words from trackname & artist split into array
    let nameTokens = track.conversion.nameTokens

    nameTokens = nameTokens.filter((a, index1) => { // Removes dupes
      nameTokens.forEach((b, index2) => {
        if (a === b && index1 !== index2) return false
      })
      return true
    })

    track.conversion.yt.forEach(conv => exec({track, conv, nameTokens}))
    calcBestMatch(track)
    return track
  }
}

const exec = ({track, conv, nameTokens}) => {
  findTokens(conv, nameTokens)
  conv.durationDiff = conv.duration - track.duration || (track.duration = track.data.duration_ms / 1000)
}

const findTokens = (conv, nameTokens) => {
  conv.nameFormatted = conv.snippet.title
  conv.nameTokensMap = new Array(nameTokens.length)
  conv.matchedTokensCount = 0

  nameTokens.forEach((token, index) => {
    conv.nameTokensMap[index] = conv.snippet.title.includes(token) && ++conv.matchedTokensCount && !!(conv.nameFormatted = conv.nameFormatted.toLowerCase().replace(new RegExp(token, 'gi'), `<span class="matching-token">${token}</span>`) || true)
  })
}

const calcBestMatch = (track) => {
  track.conversion.bestMatch = (track.conversion.yt = track.conversion.yt.sort((a, b) => {
    let durRatio = Math.abs(a.durationDiff) / Math.abs(b.durationDiff)
    let wordRatio = a.matchedTokensCount / b.matchedTokensCount
    return wordRatio - durRatio > 1 ? 1 : 0
  }))[0].id
}

const makeValidRegex = str => str.replace(/\)|\(|/g, '').toLowerCase()
