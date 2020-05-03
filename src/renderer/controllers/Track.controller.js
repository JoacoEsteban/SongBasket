let VueInstance
const getVueInstance = () => (VueInstance || (VueInstance = require('../main').default))
const TrackController = {
  getArtistsString: (item) => (item.artists || item.data.artists).map(({name}) => name).join(', '),
  getPlaylistsString: (item) => item.playlists.map(({id}) => getVueInstance().$store.getters.PlaylistById(id)).map(({name}) => name).join(', '),
  populateTrackSelection: track => {
    if (track.flags.conversionError) return null
    let selectionId = track.selection

    if (selectionId === false) return track.selectionObj = track.custom
    if (selectionId === null) selectionId = track.conversion.bestMatch

    track.selectionObj = track.conversion.yt.find(yt => yt && yt.youtube_id === selectionId)
  },
  getStatus: function (t) {
    const slug = (() => {
      const f = t.flags || {converted: false}
      if (f.paused) return 'paused'
      if (f.conversionError) return 'error'
      if (!f.converted) return 'awaiting-conversion'
      if (this.isDownloaded(t)) return 'downloaded'
      // check selected doubtly conversion
      if (!t.selectionObj) return 'no-conversion'
      if (t.selectionObj.isCustomTrack) return 'custom:awaiting-download'
      if (f.selectionIsApplied || !t.selectionObj.isDoubtlyConversion) return 'awaiting-download'
      return 'review-conversion'
    })()

    return {
      slug,
      str: Strings[slug],
      color: Colors[slug]
    }
  },
  sort (a, b) {
    if (a.status.slug === 'review-conversion') return -1
    if (b.status.slug === 'review-conversion') return 1

    if (a.status.slug === 'error') return -1
    if (b.status.slug === 'error') return 1

    if (a.status.slug === 'downloaded') return 1
    if (b.status.slug === 'downloaded') return -1
    return 0
  },
  isDownloaded: function ({id, selectionObj}) {
    const dlTrack = getVueInstance().DOWNLOADED_TRACKS[id]
    return !!(dlTrack && dlTrack[selectionObj.youtube_id])
  }
}

const Colors = {
  'paused': 'var(--global-grey)',
  'error': 'var(--red-cancel)',
  'awaiting-conversion': 'var(--global-grey)',
  'downloaded': 'var(--green-accept)',
  'custom-selection': 'var(--custom-selection-color)',
  'awaiting-download': 'var(--button-purple)',
  'custom:awaiting-download': 'var(--custom-selection-color)',
  'review-conversion': 'var(--orange-warning)',
  'no-conversion': 'var(--global-grey)'
}
const Strings = {
  'paused': 'paused',
  'error': 'conversion error',
  'awaiting-conversion': 'awaiting conversion',
  'downloaded': 'downloaded',
  'custom-selection': 'paused',
  'awaiting-download': 'awaiting download',
  'custom:awaiting-download': 'awaiting download | custom',
  'review-conversion': 'review conversion',
  'no-conversion': 'no conversion found'
}

export default TrackController
