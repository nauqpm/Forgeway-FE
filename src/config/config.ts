// /src/config/config.ts

import { envConfig } from './envConfig';
import { apiRoutes } from './apiRoutes';

// ✅ Export API_URL separately for direct imports
export const API_URL = envConfig.API_URL;

// ✅ Export full config for importing `{ config }` when multiple values are needed
export const config = {
    API_URL,
    APP_URL: envConfig.APP_URL,
    ROUTES: apiRoutes,
    DEFAULT_IMAGE_URL: '/images/default-thumbnail.png', // Default image when no thumbnail exists
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_FORMATS: ['image/jpg', 'image/jpeg', 'image/png'],
    ENVIRONMENT: envConfig.ENVIRONMENT,
};
