/**
 * @deprecated Use @/config/api instead. This file re-exports the unified API instance.
 * The unified API instance uses httpOnly cookies for auth and has proper 401 handling.
 */
import api from '@/config/api';

// Re-export everything from the unified API
export default api;
export { API_URL, API_HEADERS, getAuthHeaders, buildApiUrl, API_TIMEOUT } from '@/config/api';
