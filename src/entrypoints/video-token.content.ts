export default defineContentScript({
  matches: ['https://dl.115cdn.net/video/token*'],
  runAt: 'document_start',
  main(ctx) {
    import('../content/video-token.ts');
  },
});
