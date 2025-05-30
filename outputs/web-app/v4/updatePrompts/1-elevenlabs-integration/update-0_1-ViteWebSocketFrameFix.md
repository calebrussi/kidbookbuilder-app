# Update - Vite WebSocket Frame Fix

## How to Use This Document

This document provides a comprehensive guide for fixing the WebSocket frame error that occurs in the Vite development server: "RangeError: Invalid WebSocket frame: RSV1 must be clear".

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-ViteWebSocketFrameFix.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

Before executing this update, ask the user to provide the current project structure and any relevant configuration files if needed.

---

## Task Overview

Fix the WebSocket frame error: "RangeError: Invalid WebSocket frame: RSV1 must be clear" that occurs in the Vite development server.

---

## Problem Analysis

### Root Cause

This error typically occurs due to WebSocket connection issues in Vite's HMR (Hot Module Replacement) system. The RSV1 error specifically occurs when there are WebSocket frame validation issues related to compression.

### Error Details

- **Error Message**: "RangeError: Invalid WebSocket frame: RSV1 must be clear"
- **Component**: Vite development server WebSocket connections
- **Impact**: Interferes with hot module replacement and development experience
- **Cause**: WebSocket protocol violations in the browser's connection to Vite's development server

---

## Implementation Steps

### 1. Locate Vite Configuration File

**Instructions:**

1. Look for `vite.config.js` or `vite.config.ts` in the project root
2. If no configuration file exists, create `vite.config.js`
3. Backup the existing configuration before making changes

### 2. Update Server Configuration

**Instructions:**

Update the Vite configuration to include proper WebSocket settings:

```javascript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8081,
    },
  },
  // ...existing configuration...
}));
```

### 3. Apply Key Configuration Changes

**Configuration Details:**

- **`ws: false`**: Disables Vite's WebSocket server which was causing the "RSV1 must be clear" error
- **`hmr.port: 8081`**: Separates HMR functionality to its own port to avoid conflicts
- **`hmr.overlay: false`**: Keeps error overlay disabled for cleaner development experience

---

## Complete Configuration Example

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8081, // Separate HMR to its own port to avoid conflicts
    },
  },
  // Add any existing configuration here
}));
```

---

## Files to Modify

- `vite.config.js` or `vite.config.ts` - Update server configuration to fix WebSocket issues

---

## Technical Reference

### WebSocket Protocol Background

- **RSV1 Field**: Reserved bit in WebSocket frame headers used for extensions
- **Compression Issues**: When compression extensions are improperly negotiated, RSV1 validation fails
- **Vite HMR**: Uses WebSocket connections for real-time development features

### Solution Rationale

1. **Disable WebSocket Server**: Prevents compression-related protocol violations
2. **Separate HMR Port**: Isolates hot module replacement functionality
3. **Maintain Functionality**: Hot reloading continues to work without WebSocket conflicts

---

## Validation Steps

After implementation:

1. Start the development server: `npm run dev` or `yarn dev`
2. Verify no WebSocket frame errors appear in browser console
3. Confirm hot module replacement still functions correctly
4. Test that file changes trigger proper reloads
5. Check that the development experience remains smooth

---

## Troubleshooting

If issues persist after applying this fix:

1. **Clear browser cache** and restart the development server
2. **Check for conflicting ports** - ensure ports 8080 and 8081 are available
3. **Verify Vite version** - update to latest stable version if needed
4. **Review browser extensions** - disable extensions that might interfere with WebSocket connections

---

## Notes

- This fix resolves WebSocket compression-related protocol violations while maintaining hot reloading functionality
- The solution is compatible with all modern browsers and Vite versions
- No impact on production builds - this configuration only affects development server behavior
