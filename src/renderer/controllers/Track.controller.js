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

    track.selectionObj = track.conversion.yt.find(yt => yt && yt.youtube_id === selectionId) || (track.custom && track.custom.youtube_id === selectionId && track.custom)
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
    const aOrd = SortOrders[a.status.slug]
    const bOrd = SortOrders[b.status.slug]

    if (!aOrd || !bOrd) return

    return aOrd - bOrd
  },
  isDownloaded: function ({id, selectionObj}) {
    const dlTrack = getVueInstance().DOWNLOADED_TRACKS[id]
    return !!(dlTrack && dlTrack[selectionObj.youtube_id])
  }
}

const SortOrders = {
  'paused': 1000,
  'error': 0,
  'awaiting-conversion': 5,
  'downloaded': 100,
  'awaiting-download': 10,
  'custom:awaiting-download': 10,
  'review-conversion': 2,
  'no-conversion': 1
}

const Colors = {
  'paused': 'var(--global-grey)',
  'error': 'var(--red-cancel)',
  'awaiting-conversion': 'var(--global-grey)',
  'downloaded': 'var(--green-accept)',
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
  'awaiting-download': 'awaiting download',
  'custom:awaiting-download': 'awaiting download | custom',
  'review-conversion': 'review conversion',
  'no-conversion': 'no conversion found'
}

export default TrackController
