export default defineContentScript({
  matches: ['https://115vod.com/*'],
  runAt: 'document_end',
  main(ctx) {
    import('../content/vod-fullscreen.ts');
  },
});
