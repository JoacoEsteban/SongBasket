import dotenv from 'dotenv-flow'
if (process.env.NODE_ENV === 'production') {
  process.env.BACKEND = 'https://api.songbasket.com'
} else dotenv.config()
