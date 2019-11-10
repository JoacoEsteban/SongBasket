import dotenv from 'dotenv-flow'
process.env.HOME_FOLDER = 'not set'
if (process.env.NODE_ENV === 'production') {
  process.env.BACKEND = 'https://api.songbasket.com'
} else dotenv.config()
