"use client";

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { useGlobalStore } from '@/store/global';

const enableBridge = process.env.NEXT_PUBLIC_ENABLE_EMBED_BRIDGE === '1';

const allowedOrigins =
  process.env.NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

const acceptsAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*');
const targetOrigins = acceptsAnyOrigin ? ['*'] : allowedOrigins;

const requestKey = process.env.NEXT_PUBLIC_EMBED_URL_REQUEST_KEY || 'GET_PATHNAME';
const responseKey = process.env.NEXT_PUBLIC_EMBED_URL_RESPONSE_KEY || 'GET_PATHNAME_RESPONSE';
const themeParamKey = process.env.NEXT_PUBLIC_EMBED_THEME_PARAM || 'thm';

const isAllowedOrigin = (origin: string) => acceptsAnyOrigin || allowedOrigins.includes(origin);

const isThemeValue = (value: string | null): value is 'light' | 'dark' | 'auto' => {
  return value === 'light' || value === 'dark' || value === 'auto';
};

export function PostCurrentUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const switchThemeMode = useGlobalStore((s) => s.switchThemeMode);

  const href = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const query = searchParams?.toString();
    const search = query ? `?${query}` : '';

    return `${window.location.origin}${pathname}${search}`;
  }, [pathname, searchParams]);

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

  useEffect(() => {
    if (!enableBridge) return;
    if (typeof window === 'undefined' || window.parent === window) return;
    if (!href) return;

    sendCurrentUrl(href);
  }, [href, sendCurrentUrl]);

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
