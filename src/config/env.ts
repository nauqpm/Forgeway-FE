export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
  environment: process.env.NODE_ENV ?? 'development',
  maxFileSize: 5 * 1024 * 1024,
  supportedImageFormats: ['image/jpg', 'image/jpeg', 'image/png'],
  defaultImageUrl: '/images/default-thumbnail.png',
};
