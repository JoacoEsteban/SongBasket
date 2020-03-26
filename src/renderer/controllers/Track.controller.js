let VueInstance

const TrackController = {
  getArtists: (item) => (item.artists || item.data.artists).map(({name}) => name).join(', '),
  getSelection: (track, playlistId) => {
    return track.conversion && track.conversion.yt.find(yt => yt.id === (track.playlists.find(p => p.id === playlistId).selected || track.conversion.bestMatch))
  },
  getStatus: function (t) {
    const slug = (() => {
      const f = t.flags || {converted: false}
      if (f.paused) return 'paused'
      if (!f.converted) return 'awaiting-conversion'
      if (f.conversionError) return 'error'
      if (this.isDownloaded(t)) return 'downloaded'
      // if (f.customSelection) return 'custom-selection'
      // check selected doubtly conversion
      if (t.flags.conversionIsApplied || !t.selection.isDoubtlyConversion || f.customSelection) return 'awaiting-download'
      return 'review-conversion'
    })()

    return {
      slug,
      str: Strings[slug],
      color: Colors[slug]
    }
  },
  sort (a, b) {
    if (a.status.slug === 'downloaded') return 1
    if (b.status.slug === 'downloaded') return -1

    if (a.status.slug === 'review-conversion') return -1
    if (b.status.slug === 'review-conversion') return 1
    return 0
  },
  isDownloaded: function ({id, selection}) {
    const dlTrack = (VueInstance || (VueInstance = require('../main').default)).DOWNLOADED_TRACKS[id]
    return !!(dlTrack && dlTrack[selection.id])
  }
}

const Colors = {
  'paused': 'var(--global-grey)',
  'error': 'var(--red-cancel)',
  'awaiting-conversion': 'var(--global-grey)',
  'downloaded': 'var(--green-accept)',
  'custom-selection': 'var(--custom-selection-color)',
  'awaiting-download': 'var(--button-purple)',
  'review-conversion': 'var(--orange-warning)'
}
const Strings = {
  'paused': 'paused',
  'error': 'conversion error',
  'awaiting-conversion': 'awaiting conversion',
  'downloaded': 'downloaded',
  'custom-selection': 'paused',
  'awaiting-download': 'awaiting download',
  'review-conversion': 'review conversion'
}

export default TrackController
