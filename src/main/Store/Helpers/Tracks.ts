import * as he from 'he'
import { SongBasketTrack } from '../../../@types/SongBasket'

export default {
  calculateBestMatch (track: SongBasketTrack, force: boolean = false) {
    // TODO Handle conversion errors
    if ((!force && track.flags.processed) || track.flags.conversionError) return track
    track = cloneObject(track)
    track.conversion.nameTokens = [...track.data.name.split(separators).map(str => makeValidRegex(str)).filter(str => str.str.length > 2 && !isInvalidWord(str.str)), ...track.data.artists.map(a => makeValidRegex(a.name))] // All words from trackname & artist split into array

    let nameTokens = track.conversion.nameTokens
    nameTokens = nameTokens.filter((a, index1) => { // Removes dupes
      nameTokens.forEach((b, index2) => {
        if (a.str === b.str && index1 !== index2) return false
      })
      return true
    })

    track.conversion.yt.forEach(conv => exec({
      track,
      conv,
      nameTokens
    }))
    calcBestMatch(track)
    track.flags.processed = true
    return track
  }
}
const separators = /, | |\(|\)/

const invalidWords = [
  'the'
]

const isInvalidWord = str => invalidWords.includes(str.toLowerCase())

const normalizeConversion = conv => {
  if (!conv?.youtube_id) conv.youtube_id = conv.id
}

const exec = ({
  track,
  conv,
  nameTokens
}) => {
  normalizeConversion(conv)
  findTokens(conv, nameTokens)
  conv.durationDiff = round(conv.duration - (track.duration || (track.duration = track.data.duration_ms / 1000)))
  conv.durationScore = round(1 / (1.1 ** (Math.abs(conv.durationDiff) / 10))) // 1 === same duration, difference makes it go down
  conv.wordScore = round(conv.matchedTokensCount / track.conversion.nameTokens.length) // 1 === all tokens match
  // Conversion doesn't get enough score to be trusty if:
  // // - No word matches
  // // - 1st token not found (first word of trackname)
  // // - both scores don't add up to 1
  conv.isDoubtlyConversion = (conv.wordScore === 0 || !conv.nameTokensMap[0] || (conv.wordScore + conv.durationScore < 1))
}

const findTokens = (conv, nameTokens) => {
  conv.nameFormatted = (conv.snippet.title = he.decode(conv.snippet.title))
  conv.nameTokensMap = new Array(nameTokens.length)
  conv.matchedTokensCount = 0

  nameTokens.forEach((token, index) => {
    conv.nameTokensMap[index] = conv.snippet.title.toLowerCase().includes(token.str.toLowerCase()) && ++conv.matchedTokensCount && !!(conv.nameFormatted = conv.nameFormatted.replace(new RegExp(token.regex, 'gi'), `<span class="matching-token">${token.str}</span>`) || true)
  })
  // conv.nameFormatted = conv.nameFormatted.replace(/<\/span> <span class="matching-token">/g, ' ')
}

const calcBestMatch = (track) => {
  if (!track.conversion.yt.length) return
  track.conversion.bestMatch = (track.conversion.yt = track.conversion.yt.sort((a, b) => {
    if (!a.wordScore && b.wordScore) return 1
    if (!b.wordScore && a.wordScore) return -1
    return (a.durationScore + a.wordScore * 1.5) > (b.durationScore + b.wordScore * 1.5) ? -1 : 1 // Wordscore gets boosted because of priority of name match over duration
  }))[0].youtube_id
  track.conversion.yt[0].isBestMatch = true
}

const makeValidRegex = str => {
  let regex = str
  regex = regex.replace(/\*/g, '\\*')
  regex = regex.replace(/\(/g, '\\(')
  regex = regex.replace(/\)/g, '\\)')
  // TODO Fix this replacing incorrectly
  regex = regex.replace(/\[/g, '\\[')
  regex = regex.replace(/\]/g, '\\]')
  regex = regex.replace(/\?/g, '\\?')

  return { str, regex }
}

const round = num => +(num).toFixed(5)

// TODO import this method without renderer blowing up
function cloneObject (aObject) {
  return clone(aObject)
}

function clone (aObject) {
  if (!aObject) {
    return aObject
  }

  let v
  let bObject = Array.isArray(aObject) ? [] : {}
  for (const k in aObject) {
    v = aObject[k]
    bObject[k] = (typeof v === 'object') ? clone(v) : v
  }

  return bObject
}
