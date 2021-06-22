const ENV_PROD = global.ENV_PROD = process.env.NODE_ENV === 'production'
global.IS_DEV = !ENV_PROD
