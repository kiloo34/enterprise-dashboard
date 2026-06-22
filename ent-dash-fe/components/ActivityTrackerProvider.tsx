"use client";

import { useActivityTracker } from '@/hooks/useActivityTracker';
import React from 'react';

export function ActivityTrackerProvider({ children }: { children: React.ReactNode }) {
  // Mount the activity tracker hook at the root level
  useActivityTracker();

  return <>{children}</>;
}
