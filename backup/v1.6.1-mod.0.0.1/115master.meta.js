// ==UserScript==
// @name         115Master 修改版
// @namespace    115Master-Modified
// @version      1.6.1-mod.0.0.1
// @author       原作者: cbingb666, 修改者: qh775885
// @description  115网盘魔法优化修改版: 画质增强 | 视频缩略图 | 在线字幕 | 画质选择记忆功能 (基于 cbingb666 原作品修改)
// @license      MIT
// @icon         https://115.com/favicon.ico
// @homepage     https://github.com/qh775885/115master
// @homepageURL  https://github.com/qh775885/115master
// @source       https://github.com/qh775885/115master.git
// @supportURL   https://github.com/qh775885/115master/issues
// @downloadURL  https://github.com/qh775885/115master/releases/latest/download/115master.user.js
// @updateURL    https://github.com/qh775885/115master/releases/latest/download/115master.meta.js
// @include      https://115.com/?ct*
// @include      https://115.com/web/lixian/master/video/*
// @include      https://115.com/web/lixian/master/magnet/*
// @include      https://115.com/?aid*
// @include      https://dl.115cdn.net/video/token
// @exclude      https://*.115.com/bridge*
// @exclude      https://*.115.com/static*
// @exclude      https://q.115.com/*
// @require      https://fastly.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.js
// @require      https://fastly.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require      https://fastly.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @require      https://fastly.jsdelivr.net/npm/big-integer@1.6.52/BigInteger.min.js
// @require      data:application/javascript,%3Bwindow.bigInt%3DbigInt%3B
// @require      https://fastly.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js
// @require      https://fastly.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js
// @require      data:application/javascript,%3Bwindow.dayjs%3Ddayjs%3B
// @require      https://fastly.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js
// @require      https://fastly.jsdelivr.net/npm/m3u8-parser@7.2.0/dist/m3u8-parser.min.js
// @require      https://fastly.jsdelivr.net/npm/photoswipe@5.4.4/dist/umd/photoswipe.umd.min.js
// @require      data:application/javascript,%3Bwindow.photoswipe%3DPhotoSwipe%3B
// @require      https://fastly.jsdelivr.net/npm/photoswipe@5.4.4/dist/umd/photoswipe-lightbox.umd.min.js
// @require      data:application/javascript,%3Bwindow.PhotoSwipeLightbox%3DPhotoSwipeLightbox%3B
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @resource     icon  https://115.com/favicon.ico
// @connect      115.com
// @connect      115vod.com
// @connect      aps.115.com
// @connect      webapi.115.com
// @connect      proapi.115.com
// @connect      cpats01.115.com
// @connect      dl.115cdn.net
// @connect      cdnfhnfile.115cdn.net
// @connect      v.anxia.com
// @connect      subtitlecat.com
// @connect      javbus.com
// @connect      javdb.com
// @connect      jdbstatic.com
// @connect      missav.ws
// @grant        GM_addStyle
// @grant        GM_cookie
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        window.close
// @run-at       document-start
// ==/UserScript==
