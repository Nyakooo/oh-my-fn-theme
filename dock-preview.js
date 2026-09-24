"use strict";

// Load the real extension content script on this local preview without requiring
// an installed extension or granting any network access.
window.chrome = {
  storage: {
    local: {
      async get(keys) {
        return {
          fnosBrand: { enabled: true, theme: "moonlit", title: "fnOS · 归家桌面" },
          fnosSites: [{ origin: location.origin }]
        };
      }
    },
    onChanged: { addListener() {} }
  }
};
