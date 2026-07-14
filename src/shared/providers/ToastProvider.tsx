'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster position="top-right" containerStyle={{ zIndex: 1000001 }} />;
}
