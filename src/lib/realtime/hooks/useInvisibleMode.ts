'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/shared/hooks/useAuth';
import api from '@/lib/axiosIns';
import toast from 'react-hot-toast';

export function useInvisibleMode() {
  const { user } = useAuth();

  const [localInvisible, setLocalInvisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (
      user &&
      (user as { presenceInvisible?: boolean }).presenceInvisible !== undefined &&
      localInvisible === null
    ) {
      setLocalInvisible((user as { presenceInvisible?: boolean }).presenceInvisible ?? false);
    }
  }, [user, localInvisible]);

  const isInvisible = localInvisible !== null ? localInvisible : false;

  const toggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.post('/presence/invisible', { invisible: !isInvisible });
      setLocalInvisible(!isInvisible);
      toast.success(!isInvisible ? 'You are now invisible' : 'You are now visible');
    } catch {
      toast.error('Failed to update presence status');
    }
  };

  return { isInvisible, toggle };
}
