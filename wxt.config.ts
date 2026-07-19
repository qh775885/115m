import { defineConfig } from 'wxt';
import pkg from './package.json';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  zip: {
    artifactTemplate: '115m-v{{version}}.zip',
  },
  webExt: {
    disabled: true,
  },
  dev: {
    server: {
      port: 3000,
    }
  },
  manifest: ({ mode }) => ({
    name: mode === 'development' ? "115m [DEV]" : "115m",
    version: pkg.version,
    description: "115m | 列表预览图 + 无损播放",
    permissions: [
      "storage",
      "unlimitedStorage",
      "downloads",
      "cookies",
      "scripting",
      "webNavigation",
      "tabs"
    ],
    host_permissions: [
      "https://115.com/*",
      "https://*.115.com/*",
      "https://webapi.115.com/*",
      "https://proapi.115.com/*",
      "https://aps.115.com/*",
      "https://dl.115cdn.net/*",
      "https://cdnfhnfile.115cdn.net/*",
      "https://115vod.com/*",
      "https://*.115vod.com/*"
    ],
    action: {
      default_title: "115m",
      default_icon: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  })
});
