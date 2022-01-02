type Image = {
  url: string,
  width: number,
  height: number
}

enum ImageSizes {
  default = 'default',
  medium = 'medium',
  high = 'high',
  standard = 'standard',
}

type Thumbnails = {
  [Property in ImageSizes]: Image
}

export type YouTubeResultId = string

export type TrackConversionResponse = {
  id: string,
  yt: YouTubeResult[],
  nameTokens: ({
    str: string,
    regex: string,
  })[],
  bestMatch: YouTubeResultId
}

export type YouTubeResult = {
  id: YouTubeResultId,
  duration: number,
  snippet: {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: Thumbnails,
    channelTitle: string,
    tags: string[],
    categoryId: string,
    liveBroadcastContent: string,
    localized: {
      title: string,
      description: string
    }
  },
  youtube_id: string,
  nameFormatted: string,
  nameTokensMap: Boolean[],
  matchedTokensCount: number,
  durationDiff: number,
  durationScore: number,
  wordScore: number,
  isDoubtlyConversion: boolean,
  isBestMatch: boolean,
  isCustomTrack?: boolean,
}
