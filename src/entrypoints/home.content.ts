export default defineContentScript({
  matches: ['*://*.115.com/*', '*://115.com/*'],
  runAt: 'document_end',
  allFrames: true,
  matchAboutBlank: true,
  main(ctx) {
    import('../content/home.ts');
  },
});
