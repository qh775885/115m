export default defineContentScript({
  matches: ['*://*.115.com/*', '*://115.com/*'],
  runAt: 'document_end',
  allFrames: true,
  matchAboutBlank: true,
  cssInjectionMode: "ui",
  main(ctx) {
    if (/\/web\/lixian\/master\/video\//.test(window.location.pathname)) return
    void import('../content/home.ts')
  },
});
