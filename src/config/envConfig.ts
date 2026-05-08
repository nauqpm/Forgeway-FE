// /src/config/envConfig.ts

export const envConfig = {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ENVIRONMENT: process.env.NODE_ENV || 'development',
};
