'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 9999999 }}
      toastOptions={{
        style: {
          wordBreak: 'break-word',
        },
      }}
    />
  );
}
