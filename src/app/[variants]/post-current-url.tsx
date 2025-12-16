"use client";

import { useState, useEffect, useCallback } from "react";

interface UsePostPathProps {
  allowedOrigins?: string;
  pollingInterval?: number;
  reqKey?: string;
  resKey?: string;
}

export function PostCurrentUrl(props?: UsePostPathProps) {
  const {
    reqKey = "GET_PATHNAME",
    resKey = "GET_PATHNAME_RESPONSE",
    allowedOrigins = "*",
    pollingInterval = 200,
  } = props || {};

  const [currentUrl, setCurrentUrl] = useState<string>("");

  // Method to dispatch current pathname
  const sendCurrentUrl = useCallback((currentUrl: string) => {
    if (typeof window !== "undefined") {
      window.parent.postMessage(
        { key: resKey, value: currentUrl },
        allowedOrigins
      );
    }
  }, [allowedOrigins, resKey]);


  // Poll current url
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastUrl = window.location.origin + window.location.pathname + window.location.search;
    setCurrentUrl(lastUrl);

    const checkPath = () => {
      const current = window.location.origin + window.location.pathname + window.location.search;
      if (current !== lastUrl) {
        lastUrl = current;
        setCurrentUrl(current);
        sendCurrentUrl(current);
      }
    };

    const id = setInterval(checkPath, pollingInterval);
    return () => {
      clearInterval(id);
    };
  }, [pollingInterval]);


  // Listen for queries from other windows
  useEffect(() => {
    const receiveQuery = (e: MessageEvent) => {
      if (e.data?.key === reqKey) {
        sendCurrentUrl(currentUrl);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message", receiveQuery);
      return () => {
        window.removeEventListener("message", receiveQuery);
      };
    }
    return () => {};
  }, [reqKey, sendCurrentUrl, currentUrl]);

  return null;
}
