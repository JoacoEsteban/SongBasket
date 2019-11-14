import dotenv from 'dotenv-flow'
global.HOME_FOLDER = 'not set'
if (process.env.NODE_ENV === 'production') {
  process.env.BACKEND = 'https://api.songbasket.com'
} else dotenv.config()
