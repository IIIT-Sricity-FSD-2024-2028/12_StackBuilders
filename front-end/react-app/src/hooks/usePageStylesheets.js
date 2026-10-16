import { useEffect, useState } from "react";

export default function usePageStylesheets(stylesheets) {
  const hrefs = [...new Set(Array.isArray(stylesheets) ? stylesheets : [stylesheets])].filter(Boolean);
  const key = hrefs.join("|");
  const [loadedKey, setLoadedKey] = useState("");

  useEffect(() => {
    if (!key) {
      setLoadedKey(key);
      return undefined;
    }

    let active = true;
    const links = [];
    const loaded = hrefs.map((href) => new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      links.push(link);
      document.head.appendChild(link);
    }));

    Promise.all(loaded).then(() => {
      if (active) setLoadedKey(key);
    });

    return () => {
      active = false;
      links.forEach((link) => link.remove());
    };
  }, [key]);

  return loadedKey === key;
}
