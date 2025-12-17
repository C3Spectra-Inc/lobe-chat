"use client";

// Allow optional postMessage bridge for iframe hosts (off unless NEXT_PUBLIC_ENABLE_EMBED_BRIDGE=1)
import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { useGlobalStore } from '@/store/global';

// Flag to guard the bridge so default deployments stay untouched
const enableBridge = process.env.NEXT_PUBLIC_ENABLE_EMBED_BRIDGE === '1';

// Comma-separated allowlist for parent origins; empty or * means allow any
const allowedOrigins =
  process.env.NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

// Decide if we should allow any origin or restrict to the provided list
const acceptsAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*');
const targetOrigins = acceptsAnyOrigin ? ['*'] : allowedOrigins;

// Keys used by host to request current URL and by us to respond
const requestKey = process.env.NEXT_PUBLIC_EMBED_URL_REQUEST_KEY || 'GET_PATHNAME';
const responseKey = process.env.NEXT_PUBLIC_EMBED_URL_RESPONSE_KEY || 'GET_PATHNAME_RESPONSE';

// Query parameter the host can use to hint theme (l/d/a)
const themeParamKey = process.env.NEXT_PUBLIC_EMBED_THEME_PARAM || 'thm';

// Helper to validate a postMessage origin
const isAllowedOrigin = (origin: string) => acceptsAnyOrigin || allowedOrigins.includes(origin);

// Type guard for allowed theme values
const isThemeValue = (value: string | null): value is 'light' | 'dark' | 'auto' => {
  return value === 'light' || value === 'dark' || value === 'auto';
};

export function PostCurrentUrl() {
  // Track current route + query to send upstream
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const switchThemeMode = useGlobalStore((s) => s.switchThemeMode);

  // Compose full URL for parent consumption
  const href = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const query = searchParams?.toString();
    const search = query ? `?${query}` : '';

    return `${window.location.origin}${pathname}${search}`;
  }, [pathname, searchParams]);

  // Send current URL to parent (if any) respecting origin rules
  const sendCurrentUrl = useCallback(
    (url: string) => {
      if (!url || typeof window === 'undefined' || window.parent === window) return;

      targetOrigins.forEach((origin) => {
        window.parent.postMessage(
          { key: responseKey, type: 'lobechat:url', value: url },
          origin,
        );
      });
    },
    [],
  );

  // Emit the URL whenever it changes (only when bridge enabled and running inside an iframe)
  useEffect(() => {
    if (!enableBridge) return;
    if (typeof window === 'undefined' || window.parent === window) return;
    if (!href) return;

    sendCurrentUrl(href);
  }, [href, sendCurrentUrl]);

  // Accept theme hint via query param to keep iframe and host aligned
  useEffect(() => {
    if (!enableBridge) return;
    if (!searchParams) return;

    const themeParam = searchParams.get(themeParamKey);
    const nextTheme =
      themeParam === 'l' ? 'light' : themeParam === 'd' ? 'dark' : themeParam === 'a' ? 'auto' : themeParam;

    if (isThemeValue(nextTheme)) {
      switchThemeMode(nextTheme, { skipBroadcast: true });
    }
  }, [searchParams, switchThemeMode, themeParamKey]);

  // Listen for parent messages requesting URL or pushing theme updates
  useEffect(() => {
    if (!enableBridge) return;
    if (typeof window === 'undefined' || window.parent === window) return;

    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return;

      const { key, type, theme } = event.data || {};

      if (key === requestKey || type === 'lobechat:getUrl') {
        sendCurrentUrl(href);
      }

      if (type === 'lobechat:setTheme' && isThemeValue(theme)) {
        switchThemeMode(theme, { skipBroadcast: true });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [href, sendCurrentUrl, switchThemeMode]);

  return null;
}
