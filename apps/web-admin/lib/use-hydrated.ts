'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
