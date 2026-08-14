export default defineContentScript({
  matches: ['https://115vod.com/*', 'https://*.115vod.com/*'],
  runAt: 'document_end',
  cssInjectionMode: "ui",
  main(_ctx) {
    import('../content/vod-fullscreen.ts');
  },
});
