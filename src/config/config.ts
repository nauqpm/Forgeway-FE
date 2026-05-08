// /src/config/config.ts

import { envConfig } from './envConfig';
import { apiRoutes } from './apiRoutes';

// ✅ Xuất API_URL riêng để dễ import trực tiếp
export const API_URL = envConfig.API_URL;

// ✅ Xuất toàn bộ config để có thể import `{ config }` khi cần nhiều giá trị
export const config = {
    API_URL,
    APP_URL: envConfig.APP_URL,
    ROUTES: apiRoutes,
    DEFAULT_IMAGE_URL: '/images/default-thumbnail.png', // Ảnh mặc định nếu không có thumbnail
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_FORMATS: ['image/jpg', 'image/jpeg', 'image/png'],
    ENVIRONMENT: envConfig.ENVIRONMENT,
};
