"use client";

import { useNotifications } from '@/hooks/useNotifications';
import React from 'react';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // This hook sets up the SSE connection and handles incoming toasts globally.
  useNotifications();

  return <>{children}</>;
}
