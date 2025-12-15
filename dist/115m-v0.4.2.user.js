// ==UserScript==
// @name         115m
// @namespace    115m
// @version      0.4.2
// @author       laomo
// @description  (基于 cbingb666 的 115Master 原作品修改)
// @license      MIT
// @icon         https://115.com/favicon.ico
// @include      https://115.com/?ct*
// @include      https://115.com/web/lixian/master/video/*
// @include      https://115.com/?aid*
// @include      https://dl.115cdn.net/video/token
// @exclude      https://*.115.com/bridge*
// @exclude      https://*.115.com/static*
// @exclude      https://q.115.com/*
// @require      https://fastly.jsdelivr.net/npm/vue@3.5.21/dist/vue.global.prod.js
// @require      https://fastly.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require      https://fastly.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @require      https://fastly.jsdelivr.net/npm/big-integer@1.6.52/BigInteger.min.js
// @require      data:application/javascript,%3Bwindow.bigInt%3DbigInt%3B
// @require      https://fastly.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js
// @require      https://fastly.jsdelivr.net/npm/dayjs@1.11.18/dayjs.min.js
// @require      data:application/javascript,%3Bwindow.dayjs%3Ddayjs%3B
// @require      https://fastly.jsdelivr.net/npm/hls.js@1.6.11/dist/hls.min.js
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
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(o=>{if(typeof GM_addStyle=="function"){GM_addStyle(o);return}const t=document.createElement("style");t.textContent=o,document.head.append(t)})(" /*! PhotoSwipe main CSS by Dmytro Semenov | photoswipe.com */.pswp{--pswp-bg: #000;--pswp-placeholder-bg: #222;--pswp-root-z-index: 100000;--pswp-preloader-color: rgba(79, 79, 79, .4);--pswp-preloader-color-secondary: rgba(255, 255, 255, .9);--pswp-icon-color: #fff;--pswp-icon-color-secondary: #4f4f4f;--pswp-icon-stroke-color: #4f4f4f;--pswp-icon-stroke-width: 2px;--pswp-error-text-color: var(--pswp-icon-color)}.pswp{position:fixed;top:0;left:0;width:100%;height:100%;z-index:var(--pswp-root-z-index);display:none;touch-action:none;outline:0;opacity:.003;contain:layout style size;-webkit-tap-highlight-color:rgba(0,0,0,0)}.pswp:focus{outline:0}.pswp *{box-sizing:border-box}.pswp img{max-width:none}.pswp--open{display:block}.pswp,.pswp__bg{transform:translateZ(0);will-change:opacity}.pswp__bg{opacity:.005;background:var(--pswp-bg)}.pswp,.pswp__scroll-wrap{overflow:hidden}.pswp__scroll-wrap,.pswp__bg,.pswp__container,.pswp__item,.pswp__content,.pswp__img,.pswp__zoom-wrap{position:absolute;top:0;left:0;width:100%;height:100%}.pswp__img,.pswp__zoom-wrap{width:auto;height:auto}.pswp--click-to-zoom.pswp--zoom-allowed .pswp__img{cursor:-webkit-zoom-in;cursor:-moz-zoom-in;cursor:zoom-in}.pswp--click-to-zoom.pswp--zoomed-in .pswp__img{cursor:move;cursor:-webkit-grab;cursor:-moz-grab;cursor:grab}.pswp--click-to-zoom.pswp--zoomed-in .pswp__img:active{cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing}.pswp--no-mouse-drag.pswp--zoomed-in .pswp__img,.pswp--no-mouse-drag.pswp--zoomed-in .pswp__img:active,.pswp__img{cursor:-webkit-zoom-out;cursor:-moz-zoom-out;cursor:zoom-out}.pswp__container,.pswp__img,.pswp__button,.pswp__counter{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pswp__item{z-index:1;overflow:hidden}.pswp__hidden{display:none!important}.pswp__content{pointer-events:none}.pswp__content>*{pointer-events:auto}.pswp__error-msg-container{display:grid}.pswp__error-msg{margin:auto;font-size:1em;line-height:1;color:var(--pswp-error-text-color)}.pswp .pswp__hide-on-close{opacity:.005;will-change:opacity;transition:opacity var(--pswp-transition-duration) cubic-bezier(.4,0,.22,1);z-index:10;pointer-events:none}.pswp--ui-visible .pswp__hide-on-close{opacity:1;pointer-events:auto}.pswp__button{position:relative;display:block;width:50px;height:60px;padding:0;margin:0;overflow:hidden;cursor:pointer;background:none;border:0;box-shadow:none;opacity:.85;-webkit-appearance:none;-webkit-touch-callout:none}.pswp__button:hover,.pswp__button:active,.pswp__button:focus{transition:none;padding:0;background:none;border:0;box-shadow:none;opacity:1}.pswp__button:disabled{opacity:.3;cursor:auto}.pswp__icn{fill:var(--pswp-icon-color);color:var(--pswp-icon-color-secondary)}.pswp__icn{position:absolute;top:14px;left:9px;width:32px;height:32px;overflow:hidden;pointer-events:none}.pswp__icn-shadow{stroke:var(--pswp-icon-stroke-color);stroke-width:var(--pswp-icon-stroke-width);fill:none}.pswp__icn:focus{outline:0}div.pswp__img--placeholder,.pswp__img--with-bg{background:var(--pswp-placeholder-bg)}.pswp__top-bar{position:absolute;left:0;top:0;width:100%;height:60px;display:flex;flex-direction:row;justify-content:flex-end;z-index:10;pointer-events:none!important}.pswp__top-bar>*{pointer-events:auto;will-change:opacity}.pswp__button--close{margin-right:6px}.pswp__button--arrow{position:absolute;width:75px;height:100px;top:50%;margin-top:-50px}.pswp__button--arrow:disabled{display:none;cursor:default}.pswp__button--arrow .pswp__icn{top:50%;margin-top:-30px;width:60px;height:60px;background:none;border-radius:0}.pswp--one-slide .pswp__button--arrow{display:none}.pswp--touch .pswp__button--arrow{visibility:hidden}.pswp--has_mouse .pswp__button--arrow{visibility:visible}.pswp__button--arrow--prev{right:auto;left:0}.pswp__button--arrow--next{right:0}.pswp__button--arrow--next .pswp__icn{left:auto;right:14px;transform:scaleX(-1)}.pswp__button--zoom{display:none}.pswp--zoom-allowed .pswp__button--zoom{display:block}.pswp--zoomed-in .pswp__zoom-icn-bar-v{display:none}.pswp__preloader{position:relative;overflow:hidden;width:50px;height:60px;margin-right:auto}.pswp__preloader .pswp__icn{opacity:0;transition:opacity .2s linear;animation:pswp-clockwise .6s linear infinite}.pswp__preloader--active .pswp__icn{opacity:.85}@keyframes pswp-clockwise{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.pswp__counter{height:30px;margin-top:15px;margin-inline-start:20px;font-size:14px;line-height:30px;color:var(--pswp-icon-color);text-shadow:1px 1px 3px var(--pswp-icon-color-secondary);opacity:.85}.pswp--one-slide .pswp__counter{display:none}.list-contents li.with-ext-info{height:auto!important;padding-bottom:12px;flex-wrap:wrap;align-content:flex-start}.list-contents li.with-ext-info .ext-info-root{width:100%;position:relative;display:flex}.list-contents li.with-actress-info{height:auto!important}.list-contents li.with-actress-info .file-type{top:50%;transform:translateY(-50%);transition:none}.list-contents li.with-actress-info .file-name-wrap{display:flex;align-items:center;flex-direction:row;justify-content:flex-start;height:auto!important;padding-top:12px;padding-bottom:12px}.list-contents li.with-actress-info .file-name-wrap .actress-info-img{width:50px;height:50px;border-radius:50%;object-fit:cover;margin-right:12px;border:3px solid #f1f1f1;box-shadow:0 0 5px #0000001a;background-color:#f1f1f1}.list-contents li.with-ext-video-cover{height:auto!important;flex-wrap:wrap;align-content:flex-start;padding-top:0;padding-bottom:12px}.list-contents li.with-ext-video-cover:first-child{padding-top:16px}.list-contents li.with-ext-video-cover .file-name-wrap{margin-bottom:0}.list-contents li.with-ext-video-cover .ext-video-cover-root{width:100%;height:100%;position:relative;display:flex;padding-left:83px}.master-back-button{display:inline-flex;align-items:center;text-align:center;padding:4px 13px;font-size:12px;border-radius:4px;margin:auto 9px auto -6px;background-color:#f2f4f8;color:#666;vertical-align:middle;flex-shrink:0}.master-back-button:hover{background-color:color-mix(in srgb,var(--official-theme) 10%,transparent 0%);color:var(--office-theme)}.master-back-button:active{background-color:color-mix(in srgb,var(--official-theme) 15%,transparent 0%)}.master-back-button iconify-icon{margin-right:4px;font-size:14px}:root{--official-theme: #2777f8}.x-popup[data-v-935c5311]>*{position:relative;z-index:1}@keyframes loading-bounce-c8313f62{0%,80%,to{transform:scale(0);opacity:.3}40%{transform:scale(1);opacity:1}}.loading-dot-bounce[data-v-c8313f62]{animation:loading-bounce-c8313f62 1.4s infinite ease-in-out both}.loading-dot-delay-1[data-v-c8313f62]{animation-delay:-.32s}.loading-dot-delay-2[data-v-c8313f62]{animation-delay:-.16s}.loading-dot-delay-3[data-v-c8313f62]{animation-delay:0s}@keyframes fadeOut{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.4)}} ");

System.addImportMap({ imports: {"vue":"user:vue","lodash":"user:lodash","photoswipe/lightbox":"user:photoswipe/lightbox","photoswipe":"user:photoswipe","blueimp-md5":"user:blueimp-md5","dayjs":"user:dayjs","m3u8-parser":"user:m3u8-parser","big-integer":"user:big-integer","localforage":"user:localforage","hls.js":"user:hls.js"} });
System.set("user:vue", (()=>{const _=Vue;('default' in _)||(_.default=_);return _})());
System.set("user:lodash", (()=>{const _1=_;('default' in _1)||(_1.default=_1);return _1})());
System.set("user:photoswipe/lightbox", (()=>{const _=PhotoSwipeLightbox;('default' in _)||(_.default=_);return _})());
System.set("user:photoswipe", (()=>{const _=photoswipe;('default' in _)||(_.default=_);return _})());
System.set("user:blueimp-md5", (()=>{const _=md5;('default' in _)||(_.default=_);return _})());
System.set("user:dayjs", (()=>{const _=dayjs;('default' in _)||(_.default=_);return _})());
System.set("user:m3u8-parser", (()=>{const _=m3u8Parser;('default' in _)||(_.default=_);return _})());
System.set("user:big-integer", (()=>{const _=bigInt;('default' in _)||(_.default=_);return _})());
System.set("user:localforage", (()=>{const _=localforage;('default' in _)||(_.default=_);return _})());
System.set("user:hls.js", (()=>{const _=Hls;('default' in _)||(_.default=_);return _})());

System.register("./__entry.js", ['./__monkey.entry-BIbooO62.js'], (function (exports, module) {
	'use strict';
	return {
		setters: [null],
		execute: (function () {



		})
	};
}));

System.register("./__monkey.entry-BIbooO62.js", ['lodash', 'localforage', 'blueimp-md5', 'big-integer', 'vue', 'photoswipe/lightbox', 'm3u8-parser'], (function (exports, module) {
	'use strict';
	var merge, defer, throttle, i, s, l, defineComponent, ref, shallowRef, onMounted, watch, onUnmounted, computed, createElementBlock, openBlock, normalizeClass, createVNode, createElementVNode, createCommentVNode, unref, renderSlot, createTextVNode, toDisplayString, nextTick, onBeforeUnmount, Fragment, renderList, withModifiers, h, reactive, toValue, readonly, isRef, createApp, defineAsyncComponent, getCurrentInstance, getCurrentScope, onScopeDispose, toRaw, toRef$1, customRef, G, Parser;
	return {
		setters: [module => {
			merge = module.merge;
			defer = module.defer;
			throttle = module.throttle;
		}, module => {
			i = module.default;
		}, module => {
			s = module.default;
		}, module => {
			l = module.default;
		}, module => {
			defineComponent = module.defineComponent;
			ref = module.ref;
			shallowRef = module.shallowRef;
			onMounted = module.onMounted;
			watch = module.watch;
			onUnmounted = module.onUnmounted;
			computed = module.computed;
			createElementBlock = module.createElementBlock;
			openBlock = module.openBlock;
			normalizeClass = module.normalizeClass;
			createVNode = module.createVNode;
			createElementVNode = module.createElementVNode;
			createCommentVNode = module.createCommentVNode;
			unref = module.unref;
			renderSlot = module.renderSlot;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			nextTick = module.nextTick;
			onBeforeUnmount = module.onBeforeUnmount;
			Fragment = module.Fragment;
			renderList = module.renderList;
			withModifiers = module.withModifiers;
			h = module.h;
			reactive = module.reactive;
			toValue = module.toValue;
			readonly = module.readonly;
			isRef = module.isRef;
			createApp = module.createApp;
			defineAsyncComponent = module.defineAsyncComponent;
			getCurrentInstance = module.getCurrentInstance;
			getCurrentScope = module.getCurrentScope;
			onScopeDispose = module.onScopeDispose;
			toRaw = module.toRaw;
			toRef$1 = module.toRef;
			customRef = module.customRef;
		}, module => {
			G = module.default;
		}, module => {
			Parser = module.Parser;
		}],
		execute: (function () {

			exports({
				B: useIntervalFn,
				F: useElementSize,
				G: useMouseInElement,
				H: useVModel,
				J: useElementBounding,
				K: onClickOutside,
				a: useAsyncState,
				b: useThrottleFn,
				c: useDebounceFn,
				h: blurTime,
				j: useTitle,
				m: goToPlayer,
				n: getImageResize,
				o: useVModels,
				q: useEventListener,
				r: useCssVar,
				s: setVideoCookie,
				t: tryOnUnmounted,
				u: useStorage,
				v: useSmartVideoCover,
				x: syncRef,
				y: toReactive,
				z: getDefaultExportFromCjs
			});

			var e,t,r=Object.defineProperty,__publicField=(e,t,o)=>((e,t,o)=>t in e?r(e,t,{enumerable:true,configurable:true,
			writable:true,value:o}):e[t]=o)(e,"symbol"!=typeof t?t+"":t,o);function getDefaultExportFromCjs(e){
			return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}
			const Q=getDefaultExportFromCjs(function requireGlobToRegexp(){return t?e:(t=1,e=function(e,t){
			if("string"!=typeof e)throw new TypeError("Expected a string")
			;for(var r,o=String(e),a="",n=!!t&&!!t.extended,i=!!t&&!!t.globstar,s=false,l=t&&"string"==typeof t.flags?t.flags:"",c=0,d=o.length;c<d;c++)switch(r=o[c]){
			case "/":case "$":case "^":case "+":case ".":case "(":case ")":case "=":case "!":case "|":a+="\\"+r;break;case "?":if(n){a+="."
			;break}case "[":case "]":if(n){a+=r;break}case "{":if(n){s=true,a+="(";break}case "}":if(n){s=false,a+=")";break}case ",":if(s){
			a+="|";break}a+="\\"+r;break;case "*":for(var u=o[c-1],p=1;"*"===o[c+1];)p++,c++;var h=o[c+1]
			;if(i)p>1&&("/"===u||void 0===u)&&("/"===h||void 0===h)?(a+="((?:[^/]*(?:/|$))*)",c++):a+="([^/]*)";else a+=".*";break
			;default:a+=r;}return l&&~l.indexOf("g")||(a="^"+a+"$"),new RegExp(a,l)})
			}()),W="115.com",Y="dl.115cdn.net",X=`https://${W}`,K="https://115vod.com",J=`https://${Y}`,Z={HOME:`*://${W}/?*`,
			VIDEO:`*://${W}/web/lixian/master/video/*`,VIDEO_TOKEN:`*://${Y}/video/token`};class BaseMod{}class ModManager{
			constructor(e){__publicField(this,"mods",[]),this.mods=e;}register(e){this.mods.push(e);}destroy(){this.mods.forEach(e=>{
			e.destroy();});}}
			var ee=(()=>"undefined"!=typeof GM_addStyle?GM_addStyle:void 0)(),te=(()=>"undefined"!=typeof GM_cookie?GM_cookie:void 0)(),re=(()=>"undefined"!=typeof GM_getValue?GM_getValue:void 0)(),oe=(()=>"undefined"!=typeof GM_info?GM_info:void 0)(),ae=(()=>"undefined"!=typeof GM_openInTab?GM_openInTab:void 0)(),ne=(()=>"undefined"!=typeof GM_setValue?GM_setValue:void 0)(),ie=(()=>"undefined"!=typeof GM_xmlhttpRequest?GM_xmlhttpRequest:void 0)(),se=exports("O", (()=>"undefined"!=typeof unsafeWindow?unsafeWindow:void 0)()),le=(e=>(e.Yes="1",
			e))(le||{}),ce=(e=>(e.list="list",e.grid="grid",e))(ce||{});const de=void 0,ue="https://fastly.jsdelivr.net",pe={
			UNKNOWN_ERROR:"未知错误",CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING:"视频未转码，无法获取封面"}; exports({ e: de, L: ue, p: pe });function blurTime(e,t,r){const o=e-e%t+t/2
			;return Math.max(0,Math.min(o,r))}class FileItemModLoader{constructor(e,t,r,o){__publicField(this,"loadedMods",[]),
			this.itemNode=e,this.fileListType=t,this.listScrollBoxNode=r,this.mods=o;}get attributes(){
			return Object.fromEntries(Array.from(this.itemNode.attributes).map(e=>[e.name,e.value]))}get durationNode(){
			return this.itemNode.querySelector(".duration")??null}get duration(){var e;return function getDuration(e){if(!e)return 0
			;const[t=0,r=0,o=0]=e.split(":").map(Number).reverse();return 3600*o+60*r+t
			}((null==(e=this.durationNode)?void 0:e.getAttribute("duration"))??"")}get itemInfo(){return {attributes:this.attributes,
			fileListType:this.fileListType,duration:this.duration,listScrollBoxNode:this.listScrollBoxNode}}async load(){
			this.mods.forEach(e=>{const t=new e(this.itemNode,this.itemInfo);t.IS_PLUS||(t.load(),this.loadedMods.push(t));});}
			destroy(){this.loadedMods.forEach(e=>{e.destroy();});}}const he="playingVideoInfo";function goToPlayer(e,t=false){ne(he,e)
			;const r=new URLSearchParams({cid:e.cid||"",pick_code:e.pickCode
			}),o=`https://${W}/web/lixian/master/video/?${r.toString()}`;t?ae(o,{active:true}):history.pushState({},"",o);}const me={
			enableFilelistPreview:true};const fe=new class UserSettings{constructor(){__publicField(this,"value"),
			__publicField(this,"watchTasks",[]),this.value=this.create();}watch(e,t){const r={key:e,callback:t}
			;return this.watchTasks.push(r),()=>{const e=this.watchTasks.indexOf(r);e>-1&&this.watchTasks.splice(e,1);}}create(){
			const e="USER_SETTINGS",t=re(e)??{},r={...me,...t};return new Proxy(r,{get:(e,t)=>e[t],set:(t,r,o)=>{const a=t[r]
			;return t[r]=o,ne(e,t),this.watchTasks.forEach(e=>{e.key===r&&e.callback(a,o);}),true}})}};class FileItemModBase{
			constructor(e,t){__publicField(this,"IS_PLUS",false),__publicField(this,"ENABLE_KEY_IN_USER_SETTING"),this.itemNode=e,
			this.itemInfo=t;}load(){this.ENABLE_KEY_IN_USER_SETTING?(fe.value[this.ENABLE_KEY_IN_USER_SETTING]&&this.onLoad(),
			fe.watch(this.ENABLE_KEY_IN_USER_SETTING,(e,t)=>{t?this.onLoad():this.destroy();})):this.onLoad();}destroy(){
			this.onDestroy();}}const ge=exports("g", {360:"360P",480:"480P",720:"720P",1080:"1080P",2160:"4K",9999:"原画"}),be={"3G":360,SD:480,
			HD:720,UD:1080,BD:2160,YH:9999},ve=navigator.userAgent.match(/115Browser/i);class IRequest{}const we={cache:"no-cache",
			credentials:"include"};const ye=new class FetchRequest extends IRequest{constructor(e={}){super(),
			__publicField(this,"options",{}),this.options={...we,...e};}async request(e,t={}){const r={...this.options,...t
			},o=this.processUrl(e,r.params);try{return await fetch(o,r)}catch(a){
			throw new Error(`请求失败: ${a instanceof Error?a.message:String(a)}`)}}get(e,t){return this.request(e,{...t,method:"GET"})}
			post(e,t){var r;let a=t?{...t}:{};if(a.data){
			const e=(null==(r=a.headers)?void 0:r["Content-Type"])||"application/x-www-form-urlencoded";let t
			;if(e.includes("application/json"))t=JSON.stringify(a.data);else if(e.includes("application/x-www-form-urlencoded"))t=new URLSearchParams(a.data);else if(e.includes("multipart/form-data")){
			const e=new FormData;if(Object.entries(a.data).forEach(([t,r])=>{e.append(t,r);}),t=e,a.headers){const e={}
			;Object.entries(a.headers).forEach(([t,r])=>{"content-type"!==t.toLowerCase()&&(e[t]=r);}),a.headers=e;}
			}else t=String(a.data);const{data:o,...n}=a;a={...n,body:t};}return this.request(e,merge({method:"POST",headers:{
			"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"}},a))}processUrl(e,t){if(!t)return e
			;const r=new URL(e);return Object.entries(t).forEach(([e,t])=>{r.searchParams.append(e,t.toString());}),r.href}
			},xe="115master_cache";class MetaStore{constructor(e=xe,t="cache"){__publicField(this,"storage"),
			__publicField(this,"name"),__publicField(this,"storeName"),this.name=e,this.storeName=t,this.storage=i.createInstance({
			name:this.name,storeName:"meta",version:1,description:"缓存元数据",driver:i.INDEXEDDB});}async updateMeta(e,t,r,o){try{
			const a=this.generateFullKey(e),n=Date.now(),i=await this.getMeta(e),s={key:e,fullKey:a,storeName:this.storeName,
			lastAccessed:n,createdAt:r??(null==i?void 0:i.createdAt)??n,updatedAt:o??n}
			;void 0!==t?s.size=t:void 0!==(null==i?void 0:i.size)&&(s.size=i.size),await this.storage.setItem(a,s);}catch(a){}}
			async getMeta(e){const t=this.generateFullKey(e);return await this.storage.getItem(t)}async removeMeta(e){
			const t=this.generateFullKey(e);await this.storage.removeItem(t);}async getAllMeta(){const e=[]
			;return await this.storage.iterate(t=>{t.storeName===this.storeName&&e.push(t);}),e}async getSortedByLastAccessed(e=true){
			return (await this.getAllMeta()).sort((t,r)=>e?t.lastAccessed-r.lastAccessed:r.lastAccessed-t.lastAccessed)}
			async clear(){const e=await this.getAllMeta();for(const t of e)await this.storage.removeItem(t.fullKey);}
			async getCreatedAt(e){const t=await this.getMeta(e);return null==t?void 0:t.createdAt}async getUpdatedAt(e){
			const t=await this.getMeta(e);return null==t?void 0:t.updatedAt}async getSortedByCreatedAt(e=true){
			return (await this.getAllMeta()).sort((t,r)=>e?t.createdAt-r.createdAt:r.createdAt-t.createdAt)}
			async getSortedByUpdatedAt(e=true){
			return (await this.getAllMeta()).sort((t,r)=>e?t.updatedAt-r.updatedAt:r.updatedAt-t.updatedAt)}generateFullKey(e){
			return `${this.storeName}:${e}`}}class QuotaManager{constructor(e,t,r){__publicField(this,"metaStore"),
			__publicField(this,"cacheInstance"),this.cacheInstance=e,this.metaStore=new MetaStore(t,r);}async getStorageUsage(){var e
			;if(null==(e=navigator.storage)?void 0:e.estimate){const e=await navigator.storage.estimate(),t=e.usage||0,r=e.quota||0
			;return {usage:t,quota:r,usageRatio:r>0?t/r:0}}return {usage:0,quota:0,usageRatio:0}}async shouldCleanup(){
			const{usageRatio:e}=await this.getStorageUsage();return e>.8}async cleanup(e=10){
			if(!(await this.shouldCleanup()))return [];const t=await this.metaStore.getSortedByLastAccessed(true)
			;if(0===t.length)return [];const r=t.slice(0,e),o=[];for(const n of r)try{await this.cacheInstance.remove(n.key),
			await this.metaStore.removeMeta(n.key),o.push(n.key);}catch(a){}return o}async recordAccess(e,t,r,o){
			await this.metaStore.updateMeta(e,t,r,o);}async recordRemoval(e){await this.metaStore.removeMeta(e);}async clearAllMeta(){
			await this.metaStore.clear();}async autoCleanup(){if(await this.shouldCleanup()){return (await this.cleanup()).length>0}
			return  false}}class CacheCore{constructor(e={}){__publicField(this,"storage"),__publicField(this,"quotaManager"),
			__publicField(this,"enableQuotaManagement"),__publicField(this,"name"),__publicField(this,"storeName")
			;const{enableQuotaManagement:t=true,...r}=e;this.name=r.name||xe,this.storeName=r.storeName||"cache",
			this.storage=i.createInstance({name:this.name,storeName:this.storeName,version:1,description:"cache",driver:i.INDEXEDDB,
			...r}),this.enableQuotaManagement=t,this.quotaManager=new QuotaManager(this,this.name,this.storeName);}async get(e){
			const t=await this.storage.getItem(e)
			;return t&&this.enableQuotaManagement&&await this.quotaManager.recordAccess(e,t.size),t}async set(e,t){try{let r
			;this.enableQuotaManagement&&(r=this.estimateSize(t,e));const o=Date.now(),a=await this.storage.getItem(e),n={value:t,
			...void 0!==r?{size:r}:{},createdAt:(null==a?void 0:a.createdAt)||o,updatedAt:o};await this.storage.setItem(e,n),
			this.enableQuotaManagement&&(await this.quotaManager.recordAccess(e,r,n.createdAt,n.updatedAt),
			await this.quotaManager.autoCleanup());}catch(r){
			if(r instanceof DOMException&&"QuotaExceededError"===r.name&&this.enableQuotaManagement){
			(await this.quotaManager.cleanup()).length>0&&await this.set(e,t);}}}async remove(e){await this.storage.removeItem(e),
			this.enableQuotaManagement&&await this.quotaManager.recordRemoval(e);}async clear(){await this.storage.clear(),
			this.enableQuotaManagement&&await this.quotaManager.clearAllMeta();}getQuotaManager(){return this.quotaManager}
			async getCreatedAt(e){const t=await this.storage.getItem(e);return null==t?void 0:t.createdAt}async getUpdatedAt(e){
			const t=await this.storage.getItem(e);return null==t?void 0:t.updatedAt}async getAge(e){
			const t=await this.getCreatedAt(e);if(void 0!==t)return Date.now()-t}async getFreshness(e){
			const t=await this.getUpdatedAt(e);if(void 0!==t)return Date.now()-t}estimateSize(e,t){try{
			if(e instanceof Blob)return e.size
			;if(Array.isArray(e)&&e.length>0&&e[0]instanceof Blob)return e.reduce((e,t)=>t instanceof Blob?e+t.size:e,0)
			;const t=JSON.stringify(e);return new Blob([t]).size}catch(r){return}}}class GMRequestCache{
			constructor(e="gm-request-cache",t=36e5){__publicField(this,"cache"),__publicField(this,"defaultCacheTime"),
			this.cache=new CacheCore({name:xe,storeName:e,enableQuotaManagement:true}),this.defaultCacheTime=t;}async get(e,t={}){
			const r=this.generateCacheKey(e,t),o=await this.cache.get(r);if(!o)return null
			;const{serializedResponse:a,timestamp:n}=o.value,i=t.cacheTime||this.defaultCacheTime
			;return Date.now()-n>i?(await this.cache.remove(r),null):this.deserializeResponse(a)}async set(e,t,r={}){
			if((r.cacheStatus||[200]).includes(t.status))try{
			const o=this.generateCacheKey(e,r),{serialized:a}=await this.serializeResponse(t);await this.cache.set(o,{
			serializedResponse:a,timestamp:Date.now(),url:e});}catch(o){}}async remove(e,t={}){const r=this.generateCacheKey(e,t)
			;await this.cache.remove(r);}async clear(){await this.cache.clear();}getCacheCore(){return this.cache}
			generateCacheKey(e,t={}){let r=`${t.method||"GET"}:${e}`;if(t.params){r+=`:params:${JSON.stringify(t.params)}`;}
			if(t.body)try{r+=`:body:${"string"==typeof t.body?t.body:JSON.stringify(t.body)}`;}catch{r+=":body:"+typeof t.body;}
			return r}async serializeResponse(e){const t=e.clone(),r={};t.headers.forEach((e,t)=>{r[t]=e;});let o=null
			;if(t.bodyUsed)o=null;else try{const e=t.headers.get("content-type")||""
			;o=e.includes("application/json")||e.includes("text/")||e.includes("application/javascript")||e.includes("application/xml")?await t.text():await t.arrayBuffer();
			}catch(a){o=null;}return {serialized:{body:o,status:t.status,statusText:t.statusText,headers:r,url:t.url,type:t.type,
			redirected:t.redirected,bodyUsed:t.bodyUsed},original:e}}deserializeResponse(e){const t=new Headers
			;Object.entries(e.headers).forEach(([e,r])=>{t.append(e,r);});const r=e.body;return new Response(r,{status:e.status,
			statusText:e.statusText,headers:t})}}const ke=oe.userAgentData.brands.some(e=>"Google Chrome"===e.brand),_e={
			cacheStatus:[200],cache:"no-cache"};class GMRequest extends IRequest{constructor(e={},t="gm-request-cache"){super(),
			__publicField(this,"options",{}),__publicField(this,"cache"),this.options={..._e,...e},this.cache=new GMRequestCache(t);}
			async request(e,t={}){const r={...this.options,...t},o=new URL(e);r.params&&Object.entries(r.params).forEach(([e,t])=>{
			o.searchParams.set(e,t.toString());});const a=ke?r.redirect||"manual":"follow",n=o.href,i="no-cache"!==r.cache;if(i){
			const e=await this.cache.get(n,r);if(e)return e}return new Promise((e,t)=>{ie({method:r.method||"GET",url:n,
			headers:Object.fromEntries(Object.entries(r.headers||{})),data:r.body,timeout:r.timeout||5e3,
			responseType:r.responseType,nocache:!i,redirect:a,onload:async t=>{
			const o=this.parseResponseHeaders(t.responseHeaders),a=new Headers;Object.entries(o).forEach(([e,t])=>{a.append(e,t);})
			;const s=new Response(t.response,{status:t.status,statusText:t.statusText,headers:a})
			;i&&await this.cache.set(n,s.clone(),r),e(s);},onerror:e=>{t(new Error("请求失败",{cause:e.error}));},ontimeout:()=>{
			t(new Error("请求超时"));}});})}get(e,t){return this.request(e,{...t,method:"GET"})}post(e,t){return this.request(e,merge({
			method:"POST",body:new URLSearchParams(null==t?void 0:t.data),headers:{
			"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"}},t))}async clearCache(e,t){
			await this.cache.remove(e,t);}async clearAllCache(){await this.cache.clear();}getCache(){return this.cache}
			parseResponseHeaders(e){const t={};if(!e)return t;const r=e.split("\n");for(let o=0;o<r.length;o++){const e=r[o].trim()
			;if(e){const r=e.indexOf(":");if(r>0){const o=e.substring(0,r).trim(),a=e.substring(r+1).trim();t[o.toLowerCase()]=a;}}}
			return t}}function getXUrl(e){return e.includes("cpats01")?e.replace(/&s=\d+/,"&s=52428800"):e}new GMRequest
			;class Rsa115{constructor(){
			__publicField(this,"n"),__publicField(this,"e"),this.n=l("8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683",16),
			this.e=l("10001",16);}a2hex(e){let t,r="";for(let o=0;o<e.length;o++)t=e[o].toString(16),t.length<2&&(t=`0${t}`),r+=t
			;return r}hex2a(e){let t="";for(let r=0;r<e.length;r+=2)t+=String.fromCharCode(parseInt(e.substr(r,2),16));return t}
			pkcs1pad2(e,t){if(t<e.length+11)return null;const r=[];let o=t,a=e.length-1;for(;a>=0&&o>0;)r[--o]=e.charCodeAt(a--)
			;for(r[--o]=0;o>2;)r[--o]=255;r[--o]=2,r[--o]=0;const n=this.a2hex(r);return l(n,16)}pkcs1unpad2(e){let t=e.toString(16)
			;t.length%2!=0&&(t=`0${t}`);const r=this.hex2a(t);let o=1;for(;0!==r.charCodeAt(o);)o++;return r.slice(o+1)}encrypt(e){
			const t=this.pkcs1pad2(e,128);if(!t)throw new Error("pkcs1pad2 failed");let r=t.modPow(this.e,this.n).toString(16)
			;for(;r.length<256;)r=`0${r}`;return r}decrypt(e){const t=[];let r=0;for(;r<e.length;)t[r]=e.charCodeAt(r),r+=1
			;const o=l(this.a2hex(t),16).modPow(this.e,this.n);return this.pkcs1unpad2(o)}}class Crypto115{constructor(){
			__publicField(this,"rsa"),__publicField(this,"kts"),__publicField(this,"keyS"),__publicField(this,"keyL"),
			this.rsa=new Rsa115,
			this.kts=[240,229,105,174,191,220,191,138,26,69,232,190,125,166,115,184,222,143,231,196,69,218,134,196,155,100,139,20,106,180,241,170,56,1,53,158,38,105,44,134,0,107,79,165,54,52,98,166,42,150,104,24,242,74,253,189,107,151,143,77,143,137,19,183,108,142,147,237,14,13,72,62,215,47,136,216,254,254,126,134,80,149,79,209,235,131,38,52,219,102,123,156,126,157,122,129,50,234,182,51,222,58,169,89,52,102,59,170,186,129,96,72,185,213,129,156,248,108,132,119,255,84,120,38,95,190,232,30,54,159,52,128,92,69,44,155,118,213,27,143,204,195,184,245],
			this.keyS=[41,35,33,94],this.keyL=[120,6,173,76,51,134,93,24,76,1,63,70];}xor115Enc(e,t,r,o){const a=t%4,n=[]
			;for(let i=0;i<a;i++)n.push(e[i]^r[i%o]);for(let i=a;i<t;i++)n.push(e[i]^r[(i-a)%o]);return n}getkey(e,t){if(t){
			const r=[];for(let o=0;o<e;o++){const a=t[o]+this.kts[e*o]&255,n=this.kts[e*(e-1-o)];r.push(a^n);}return r}
			return 12===e?this.keyL.slice(0):this.keyS.slice(0)}asymEncode(e,t){const r=117;let o=""
			;for(let a=0;a<Math.floor((t+r-1)/r);a++)o+=this.rsa.encrypt(this.bytesToString(e.slice(a*r,Math.min((a+1)*r,t))))
			;return btoa(this.rsa.hex2a(o))}asymDecode(e,t){const r=128;let o=""
			;for(let a=0;a<Math.floor((t+r-1)/r);a++)o+=this.rsa.decrypt(this.bytesToString(e.slice(a*r,Math.min((a+1)*r,t))))
			;return this.stringToBytes(o)}symEncode(e,t,r,o){const a=this.getkey(4,r),n=this.getkey(12,o)
			;let i=this.xor115Enc(e,t,a,4);return i.reverse(),i=this.xor115Enc(i,t,n,12),i}symDecode(e,t,r,o){
			const a=this.getkey(4,r),n=this.getkey(12,o);let i=this.xor115Enc(e,t,n,12);return i.reverse(),
			i=this.xor115Enc(i,t,a,4),i}bytesToString(e){return e.map(e=>String.fromCharCode(e)).join("")}stringToBytes(e){
			return Array.from(e).map(e=>e.charCodeAt(0))}m115_encode(e,t){const r=this.stringToBytes(s(`!@###@#${t}DFDR@#@#`))
			;let o=this.stringToBytes(e);return o=this.symEncode(o,o.length,r),o=r.slice(0,16).concat(o),{
			data:this.asymEncode(o,o.length),key:r}}m115_decode(e,t){let r=this.stringToBytes(atob(e))
			;return r=this.asymDecode(r,r.length),this.bytesToString(this.symDecode(r.slice(16),r.length-16,t,r.slice(0,16)))}}
			class Drive115Error{}__publicField(Drive115Error,"NotFoundM3u8File",class extends Error{constructor(){
			super("Not found m3u8 file");}});class Drive115Core{constructor(){__publicField(this,"crypto115",new Crypto115),
			__publicField(this,"BASE_URL",X),__publicField(this,"WEB_API_URL","https://webapi.115.com"),
			__publicField(this,"PRO_API_URL","https://proapi.115.com"),__publicField(this,"VOD_URL_115",K),
			__publicField(this,"APS_URL_115","https://aps.115.com"),__publicField(this,"verifying",false);}async webApiFilesDownload(e){
			const t=await ye.get(new URL(`/files/download?pickcode=${e}`,this.WEB_API_URL).href),r=await t.json()
			;if(990001===r.errNo&&alert("登录已过期，请重新登录"),!r.state||!r.file_url)throw new Error(`服务器返回数据格式错误: ${JSON.stringify(r)}`)
			;return {url:{url:r.file_url}}}async ProPostAppChromeDownurl(e){
			const t=Math.floor(Date.now()/1e3).toString(),r=JSON.stringify({pickcode:e
			}),o=this.crypto115.m115_encode(r,t),a=`data=${encodeURIComponent(o.data)}`,n=ve?new GMRequest:ye,i=await n.post(new URL(`/app/chrome/downurl?t=${t}`,this.PRO_API_URL).href,{
			body:a}),s=await i.json();if(!s.state)throw new Error(`获取下载地址失败: ${JSON.stringify(s)}`)
			;const l=JSON.parse(this.crypto115.m115_decode(s.data,o.key));return Object.values(l)[0]}getM3u8Url(e){
			return new URL(`/api/video/m3u8/${e}.m3u8`,this.BASE_URL).href}async getM3u8Info(e,t){const r=await ye.get(e,{headers:{
			"Content-Type":"application/json"}}),o=await r.text();if(!o.startsWith("#")){let e;try{e=JSON.parse(o);}catch{
			throw new Drive115Error.NotFoundM3u8File}if(e&&false===e.state)throw 911===e.code&&this.jumpVerify(t),
			new Error(`获取m3u8文件失败: ${e.error}`)}const a=o.split("\n"),n=[];return o.split("\n").forEach((e,t)=>{var r,o
			;if(e.includes('NAME="')){if(e.match(/#EXT-X-STREAM-INF/)){
			const i=(null==(r=e.match(/NAME="([^"]*)"/))?void 0:r[1])??"",s=null==(o=a[t+1])?void 0:o.trim();n.push({name:i,
			quality:be[i],url:getXUrl(s)});}}}),n.sort((e,t)=>t.quality-e.quality),n}async ApsGetNatsortFiles(e){
			const t=await ye.get(new URL("/natsort/files.php",this.APS_URL_115).href,{params:e});return await t.json()}
			async webApiGetFiles(e){const t=await ye.get(new URL("/files",this.WEB_API_URL).href,{params:e});return await t.json()}
			async webApiGetFilesVideo(e){const t=await ye.get(new URL("/files/video",this.WEB_API_URL).href,{params:e})
			;return await t.json()}async webApiGetWebApiFilesHistory(e){
			const t=await ye.get(new URL("/files/history",this.WEB_API_URL).href,{params:e});return await t.json()}
			async webApiPostWebApiFilesHistory(e){const t=await ye.post(new URL("/files/history",this.WEB_API_URL).href,{data:e})
			;return await t.json()}async webApiPostFilesStar(e){const t=await ye.post(new URL("/files/star",this.WEB_API_URL).href,{
			data:e});return await t.json()}async webApiGetMoviesSubtitle(e){
			const t=await ye.get(new URL("/movies/subtitle",this.WEB_API_URL).href,{params:e});return await t.json()}jumpVerify(e){
			this.verifying||(this.verifying=true,
			alert("你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~"),ae(new URL(`?pickcode=${e}`,this.VOD_URL_115).href,{active:true}));}}
			const Ee=exports("E", new class Drive115Wrap extends Drive115Core{async getFiles(e){try{const t=await this.webApiGetFiles(e)
			;if(t.state)return t;throw new Error("webapiFiles 获取播放列表失败")}catch{const t=await this.ApsGetNatsortFiles(e)
			;if(t.state)return t;throw new Error(`获取播放列表失败: ${JSON.stringify(t)}`)}}async getPlaylist(e,t=0){const r={aid:1,cid:e,
			offset:t,limit:1150,show_dir:0,nf:"",qid:0,type:4,source:"",format:"json",star:"",is_q:"",is_share:"",r_all:1,
			o:"file_name",asc:1,cur:1,natsort:1};return this.getFiles(r)}async getM3u8(e){const t=this.getM3u8Url(e)
			;return await this.getM3u8Info(t,e)}async getFileDownloadUrl(e){try{return await this.ProPostAppChromeDownurl(e)
			}catch(t){return await this.webApiFilesDownload(e)}}}
);			const Ce="/*! tailwindcss v4.1.12 | MIT License | https://tailwindcss.com */@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-border-style:solid;--tw-gradient-position:initial;--tw-gradient-from:#0000;--tw-gradient-via:#0000;--tw-gradient-to:#0000;--tw-gradient-stops:initial;--tw-gradient-via-stops:initial;--tw-gradient-from-position:0%;--tw-gradient-via-position:50%;--tw-gradient-to-position:100%;--tw-leading:initial;--tw-font-weight:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-text-shadow-color:initial;--tw-text-shadow-alpha:100%;--tw-content:\"\"}}}@layer theme{:root,:host{--font-sans:ui-sans-serif,system-ui,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"Noto Color Emoji\";--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;--color-red-400:oklch(70.4% .191 22.216);--color-yellow-300:oklch(90.5% .182 98.111);--color-yellow-400:oklch(85.2% .199 91.936);--color-gray-100:oklch(96.7% .003 264.542);--color-neutral-300:oklch(87% 0 0);--color-neutral-800:oklch(26.9% 0 0);--color-neutral-950:oklch(14.5% 0 0);--color-black:#000;--color-white:#fff;--spacing:.25rem;--container-lg:32rem;--container-xl:36rem;--text-xs:.75rem;--text-xs--line-height:calc(1/.75);--text-sm:.875rem;--text-sm--line-height:calc(1.25/.875);--text-base:1rem;--text-base--line-height: 1.5 ;--text-lg:1.125rem;--text-lg--line-height:calc(1.75/1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75/1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2/1.5);--text-3xl:1.875rem;--text-3xl--line-height: 1.2 ;--text-4xl:2.25rem;--text-4xl--line-height:calc(2.5/2.25);--text-5xl:3rem;--text-5xl--line-height:1;--text-6xl:3.75rem;--text-6xl--line-height:1;--text-8xl:6rem;--text-8xl--line-height:1;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--leading-relaxed:1.625;--radius-lg:.5rem;--radius-xl:.75rem;--radius-2xl:1rem;--drop-shadow-xs:0 1px 1px #0000000d;--drop-shadow-xl:0 9px 7px #0000001a;--ease-out:cubic-bezier(0,0,.2,1);--ease-in-out:cubic-bezier(.4,0,.2,1);--animate-spin:spin 1s linear infinite;--blur-xs:4px;--blur-2xl:40px;--aspect-video:16/9;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4,0,.2,1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif,system-ui,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\",\"Noto Color Emoji\");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){-webkit-appearance:button;-moz-appearance:button;appearance:button}::file-selector-button{-webkit-appearance:button;-moz-appearance:button;appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}:where(:root:has(.modal-open,.modal[open],.modal:target,.modal-toggle:checked,.drawer:not(.drawer-open)>.drawer-toggle:checked)){scrollbar-gutter:stable;background-image:linear-gradient(var(--color-base-100),var(--color-base-100));--root-bg:var(--color-base-100)}@supports (color:color-mix(in lab,red,red)){:where(:root:has(.modal-open,.modal[open],.modal:target,.modal-toggle:checked,.drawer:not(.drawer-open)>.drawer-toggle:checked)){--root-bg:color-mix(in srgb,var(--color-base-100),oklch(0% 0 0) 40%)}}:where(.modal[open],.modal-open,.modal-toggle:checked+.modal):not(.modal-start,.modal-end){scrollbar-gutter:stable}@property --radialprogress{syntax: \"<percentage>\"; inherits: true; initial-value: 0%;}:root{--fx-noise:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.34' numOctaves='4' stitchTiles='stitch'%3E%3C/feTurbulence%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)' opacity='0.2'%3E%3C/rect%3E%3C/svg%3E\")}:root,[data-theme]{background-color:var(--root-bg,var(--color-base-100));color:var(--color-base-content)}:root:has(.modal-open,.modal[open],.modal:target,.modal-toggle:checked,.drawer:not([class*=drawer-open])>.drawer-toggle:checked){overflow:hidden}:root:has(input.theme-controller[value=dark]:checked),[data-theme=dark]{color-scheme:dark;--color-base-100:oklch(14% 0 0);--color-base-200:oklch(20% 0 0);--color-base-300:oklch(43% 0 0);--color-base-content:oklch(100% 0 0);--color-primary:oklch(62% .214 259.815);--color-primary-content:oklch(98% 0 0);--color-secondary:oklch(64.092% .027 229.389);--color-secondary-content:oklch(12.818% .005 229.389);--color-accent:oklch(67.271% .167 35.791);--color-accent-content:oklch(13.454% .033 35.791);--color-neutral:oklch(27.441% .013 253.041);--color-neutral-content:oklch(85.488% .002 253.041);--color-info:oklch(62.616% .143 240.033);--color-info-content:oklch(12.523% .028 240.033);--color-success:oklch(70.226% .094 156.596);--color-success-content:oklch(14.045% .018 156.596);--color-warning:oklch(77.482% .115 81.519);--color-warning-content:oklch(15.496% .023 81.519);--color-error:oklch(51.61% .146 29.674);--color-error-content:oklch(90.322% .029 29.674);--radius-selector:2rem;--radius-field:2rem;--radius-box:1rem;--size-selector:.25rem;--size-field:.25rem;--border:1px;--depth:0;--noise:0}:root:has(input.theme-controller[value=light]:checked),[data-theme=light]{color-scheme:light;--color-base-100:oklch(100% 0 0);--color-base-200:oklch(98% 0 0);--color-base-300:oklch(95% 0 0);--color-base-content:oklch(21% .006 285.885);--color-primary:oklch(62% .214 259.815);--color-primary-content:oklch(98% 0 0);--color-secondary:oklch(65% .241 354.308);--color-secondary-content:oklch(94% .028 342.258);--color-accent:oklch(77% .152 181.912);--color-accent-content:oklch(38% .063 188.416);--color-neutral:oklch(14% .005 285.823);--color-neutral-content:oklch(92% .004 286.32);--color-info:oklch(74% .16 232.661);--color-info-content:oklch(29% .066 243.157);--color-success:oklch(76% .177 163.223);--color-success-content:oklch(37% .077 168.94);--color-warning:oklch(82% .189 84.429);--color-warning-content:oklch(41% .112 45.904);--color-error:oklch(71% .194 13.428);--color-error-content:oklch(27% .105 12.094);--radius-selector:2rem;--radius-field:2rem;--radius-box:1rem;--size-selector:.25rem;--size-field:.25rem;--border:1px;--depth:0;--noise:0}}@layer components;@layer utilities{.diff{webkit-user-select:none;-webkit-user-select:none;user-select:none;direction:ltr;grid-template-columns:auto 1fr;width:100%;display:grid;position:relative;overflow:hidden;container-type:inline-size}.diff:focus-visible,.diff:has(.diff-item-1:focus-visible){outline-style:var(--tw-outline-style);outline-offset:1px;outline-width:2px;outline-color:var(--color-base-content)}.diff:focus-visible .diff-resizer{min-width:90cqi;max-width:90cqi}.diff:has(.diff-item-2:focus-visible){outline-style:var(--tw-outline-style);outline-offset:1px;outline-width:2px}.diff:has(.diff-item-2:focus-visible) .diff-resizer{min-width:10cqi;max-width:10cqi}@supports (-webkit-overflow-scrolling:touch) and (overflow:-webkit-paged-x){.diff:focus .diff-resizer{min-width:10cqi;max-width:10cqi}.diff:has(.diff-item-1:focus) .diff-resizer{min-width:90cqi;max-width:90cqi}}.tooltip{--tt-bg:var(--color-neutral);--tt-off: calc(100% + .5rem) ;--tt-tail: calc(100% + 1px + .25rem) ;display:inline-block;position:relative}.tooltip>:where(.tooltip-content),.tooltip:where([data-tip]):before{border-radius:var(--radius-field);text-align:center;white-space:normal;max-width:20rem;color:var(--color-neutral-content);opacity:0;background-color:var(--tt-bg);pointer-events:none;z-index:2;--tw-content:attr(data-tip);content:var(--tw-content);width:max-content;padding-block:.25rem;padding-inline:.5rem;font-size:.875rem;line-height:1.25;position:absolute}@media (prefers-reduced-motion:no-preference){.tooltip>:where(.tooltip-content),.tooltip:where([data-tip]):before,.tooltip:after{transition:opacity .2s cubic-bezier(.4,0,.2,1) 75ms,transform .2s cubic-bezier(.4,0,.2,1) 75ms}}.tooltip:after{opacity:0;background-color:var(--tt-bg);content:\"\";pointer-events:none;--mask-tooltip:url(\"data:image/svg+xml,%3Csvg width='10' height='4' viewBox='0 0 8 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0.500009 1C3.5 1 3.00001 4 5.00001 4C7 4 6.5 1 9.5 1C10 1 10 0.499897 10 0H0C-1.99338e-08 0.5 0 1 0.500009 1Z' fill='black'/%3E%3C/svg%3E%0A\");width:.625rem;height:.25rem;-webkit-mask-position:-1px 0;mask-position:-1px 0;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-image:var(--mask-tooltip);mask-image:var(--mask-tooltip);display:block;position:absolute}:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible))>.tooltip-content,:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible))[data-tip]:before,:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible)):after{opacity:1;--tt-pos:0rem}@media (prefers-reduced-motion:no-preference){:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible))>.tooltip-content,:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible))[data-tip]:before,:is(.tooltip.tooltip-open,.tooltip[data-tip]:not([data-tip=\"\"]):hover,.tooltip:not(:has(.tooltip-content:empty)):has(.tooltip-content):hover,.tooltip:has(:focus-visible)):after{transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1)}}.tooltip>.tooltip-content,.tooltip[data-tip]:before{transform:translate(-50%)translateY(var(--tt-pos,.25rem));inset:auto auto var(--tt-off)50%}.tooltip:after{transform:translate(-50%)translateY(var(--tt-pos,.25rem));inset:auto auto var(--tt-tail)50%}.menu{--menu-active-fg:var(--color-neutral-content);--menu-active-bg:var(--color-neutral);flex-flow:column wrap;width:fit-content;padding:.5rem;font-size:.875rem;display:flex}.menu :where(li ul){white-space:nowrap;margin-inline-start:1rem;padding-inline-start:.5rem;position:relative}.menu :where(li ul):before{background-color:var(--color-base-content);opacity:.1;width:var(--border);content:\"\";inset-inline-start:0;position:absolute;top:.75rem;bottom:.75rem}.menu :where(li>.menu-dropdown:not(.menu-dropdown-show)){display:none}.menu :where(li:not(.menu-title)>:not(ul,details,.menu-title,.btn)),.menu :where(li:not(.menu-title)>details>summary:not(.menu-title)){border-radius:var(--radius-field);text-align:start;text-wrap:balance;-webkit-user-select:none;user-select:none;grid-auto-columns:minmax(auto,max-content) auto max-content;grid-auto-flow:column;align-content:flex-start;align-items:center;gap:.5rem;padding-block:.375rem;padding-inline:.75rem;transition-property:color,background-color,box-shadow;transition-duration:.2s;transition-timing-function:cubic-bezier(0,0,.2,1);display:grid}.menu :where(li>details>summary){--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.menu :where(li>details>summary){outline-offset:2px;outline:2px solid #0000}}.menu :where(li>details>summary)::-webkit-details-marker{display:none}:is(.menu :where(li>details>summary),.menu :where(li>.menu-dropdown-toggle)):after{content:\"\";transform-origin:50%;pointer-events:none;justify-self:flex-end;width:.375rem;height:.375rem;transition-property:rotate,translate;transition-duration:.2s;display:block;translate:0 -1px;rotate:-135deg;box-shadow:inset 2px 2px}.menu :where(li>details[open]>summary):after,.menu :where(li>.menu-dropdown-toggle.menu-dropdown-show):after{translate:0 1px;rotate:45deg}.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn).menu-focus,.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn):focus-visible{cursor:pointer;background-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn).menu-focus,.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn):focus-visible{background-color:color-mix(in oklab,var(--color-base-content)10%,transparent)}}.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn).menu-focus,.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn):focus-visible{color:var(--color-base-content);--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn).menu-focus,.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title),li:not(.menu-title,.disabled)>details>summary:not(.menu-title)):not(.menu-active,:active,.btn):focus-visible{outline-offset:2px;outline:2px solid #0000}}.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title):not(.menu-active,:active,.btn):hover,li:not(.menu-title,.disabled)>details>summary:not(.menu-title):not(.menu-active,:active,.btn):hover){cursor:pointer;background-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title):not(.menu-active,:active,.btn):hover,li:not(.menu-title,.disabled)>details>summary:not(.menu-title):not(.menu-active,:active,.btn):hover){background-color:color-mix(in oklab,var(--color-base-content)10%,transparent)}}.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title):not(.menu-active,:active,.btn):hover,li:not(.menu-title,.disabled)>details>summary:not(.menu-title):not(.menu-active,:active,.btn):hover){--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title):not(.menu-active,:active,.btn):hover,li:not(.menu-title,.disabled)>details>summary:not(.menu-title):not(.menu-active,:active,.btn):hover){outline-offset:2px;outline:2px solid #0000}}.menu :where(li:not(.menu-title,.disabled)>:not(ul,details,.menu-title):not(.menu-active,:active,.btn):hover,li:not(.menu-title,.disabled)>details>summary:not(.menu-title):not(.menu-active,:active,.btn):hover){box-shadow:inset 0 1px #00000003,inset 0 -1px #ffffff03}.menu :where(li:empty){background-color:var(--color-base-content);opacity:.1;height:1px;margin:.5rem 1rem}.menu :where(li){flex-flow:column wrap;flex-shrink:0;align-items:stretch;display:flex;position:relative}.menu :where(li) .badge{justify-self:flex-end}.menu :where(li)>:not(ul,.menu-title,details,.btn):active,.menu :where(li)>:not(ul,.menu-title,details,.btn).menu-active,.menu :where(li)>details>summary:active{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.menu :where(li)>:not(ul,.menu-title,details,.btn):active,.menu :where(li)>:not(ul,.menu-title,details,.btn).menu-active,.menu :where(li)>details>summary:active{outline-offset:2px;outline:2px solid #0000}}.menu :where(li)>:not(ul,.menu-title,details,.btn):active,.menu :where(li)>:not(ul,.menu-title,details,.btn).menu-active,.menu :where(li)>details>summary:active{color:var(--menu-active-fg);background-color:var(--menu-active-bg);background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise)}:is(.menu :where(li)>:not(ul,.menu-title,details,.btn):active,.menu :where(li)>:not(ul,.menu-title,details,.btn).menu-active,.menu :where(li)>details>summary:active):not(:is(.menu :where(li)>:not(ul,.menu-title,details,.btn):active,.menu :where(li)>:not(ul,.menu-title,details,.btn).menu-active,.menu :where(li)>details>summary:active):active){box-shadow:0 2px calc(var(--depth)*3px) -2px var(--menu-active-bg)}.menu :where(li).menu-disabled{pointer-events:none;color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.menu :where(li).menu-disabled{color:color-mix(in oklab,var(--color-base-content)20%,transparent)}}.menu .dropdown:focus-within .menu-dropdown-toggle:after{translate:0 1px;rotate:45deg}.menu .dropdown-content{margin-top:.5rem;padding:.5rem}.menu .dropdown-content:before{display:none}.dropdown{position-area:var(--anchor-v,bottom)var(--anchor-h,span-right);display:inline-block;position:relative}.dropdown>:not(summary):focus{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.dropdown>:not(summary):focus{outline-offset:2px;outline:2px solid #0000}}.dropdown .dropdown-content{position:absolute}.dropdown:not(details,.dropdown-open,.dropdown-hover:hover,:focus-within) .dropdown-content{transform-origin:top;opacity:0;display:none;scale:95%}.dropdown[popover],.dropdown .dropdown-content{z-index:999}@media (prefers-reduced-motion:no-preference){.dropdown[popover],.dropdown .dropdown-content{transition-behavior:allow-discrete;transition-property:opacity,scale,display;transition-duration:.2s;transition-timing-function:cubic-bezier(.4,0,.2,1);animation:.2s dropdown}}@starting-style{.dropdown[popover],.dropdown .dropdown-content{opacity:0;scale:95%}}:is(.dropdown.dropdown-open,.dropdown:not(.dropdown-hover):focus,.dropdown:focus-within)>[tabindex]:first-child{pointer-events:none}:is(.dropdown.dropdown-open,.dropdown:not(.dropdown-hover):focus,.dropdown:focus-within) .dropdown-content{opacity:1}.dropdown.dropdown-hover:hover .dropdown-content{opacity:1;scale:100%}.dropdown:is(details) summary::-webkit-details-marker{display:none}:is(.dropdown.dropdown-open,.dropdown:focus,.dropdown:focus-within) .dropdown-content{scale:100%}.dropdown:where([popover]){background:0 0}.dropdown[popover]{color:inherit;position:fixed}@supports not (position-area:bottom){.dropdown[popover]{margin:auto}.dropdown[popover].dropdown-open:not(:popover-open){transform-origin:top;opacity:0;display:none;scale:95%}.dropdown[popover]::backdrop{background-color:oklab(0% none none/.3)}}.dropdown[popover]:not(.dropdown-open,:popover-open){transform-origin:top;opacity:0;display:none;scale:95%}:where(.btn){width:unset}.btn{cursor:pointer;text-align:center;vertical-align:middle;outline-offset:2px;webkit-user-select:none;-webkit-user-select:none;user-select:none;padding-inline:var(--btn-p);color:var(--btn-fg);--tw-prose-links:var(--btn-fg);height:var(--size);font-size:var(--fontsize,.875rem);outline-color:var(--btn-color,var(--color-base-content));background-color:var(--btn-bg);background-size:auto,calc(var(--noise)*100%);background-image:none,var(--btn-noise);border-width:var(--border);border-style:solid;border-color:var(--btn-border);text-shadow:0 .5px oklch(100% 0 0/calc(var(--depth)*.15));touch-action:manipulation;box-shadow:0 .5px 0 .5px oklch(100% 0 0/calc(var(--depth)*6%)) inset,var(--btn-shadow);--size:calc(var(--size-field,.25rem)*10);--btn-bg:var(--btn-color,var(--color-base-200));--btn-fg:var(--color-base-content);--btn-p:1rem;--btn-border:var(--btn-bg);border-start-start-radius:var(--join-ss,var(--radius-field));border-start-end-radius:var(--join-se,var(--radius-field));border-end-end-radius:var(--join-ee,var(--radius-field));border-end-start-radius:var(--join-es,var(--radius-field));flex-wrap:nowrap;flex-shrink:0;justify-content:center;align-items:center;gap:.375rem;font-weight:600;transition-property:color,background-color,border-color,box-shadow;transition-duration:.2s;transition-timing-function:cubic-bezier(0,0,.2,1);display:inline-flex}@supports (color:color-mix(in lab,red,red)){.btn{--btn-border:color-mix(in oklab,var(--btn-bg),#000 calc(var(--depth)*5%))}}.btn{--btn-shadow:0 3px 2px -2px var(--btn-bg),0 4px 3px -2px var(--btn-bg)}@supports (color:color-mix(in lab,red,red)){.btn{--btn-shadow:0 3px 2px -2px color-mix(in oklab,var(--btn-bg)calc(var(--depth)*30%),#0000),0 4px 3px -2px color-mix(in oklab,var(--btn-bg)calc(var(--depth)*30%),#0000)}}.btn{--btn-noise:var(--fx-noise)}.prose .btn{text-decoration-line:none}@media (hover:hover){.btn:hover{--btn-bg:var(--btn-color,var(--color-base-200))}@supports (color:color-mix(in lab,red,red)){.btn:hover{--btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-200)),#000 7%)}}}.btn:focus-visible,.btn:has(:focus-visible){isolation:isolate;outline-width:2px;outline-style:solid}.btn:active:not(.btn-active){--btn-bg:var(--btn-color,var(--color-base-200));translate:0 .5px}@supports (color:color-mix(in lab,red,red)){.btn:active:not(.btn-active){--btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-200)),#000 5%)}}.btn:active:not(.btn-active){--btn-border:var(--btn-color,var(--color-base-200))}@supports (color:color-mix(in lab,red,red)){.btn:active:not(.btn-active){--btn-border:color-mix(in oklab,var(--btn-color,var(--color-base-200)),#000 7%)}}.btn:active:not(.btn-active){--btn-shadow:0 0 0 0 oklch(0% 0 0/0),0 0 0 0 oklch(0% 0 0/0)}.btn:is(:disabled,[disabled],.btn-disabled):not(.btn-link,.btn-ghost){background-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.btn:is(:disabled,[disabled],.btn-disabled):not(.btn-link,.btn-ghost){background-color:color-mix(in oklab,var(--color-base-content)10%,transparent)}}.btn:is(:disabled,[disabled],.btn-disabled):not(.btn-link,.btn-ghost){box-shadow:none}.btn:is(:disabled,[disabled],.btn-disabled){pointer-events:none;--btn-border:#0000;--btn-noise:none;--btn-fg:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.btn:is(:disabled,[disabled],.btn-disabled){--btn-fg:color-mix(in oklch,var(--color-base-content)20%,#0000)}}@media (hover:hover){.btn:is(:disabled,[disabled],.btn-disabled):hover{pointer-events:none;background-color:var(--color-neutral)}@supports (color:color-mix(in lab,red,red)){.btn:is(:disabled,[disabled],.btn-disabled):hover{background-color:color-mix(in oklab,var(--color-neutral)20%,transparent)}}.btn:is(:disabled,[disabled],.btn-disabled):hover{--btn-border:#0000;--btn-fg:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.btn:is(:disabled,[disabled],.btn-disabled):hover{--btn-fg:color-mix(in oklch,var(--color-base-content)20%,#0000)}}}.btn:is(input[type=checkbox],input[type=radio]){-webkit-appearance:none;-moz-appearance:none;appearance:none}.btn:is(input[type=checkbox],input[type=radio]):after{content:attr(aria-label)}.btn:where(input:checked:not(.filter .btn)){--btn-color:var(--color-primary);--btn-fg:var(--color-primary-content);isolation:isolate}.loading{pointer-events:none;aspect-ratio:1;vertical-align:middle;width:calc(var(--size-selector,.25rem)*6);background-color:currentColor;display:inline-block;-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width='24' height='24' stroke='black' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform-origin='center'%3E%3Ccircle cx='12' cy='12' r='9.5' fill='none' stroke-width='3' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='2s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dasharray' values='0,150;42,150;42,150' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dashoffset' values='0;-16;-59' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3Csvg width='24' height='24' stroke='black' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform-origin='center'%3E%3Ccircle cx='12' cy='12' r='9.5' fill='none' stroke-width='3' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='2s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dasharray' values='0,150;42,150;42,150' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dashoffset' values='0;-16;-59' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\");-webkit-mask-position:50%;mask-position:50%;-webkit-mask-size:100%;mask-size:100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}.pointer-events-auto{pointer-events:auto}.pointer-events-none{pointer-events:none}.visible{visibility:visible}.list{flex-direction:column;font-size:.875rem;display:flex}.list :where(.list-row){--list-grid-cols:minmax(0,auto)1fr;border-radius:var(--radius-box);word-break:break-word;grid-auto-flow:column;grid-template-columns:var(--list-grid-cols);gap:1rem;padding:1rem;display:grid;position:relative}.list :where(.list-row):has(.list-col-grow:first-child){--list-grid-cols:1fr}.list :where(.list-row):has(.list-col-grow:nth-child(2)){--list-grid-cols:minmax(0,auto)1fr}.list :where(.list-row):has(.list-col-grow:nth-child(3)){--list-grid-cols:minmax(0,auto)minmax(0,auto)1fr}.list :where(.list-row):has(.list-col-grow:nth-child(4)){--list-grid-cols:minmax(0,auto)minmax(0,auto)minmax(0,auto)1fr}.list :where(.list-row):has(.list-col-grow:nth-child(5)){--list-grid-cols:minmax(0,auto)minmax(0,auto)minmax(0,auto)minmax(0,auto)1fr}.list :where(.list-row):has(.list-col-grow:nth-child(6)){--list-grid-cols:minmax(0,auto)minmax(0,auto)minmax(0,auto)minmax(0,auto)minmax(0,auto)1fr}.list :where(.list-row) :not(.list-col-wrap){grid-row-start:1}:is(.list>:not(:last-child).list-row,.list>:not(:last-child) .list-row):after{content:\"\";border-bottom:var(--border)solid;inset-inline:var(--radius-box);border-color:var(--color-base-content);position:absolute;bottom:0}@supports (color:color-mix(in lab,red,red)){:is(.list>:not(:last-child).list-row,.list>:not(:last-child) .list-row):after{border-color:color-mix(in oklab,var(--color-base-content)5%,transparent)}}.toast{translate:var(--toast-x,0)var(--toast-y,0);inset-inline:auto 1rem;background-color:#0000;flex-direction:column;gap:.5rem;width:max-content;max-width:calc(100vw - 2rem);display:flex;position:fixed;top:auto;bottom:1rem}@media (prefers-reduced-motion:no-preference){.toast>*{animation:.25s ease-out toast}}.toast:where(.toast-start){--toast-x:0;inset-inline:1rem auto}.toast:where(.toast-center){--toast-x:-50%;inset-inline:50%}.toast:where(.toast-end){--toast-x:0;inset-inline:auto 1rem}.toast:where(.toast-bottom){--toast-y:0;top:auto;bottom:1rem}.toast:where(.toast-middle){--toast-y:-50%;top:50%;bottom:auto}.toast:where(.toast-top){--toast-y:0;top:1rem;bottom:auto}.toggle{border:var(--border)solid currentColor;color:var(--input-color);cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;vertical-align:middle;webkit-user-select:none;-webkit-user-select:none;user-select:none;--radius-selector-max:calc(var(--radius-selector) + var(--radius-selector) + var(--radius-selector));border-radius:calc(var(--radius-selector) + min(var(--toggle-p),var(--radius-selector-max)) + min(var(--border),var(--radius-selector-max)));padding:var(--toggle-p);flex-shrink:0;grid-template-columns:0fr 1fr 1fr;place-content:center;display:inline-grid;position:relative;box-shadow:inset 0 1px}@supports (color:color-mix(in lab,red,red)){.toggle{box-shadow:0 1px color-mix(in oklab,currentColor calc(var(--depth)*10%),#0000) inset}}.toggle{--input-color:var(--color-base-content);transition:color .3s,grid-template-columns .2s}@supports (color:color-mix(in lab,red,red)){.toggle{--input-color:color-mix(in oklab,var(--color-base-content)50%,#0000)}}.toggle{--toggle-p:calc(var(--size)*.125);--size:calc(var(--size-selector,.25rem)*6);width:calc((var(--size)*2) - (var(--border) + var(--toggle-p))*2);height:var(--size)}.toggle>*{z-index:1;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:#0000;border:none;grid-column:2/span 1;grid-row-start:1;height:100%;padding:.125rem;transition:opacity .2s,rotate .4s}.toggle>:focus{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.toggle>:focus{outline-offset:2px;outline:2px solid #0000}}.toggle>:nth-child(2){color:var(--color-base-100);rotate:none}.toggle>:nth-child(3){color:var(--color-base-100);opacity:0;rotate:-15deg}.toggle:has(:checked)>:nth-child(2){opacity:0;rotate:15deg}.toggle:has(:checked)>:nth-child(3){opacity:1;rotate:none}.toggle:before{aspect-ratio:1;border-radius:var(--radius-selector);--tw-content:\"\";content:var(--tw-content);height:100%;box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px currentColor;background-color:currentColor;grid-row-start:1;grid-column-start:2;transition:background-color .1s,translate .2s,inset-inline-start .2s;position:relative;inset-inline-start:0;translate:0}@supports (color:color-mix(in lab,red,red)){.toggle:before{box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px color-mix(in oklab,currentColor calc(var(--depth)*10%),#0000)}}.toggle:before{background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise)}@media (forced-colors:active){.toggle:before{outline-style:var(--tw-outline-style);outline-offset:-1px;outline-width:1px}}@media print{.toggle:before{outline-offset:-1rem;outline:.25rem solid}}.toggle:focus-visible,.toggle:has(:focus-visible){outline-offset:2px;outline:2px solid}.toggle:checked,.toggle[aria-checked=true],.toggle:has(>input:checked){background-color:var(--color-base-100);--input-color:var(--color-base-content);grid-template-columns:1fr 1fr 0fr}:is(.toggle:checked,.toggle[aria-checked=true],.toggle:has(>input:checked)):before{background-color:currentColor}@starting-style{:is(.toggle:checked,.toggle[aria-checked=true],.toggle:has(>input:checked)):before{opacity:0}}.toggle:indeterminate{grid-template-columns:.5fr 1fr .5fr}.toggle:disabled{cursor:not-allowed;opacity:.3}.toggle:disabled:before{border:var(--border)solid currentColor;background-color:#0000}.input{cursor:text;border:var(--border)solid #0000;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:var(--color-base-100);vertical-align:middle;white-space:nowrap;width:clamp(3rem,20rem,100%);height:var(--size);touch-action:manipulation;border-color:var(--input-color);box-shadow:0 1px var(--input-color) inset,0 -1px oklch(100% 0 0/calc(var(--depth)*.1)) inset;border-start-start-radius:var(--join-ss,var(--radius-field));border-start-end-radius:var(--join-se,var(--radius-field));border-end-end-radius:var(--join-ee,var(--radius-field));border-end-start-radius:var(--join-es,var(--radius-field));flex-shrink:1;align-items:center;gap:.5rem;padding-inline:.75rem;font-size:.875rem;display:inline-flex;position:relative}@supports (color:color-mix(in lab,red,red)){.input{box-shadow:0 1px color-mix(in oklab,var(--input-color)calc(var(--depth)*10%),#0000) inset,0 -1px oklch(100% 0 0/calc(var(--depth)*.1)) inset}}.input{--size:calc(var(--size-field,.25rem)*10);--input-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.input{--input-color:color-mix(in oklab,var(--color-base-content)20%,#0000)}}.input:where(input){display:inline-flex}.input :where(input){-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:#0000;border:none;width:100%;height:100%;display:inline-flex}.input :where(input):focus,.input :where(input):focus-within{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.input :where(input):focus,.input :where(input):focus-within{outline-offset:2px;outline:2px solid #0000}}.input :where(input[type=url]),.input :where(input[type=email]){direction:ltr}.input :where(input[type=date]){display:inline-flex}.input:focus,.input:focus-within{--input-color:var(--color-base-content);box-shadow:0 1px var(--input-color)}@supports (color:color-mix(in lab,red,red)){.input:focus,.input:focus-within{box-shadow:0 1px color-mix(in oklab,var(--input-color)calc(var(--depth)*10%),#0000)}}.input:focus,.input:focus-within{outline:2px solid var(--input-color);outline-offset:2px;isolation:isolate;z-index:1}.input:has(>input[disabled]),.input:is(:disabled,[disabled]),fieldset:disabled .input{cursor:not-allowed;border-color:var(--color-base-200);background-color:var(--color-base-200);color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.input:has(>input[disabled]),.input:is(:disabled,[disabled]),fieldset:disabled .input{color:color-mix(in oklab,var(--color-base-content)40%,transparent)}}:is(.input:has(>input[disabled]),.input:is(:disabled,[disabled]),fieldset:disabled .input)::placeholder{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:is(.input:has(>input[disabled]),.input:is(:disabled,[disabled]),fieldset:disabled .input)::placeholder{color:color-mix(in oklab,var(--color-base-content)20%,transparent)}}.input:has(>input[disabled]),.input:is(:disabled,[disabled]),fieldset:disabled .input{box-shadow:none}.input:has(>input[disabled])>input[disabled]{cursor:not-allowed}.input::-webkit-date-and-time-value{text-align:inherit}.input[type=number]::-webkit-inner-spin-button{margin-block:-.75rem;margin-inline-end:-.75rem}.input::-webkit-calendar-picker-indicator{position:absolute;inset-inline-end:.75em}.input:has(>input[type=date]) :where(input[type=date]){webkit-appearance:none;-webkit-appearance:none;-moz-appearance:none;appearance:none;display:inline-flex}.input:has(>input[type=date]) input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;width:1em;height:1em;position:absolute;inset-inline-end:.75em}.table{border-radius:var(--radius-box);text-align:left;width:100%;font-size:.875rem;position:relative}.table:where(:dir(rtl),[dir=rtl],[dir=rtl] *){text-align:right}@media (hover:hover){:is(.table tr.row-hover,.table tr.row-hover:nth-child(2n)):hover{background-color:var(--color-base-200)}}.table :where(th,td){vertical-align:middle;padding-block:.75rem;padding-inline:1rem}.table :where(thead,tfoot){white-space:nowrap;color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.table :where(thead,tfoot){color:color-mix(in oklab,var(--color-base-content)60%,transparent)}}.table :where(thead,tfoot){font-size:.875rem;font-weight:600}.table :where(tfoot){border-top:var(--border)solid var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.table :where(tfoot){border-top:var(--border)solid color-mix(in oklch,var(--color-base-content)5%,#0000)}}.table :where(.table-pin-rows thead tr){z-index:1;background-color:var(--color-base-100);position:sticky;top:0}.table :where(.table-pin-rows tfoot tr){z-index:1;background-color:var(--color-base-100);position:sticky;bottom:0}.table :where(.table-pin-cols tr th){background-color:var(--color-base-100);position:sticky;left:0;right:0}.table :where(thead tr,tbody tr:not(:last-child)){border-bottom:var(--border)solid var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.table :where(thead tr,tbody tr:not(:last-child)){border-bottom:var(--border)solid color-mix(in oklch,var(--color-base-content)5%,#0000)}}.diff-resizer{z-index:1;resize:horizontal;opacity:0;cursor:ew-resize;transform-origin:100% 100%;clip-path:inset(calc(100% - .75rem) 0 0 calc(100% - .75rem));grid-row-start:1;grid-column-start:1;width:50cqi;min-width:1rem;max-width:calc(100cqi - 1rem);height:.5rem;transition:min-width .3s ease-out,max-width .3s ease-out;position:relative;top:50%;overflow:hidden;transform:scaleY(3)translate(.35rem,.08rem)}.range{-webkit-appearance:none;-moz-appearance:none;appearance:none;webkit-appearance:none;--range-thumb:var(--color-base-100);--range-thumb-size:calc(var(--size-selector,.25rem)*6);--range-progress:currentColor;--range-fill:1;--range-p:.25rem;--range-bg:currentColor}@supports (color:color-mix(in lab,red,red)){.range{--range-bg:color-mix(in oklab,currentColor 10%,#0000)}}.range{cursor:pointer;vertical-align:middle;--radius-selector-max:calc(var(--radius-selector) + var(--radius-selector) + var(--radius-selector));border-radius:calc(var(--radius-selector) + min(var(--range-p),var(--radius-selector-max)));width:clamp(3rem,20rem,100%);height:var(--range-thumb-size);background-color:#0000;border:none;overflow:hidden}[dir=rtl] .range{--range-dir:-1}.range:focus{outline:none}.range:focus-visible{outline-offset:2px;outline:2px solid}.range::-webkit-slider-runnable-track{background-color:var(--range-bg);border-radius:var(--radius-selector);width:100%;height:calc(var(--range-thumb-size)*.5)}@media (forced-colors:active){.range::-webkit-slider-runnable-track{border:1px solid}.range::-moz-range-track{border:1px solid}}.range::-webkit-slider-thumb{box-sizing:border-box;border-radius:calc(var(--radius-selector) + min(var(--range-p),var(--radius-selector-max)));height:var(--range-thumb-size);width:var(--range-thumb-size);border:var(--range-p)solid;-webkit-appearance:none;-moz-appearance:none;appearance:none;webkit-appearance:none;color:var(--range-progress);box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px currentColor,0 0 0 2rem var(--range-thumb) inset,calc((var(--range-dir,1)*-100rem) - (var(--range-dir,1)*var(--range-thumb-size)/2)) 0 0 calc(100rem*var(--range-fill));background-color:currentColor;position:relative;top:50%;transform:translateY(-50%)}@supports (color:color-mix(in lab,red,red)){.range::-webkit-slider-thumb{box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px color-mix(in oklab,currentColor calc(var(--depth)*10%),#0000),0 0 0 2rem var(--range-thumb) inset,calc((var(--range-dir,1)*-100rem) - (var(--range-dir,1)*var(--range-thumb-size)/2)) 0 0 calc(100rem*var(--range-fill))}}.range::-moz-range-track{background-color:var(--range-bg);border-radius:var(--radius-selector);width:100%;height:calc(var(--range-thumb-size)*.5)}.range::-moz-range-thumb{box-sizing:border-box;border-radius:calc(var(--radius-selector) + min(var(--range-p),var(--radius-selector-max)));height:var(--range-thumb-size);width:var(--range-thumb-size);border:var(--range-p)solid;color:var(--range-progress);box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px currentColor,0 0 0 2rem var(--range-thumb) inset,calc((var(--range-dir,1)*-100rem) - (var(--range-dir,1)*var(--range-thumb-size)/2)) 0 0 calc(100rem*var(--range-fill));background-color:currentColor;position:relative;top:50%}@supports (color:color-mix(in lab,red,red)){.range::-moz-range-thumb{box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px color-mix(in oklab,currentColor calc(var(--depth)*10%),#0000),0 0 0 2rem var(--range-thumb) inset,calc((var(--range-dir,1)*-100rem) - (var(--range-dir,1)*var(--range-thumb-size)/2)) 0 0 calc(100rem*var(--range-fill))}}.range:disabled{cursor:not-allowed;opacity:.3}.card{border-radius:var(--radius-box);outline-offset:2px;outline:0 solid #0000;flex-direction:column;transition:outline .2s ease-in-out;display:flex;position:relative}.card:focus{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.card:focus{outline-offset:2px;outline:2px solid #0000}}.card:focus-visible{outline-color:currentColor}.card :where(figure:first-child){border-start-start-radius:inherit;border-start-end-radius:inherit;border-end-end-radius:unset;border-end-start-radius:unset;overflow:hidden}.card :where(figure:last-child){border-start-start-radius:unset;border-start-end-radius:unset;border-end-end-radius:inherit;border-end-start-radius:inherit;overflow:hidden}.card:where(.card-border){border:var(--border)solid var(--color-base-200)}.card:where(.card-dash){border:var(--border)dashed var(--color-base-200)}.card.image-full{display:grid}.card.image-full>*{grid-row-start:1;grid-column-start:1}.card.image-full>.card-body{color:var(--color-neutral-content);position:relative}.card.image-full :where(figure){border-radius:inherit;overflow:hidden}.card.image-full>figure img{object-fit:cover;filter:brightness(28%);height:100%}.card figure{justify-content:center;align-items:center;display:flex}.card:has(>input:is(input[type=checkbox],input[type=radio])){cursor:pointer;-webkit-user-select:none;user-select:none}.card:has(>:checked){outline:2px solid}.swap{cursor:pointer;vertical-align:middle;webkit-user-select:none;-webkit-user-select:none;user-select:none;place-content:center;display:inline-grid;position:relative}.swap input{-webkit-appearance:none;-moz-appearance:none;appearance:none;border:none}.swap>*{grid-row-start:1;grid-column-start:1}@media (prefers-reduced-motion:no-preference){.swap>*{transition-property:transform,rotate,opacity;transition-duration:.2s;transition-timing-function:cubic-bezier(0,0,.2,1)}}.swap .swap-on,.swap .swap-indeterminate,.swap input:indeterminate~.swap-on,.swap input:is(:checked,:indeterminate)~.swap-off{opacity:0}.swap input:checked~.swap-on,.swap input:indeterminate~.swap-indeterminate{opacity:1;backface-visibility:visible}.checkbox{border:var(--border)solid var(--input-color,var(--color-base-content))}@supports (color:color-mix(in lab,red,red)){.checkbox{border:var(--border)solid var(--input-color,color-mix(in oklab,var(--color-base-content)20%,#0000))}}.checkbox{cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;border-radius:var(--radius-selector);vertical-align:middle;color:var(--color-base-content);box-shadow:0 1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 0 #0000 inset,0 0 #0000;--size:calc(var(--size-selector,.25rem)*6);width:var(--size);height:var(--size);background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise);flex-shrink:0;padding:.25rem;transition:background-color .2s,box-shadow .2s;display:inline-block;position:relative}.checkbox:before{--tw-content:\"\";content:var(--tw-content);opacity:0;clip-path:polygon(20% 100%,20% 80%,50% 80%,50% 80%,70% 80%,70% 100%);width:100%;height:100%;box-shadow:0 3px oklch(100% 0 0/calc(var(--depth)*.1)) inset;background-color:currentColor;font-size:1rem;line-height:.75;transition:clip-path .3s .1s,opacity .1s .1s,rotate .3s .1s,translate .3s .1s;display:block;rotate:45deg}.checkbox:focus-visible{outline:2px solid var(--input-color,currentColor);outline-offset:2px}.checkbox:checked,.checkbox[aria-checked=true]{background-color:var(--input-color,#0000);box-shadow:0 0 #0000 inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px oklch(0% 0 0/calc(var(--depth)*.1))}:is(.checkbox:checked,.checkbox[aria-checked=true]):before{clip-path:polygon(20% 100%,20% 80%,50% 80%,50% 0%,70% 0%,70% 100%);opacity:1}@media (forced-colors:active){:is(.checkbox:checked,.checkbox[aria-checked=true]):before{--tw-content:\"✔︎\";clip-path:none;background-color:#0000;rotate:none}}@media print{:is(.checkbox:checked,.checkbox[aria-checked=true]):before{--tw-content:\"✔︎\";clip-path:none;background-color:#0000;rotate:none}}.checkbox:indeterminate{background-color:var(--input-color,var(--color-base-content))}@supports (color:color-mix(in lab,red,red)){.checkbox:indeterminate{background-color:var(--input-color,color-mix(in oklab,var(--color-base-content)20%,#0000))}}.checkbox:indeterminate:before{opacity:1;clip-path:polygon(20% 100%,20% 80%,50% 80%,50% 80%,80% 80%,80% 100%);translate:0 -35%;rotate:none}.checkbox:disabled{cursor:not-allowed;opacity:.2}.radio{cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;vertical-align:middle;border:var(--border)solid var(--input-color,currentColor);border-radius:3.40282e38px;flex-shrink:0;padding:.25rem;display:inline-block;position:relative}@supports (color:color-mix(in lab,red,red)){.radio{border:var(--border)solid var(--input-color,color-mix(in srgb,currentColor 20%,#0000))}}.radio{box-shadow:0 1px oklch(0% 0 0/calc(var(--depth)*.1)) inset;--size:calc(var(--size-selector,.25rem)*6);width:var(--size);height:var(--size);color:var(--input-color,currentColor)}.radio:before{--tw-content:\"\";content:var(--tw-content);background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise);border-radius:3.40282e38px;width:100%;height:100%;display:block}.radio:focus-visible{outline:2px solid}.radio:checked,.radio[aria-checked=true]{background-color:var(--color-base-100);border-color:currentColor}@media (prefers-reduced-motion:no-preference){.radio:checked,.radio[aria-checked=true]{animation:.2s ease-out radio}}:is(.radio:checked,.radio[aria-checked=true]):before{box-shadow:0 -1px oklch(0% 0 0/calc(var(--depth)*.1)) inset,0 8px 0 -4px oklch(100% 0 0/calc(var(--depth)*.1)) inset,0 1px oklch(0% 0 0/calc(var(--depth)*.1));background-color:currentColor}@media (forced-colors:active){:is(.radio:checked,.radio[aria-checked=true]):before{outline-style:var(--tw-outline-style);outline-offset:-1px;outline-width:1px}}@media print{:is(.radio:checked,.radio[aria-checked=true]):before{outline-offset:-1rem;outline:.25rem solid}}.radio:disabled{cursor:not-allowed;opacity:.2}.rating{vertical-align:middle;display:inline-flex;position:relative}.rating input{-webkit-appearance:none;-moz-appearance:none;appearance:none;border:none}.rating :where(*){background-color:var(--color-base-content);opacity:.2;border-radius:0;width:1.5rem;height:1.5rem}@media (prefers-reduced-motion:no-preference){.rating :where(*){animation:.25s ease-out rating}}.rating :where(*):is(input){cursor:pointer}.rating .rating-hidden{background-color:#0000;width:.5rem}.rating input[type=radio]:checked{background-image:none}.rating :checked,.rating [aria-checked=true],.rating [aria-current=true],.rating :has(~:checked,~[aria-checked=true],~[aria-current=true]){opacity:1}.rating :focus-visible{scale:1.1}@media (prefers-reduced-motion:no-preference){.rating :focus-visible{transition:scale .2s ease-out}}.rating :active:focus{animation:none;scale:1.1}.rating.rating-xs :where(:not(.rating-hidden)){width:1rem;height:1rem}.rating.rating-sm :where(:not(.rating-hidden)){width:1.25rem;height:1.25rem}.rating.rating-md :where(:not(.rating-hidden)){width:1.5rem;height:1.5rem}.rating.rating-lg :where(:not(.rating-hidden)){width:1.75rem;height:1.75rem}.rating.rating-xl :where(:not(.rating-hidden)){width:2rem;height:2rem}.stats{border-radius:var(--radius-box);grid-auto-flow:column;display:inline-grid;position:relative;overflow-x:auto}.progress{-webkit-appearance:none;-moz-appearance:none;appearance:none;border-radius:var(--radius-box);background-color:currentColor;width:100%;height:.5rem;position:relative;overflow:hidden}@supports (color:color-mix(in lab,red,red)){.progress{background-color:color-mix(in oklab,currentColor 20%,transparent)}}.progress{color:var(--color-base-content)}.progress:indeterminate{background-image:repeating-linear-gradient(90deg,currentColor -1% 10%,#0000 10% 90%);background-position-x:15%;background-size:200%}@media (prefers-reduced-motion:no-preference){.progress:indeterminate{animation:5s ease-in-out infinite progress}}@supports ((-moz-appearance:none)){.progress:indeterminate::-moz-progress-bar{background-color:#0000}@media (prefers-reduced-motion:no-preference){.progress:indeterminate::-moz-progress-bar{background-image:repeating-linear-gradient(90deg,currentColor -1% 10%,#0000 10% 90%);background-position-x:15%;background-size:200%;animation:5s ease-in-out infinite progress}}.progress::-moz-progress-bar{border-radius:var(--radius-box);background-color:currentColor}}@supports ((-webkit-appearance:none)){.progress::-webkit-progress-bar{border-radius:var(--radius-box);background-color:#0000}.progress::-webkit-progress-value{border-radius:var(--radius-box);background-color:currentColor}}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.relative\\!{position:relative!important}.static{position:static}.sticky{position:sticky}.tooltip-bottom>.tooltip-content,.tooltip-bottom[data-tip]:before{transform:translate(-50%)translateY(var(--tt-pos,-.25rem));inset:var(--tt-off)auto auto 50%}.tooltip-bottom:after{transform:translate(-50%)translateY(var(--tt-pos,-.25rem))rotate(180deg);inset:var(--tt-tail)auto auto 50%}.tooltip-left>.tooltip-content,.tooltip-left[data-tip]:before{transform:translate(calc(var(--tt-pos,.25rem) - .25rem))translateY(-50%);inset:50% var(--tt-off)auto auto}.tooltip-left:after{transform:translate(var(--tt-pos,.25rem))translateY(-50%)rotate(-90deg);inset:50% calc(var(--tt-tail) + 1px)auto auto}.tooltip-top>.tooltip-content,.tooltip-top[data-tip]:before{transform:translate(-50%)translateY(var(--tt-pos,.25rem));inset:auto auto var(--tt-off)50%}.tooltip-top:after{transform:translate(-50%)translateY(var(--tt-pos,.25rem));inset:auto auto var(--tt-tail)50%}.inset-0{inset:calc(var(--spacing)*0)}.inset-x-0{inset-inline:calc(var(--spacing)*0)}.inset-y-0{inset-block:calc(var(--spacing)*0)}.top-0{top:calc(var(--spacing)*0)}.top-1{top:calc(var(--spacing)*1)}.top-1\\.5{top:calc(var(--spacing)*1.5)}.top-1\\/2{top:50%}.top-4{top:calc(var(--spacing)*4)}.top-4\\!{top:calc(var(--spacing)*4)!important}.top-\\[-30px\\]{top:-30px}.right-0{right:calc(var(--spacing)*0)}.right-1{right:calc(var(--spacing)*1)}.right-1\\.5{right:calc(var(--spacing)*1.5)}.bottom-0{bottom:calc(var(--spacing)*0)}.bottom-1{bottom:calc(var(--spacing)*1)}.bottom-1\\.5{bottom:calc(var(--spacing)*1.5)}.bottom-\\[-50px\\]{bottom:-50px}.left-0{left:calc(var(--spacing)*0)}.left-1{left:calc(var(--spacing)*1)}.left-1\\.5{left:calc(var(--spacing)*1.5)}.left-1\\/2{left:50%}.left-4{left:calc(var(--spacing)*4)}.left-4\\!{left:calc(var(--spacing)*4)!important}.textarea{border:var(--border)solid #0000;-webkit-appearance:none;-moz-appearance:none;appearance:none;border-radius:var(--radius-field);background-color:var(--color-base-100);vertical-align:middle;touch-action:manipulation;border-color:var(--input-color);width:clamp(3rem,20rem,100%);min-height:5rem;box-shadow:0 1px var(--input-color) inset,0 -1px oklch(100% 0 0/calc(var(--depth)*.1)) inset;flex-shrink:1;padding-block:.5rem;padding-inline:.75rem;font-size:.875rem}@supports (color:color-mix(in lab,red,red)){.textarea{box-shadow:0 1px color-mix(in oklab,var(--input-color)calc(var(--depth)*10%),#0000) inset,0 -1px oklch(100% 0 0/calc(var(--depth)*.1)) inset}}.textarea{--input-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.textarea{--input-color:color-mix(in oklab,var(--color-base-content)20%,#0000)}}.textarea textarea{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:#0000;border:none}.textarea textarea:focus,.textarea textarea:focus-within{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.textarea textarea:focus,.textarea textarea:focus-within{outline-offset:2px;outline:2px solid #0000}}.textarea:focus,.textarea:focus-within{--input-color:var(--color-base-content);box-shadow:0 1px var(--input-color)}@supports (color:color-mix(in lab,red,red)){.textarea:focus,.textarea:focus-within{box-shadow:0 1px color-mix(in oklab,var(--input-color)calc(var(--depth)*10%),#0000)}}.textarea:focus,.textarea:focus-within{outline:2px solid var(--input-color);outline-offset:2px;isolation:isolate}.textarea:has(>textarea[disabled]),.textarea:is(:disabled,[disabled]){cursor:not-allowed;border-color:var(--color-base-200);background-color:var(--color-base-200);color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.textarea:has(>textarea[disabled]),.textarea:is(:disabled,[disabled]){color:color-mix(in oklab,var(--color-base-content)40%,transparent)}}:is(.textarea:has(>textarea[disabled]),.textarea:is(:disabled,[disabled]))::placeholder{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:is(.textarea:has(>textarea[disabled]),.textarea:is(:disabled,[disabled]))::placeholder{color:color-mix(in oklab,var(--color-base-content)20%,transparent)}}.textarea:has(>textarea[disabled]),.textarea:is(:disabled,[disabled]){box-shadow:none}.textarea:has(>textarea[disabled])>textarea[disabled]{cursor:not-allowed}.btn-active{--btn-bg:var(--btn-color,var(--color-base-200))}@supports (color:color-mix(in lab,red,red)){.btn-active{--btn-bg:color-mix(in oklab,var(--btn-color,var(--color-base-200)),#000 7%)}}.btn-active{--btn-shadow:0 0 0 0 oklch(0% 0 0/0),0 0 0 0 oklch(0% 0 0/0);isolation:isolate}.stack{grid-template-rows:3px 4px 1fr 4px 3px;grid-template-columns:3px 4px 1fr 4px 3px;display:inline-grid}.stack>*{width:100%;height:100%}.stack>:nth-child(n+2){opacity:.7;width:100%}.stack>:nth-child(2){z-index:2;opacity:.9}.stack>:first-child{z-index:3;width:100%}:is(.stack,.stack.stack-bottom)>*{grid-area:3/3/6/4}:is(.stack,.stack.stack-bottom)>:nth-child(2){grid-area:2/2/5/5}:is(.stack,.stack.stack-bottom)>:first-child{grid-area:1/1/4/6}.stack.stack-top>*{grid-area:1/3/4/4}.stack.stack-top>:nth-child(2){grid-area:2/2/5/5}.stack.stack-top>:first-child{grid-area:3/1/6/6}.stack.stack-start>*{grid-area:3/1/4/4}.stack.stack-start>:nth-child(2){grid-area:2/2/5/5}.stack.stack-start>:first-child{grid-area:1/3/6/6}.stack.stack-end>*{grid-area:3/3/4/6}.stack.stack-end>:nth-child(2){grid-area:2/2/5/5}.stack.stack-end>:first-child{grid-area:1/1/6/4}.z-1{z-index:1}.z-2{z-index:2}.z-50{z-index:50}.container{width:100%}@media (min-width:40rem){.container{max-width:40rem}}@media (min-width:48rem){.container{max-width:48rem}}@media (min-width:64rem){.container{max-width:64rem}}@media (min-width:80rem){.container{max-width:80rem}}@media (min-width:96rem){.container{max-width:96rem}}.divider{white-space:nowrap;height:1rem;margin:var(--divider-m,1rem 0);--divider-color:var(--color-base-content);flex-direction:row;align-self:stretch;align-items:center;display:flex}@supports (color:color-mix(in lab,red,red)){.divider{--divider-color:color-mix(in oklab,var(--color-base-content)10%,transparent)}}.divider:before,.divider:after{content:\"\";background-color:var(--divider-color);flex-grow:1;width:100%;height:.125rem}@media print{.divider:before,.divider:after{border:.5px solid}}.divider:not(:empty){gap:1rem}.m-0{margin:calc(var(--spacing)*0)}.m-auto{margin:auto}.filter{flex-wrap:wrap;display:flex}.filter input[type=radio]{width:auto}.filter input{opacity:1;transition:margin .1s,opacity .3s,padding .3s,border-width .1s;overflow:hidden;scale:1}.filter input:not(:last-child){margin-inline-end:.25rem}.filter input.filter-reset{aspect-ratio:1}.filter input.filter-reset:after{content:\"×\"}.filter:not(:has(input:checked:not(.filter-reset))) .filter-reset,.filter:not(:has(input:checked:not(.filter-reset))) input[type=reset],.filter:has(input:checked:not(.filter-reset)) input:not(:checked,.filter-reset,input[type=reset]){opacity:0;border-width:0;width:0;margin-inline:0;padding-inline:0;scale:0}.mx-2{margin-inline:calc(var(--spacing)*2)}.mx-auto{margin-inline:auto}.label{white-space:nowrap;color:currentColor;align-items:center;gap:.375rem;display:inline-flex}@supports (color:color-mix(in lab,red,red)){.label{color:color-mix(in oklab,currentColor 60%,transparent)}}.label:has(input){cursor:pointer}.label:is(.input>*,.select>*){white-space:nowrap;height:calc(100% - .5rem);font-size:inherit;align-items:center;padding-inline:.75rem;display:flex}.label:is(.input>*,.select>*):first-child{border-inline-end:var(--border)solid currentColor;margin-inline:-.75rem .75rem}@supports (color:color-mix(in lab,red,red)){.label:is(.input>*,.select>*):first-child{border-inline-end:var(--border)solid color-mix(in oklab,currentColor 10%,#0000)}}.label:is(.input>*,.select>*):last-child{border-inline-start:var(--border)solid currentColor;margin-inline:.75rem -.75rem}@supports (color:color-mix(in lab,red,red)){.label:is(.input>*,.select>*):last-child{border-inline-start:var(--border)solid color-mix(in oklab,currentColor 10%,#0000)}}.join-item:where(:not(:first-child,:disabled,[disabled],.btn-disabled)){margin-block-start:0;margin-inline-start:calc(var(--border,1px)*-1)}.join-item:where(:is(:disabled,[disabled],.btn-disabled)){border-width:var(--border,1px)0 var(--border,1px)var(--border,1px)}.mt-1{margin-top:calc(var(--spacing)*1)}.mt-2{margin-top:calc(var(--spacing)*2)}.mt-3{margin-top:calc(var(--spacing)*3)}.mt-4{margin-top:calc(var(--spacing)*4)}.mt-5{margin-top:calc(var(--spacing)*5)}.mt-6{margin-top:calc(var(--spacing)*6)}.breadcrumbs{max-width:100%;padding-block:.5rem;overflow-x:auto}.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol{white-space:nowrap;align-items:center;min-height:min-content;display:flex}:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li{align-items:center;display:flex}:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li>*{cursor:pointer;align-items:center;gap:.5rem;display:flex}@media (hover:hover){:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li>:hover{text-decoration-line:underline}}:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li>:focus{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li>:focus{outline-offset:2px;outline:2px solid #0000}}:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li>:focus-visible{outline-offset:2px;outline:2px solid}:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li+:before{content:\"\";opacity:.4;background-color:#0000;border-top:1px solid;border-right:1px solid;width:.375rem;height:.375rem;margin-left:.5rem;margin-right:.75rem;display:block;rotate:45deg}[dir=rtl] :is(:is(.breadcrumbs>menu,.breadcrumbs>ul,.breadcrumbs>ol)>li)+:before{rotate:-135deg}.mr-2{margin-right:calc(var(--spacing)*2)}.fieldset-legend{color:var(--color-base-content);justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:-.25rem;padding-block:.5rem;font-weight:600;display:flex}.mb-1{margin-bottom:calc(var(--spacing)*1)}.mb-2{margin-bottom:calc(var(--spacing)*2)}.mb-3{margin-bottom:calc(var(--spacing)*3)}.mb-4{margin-bottom:calc(var(--spacing)*4)}.mb-5{margin-bottom:calc(var(--spacing)*5)}.mb-6{margin-bottom:calc(var(--spacing)*6)}.box-border{box-sizing:border-box}.status{aspect-ratio:1;border-radius:var(--radius-selector);background-color:var(--color-base-content);width:.5rem;height:.5rem;display:inline-block}@supports (color:color-mix(in lab,red,red)){.status{background-color:color-mix(in oklab,var(--color-base-content)20%,transparent)}}.status{vertical-align:middle;color:#0000004d;background-position:50%;background-repeat:no-repeat}@supports (color:color-mix(in lab,red,red)){.status{color:#0000004d}@supports (color:color-mix(in lab,red,red)){.status{color:color-mix(in oklab,var(--color-black)30%,transparent)}}}.status{background-image:radial-gradient(circle at 35% 30%,oklch(1 0 0/calc(var(--depth)*.5)),#0000);box-shadow:0 2px 3px -1px}@supports (color:color-mix(in lab,red,red)){.status{box-shadow:0 2px 3px -1px color-mix(in oklab,currentColor calc(var(--depth)*100%),#0000)}}.status\\!{aspect-ratio:1!important;border-radius:var(--radius-selector)!important;background-color:var(--color-base-content)!important;width:.5rem!important;height:.5rem!important;display:inline-block!important}@supports (color:color-mix(in lab,red,red)){.status\\!{background-color:color-mix(in oklab,var(--color-base-content)20%,transparent)!important}}.status\\!{vertical-align:middle!important;color:#0000004d!important;background-position:50%!important;background-repeat:no-repeat!important}@supports (color:color-mix(in lab,red,red)){.status\\!{color:#0000004d!important}@supports (color:color-mix(in lab,red,red)){.status\\!{color:color-mix(in oklab,var(--color-black)30%,transparent)!important}}}.status\\!{background-image:radial-gradient(circle at 35% 30%,oklch(1 0 0/calc(var(--depth)*.5)),#0000)!important;box-shadow:0 2px 3px -1px!important}@supports (color:color-mix(in lab,red,red)){.status\\!{box-shadow:0 2px 3px -1px color-mix(in oklab,currentColor calc(var(--depth)*100%),#0000)!important}}.badge{border-radius:var(--radius-selector);vertical-align:middle;color:var(--badge-fg);border:var(--border)solid var(--badge-color,var(--color-base-200));width:fit-content;padding-inline:calc(.25rem*3 - var(--border));background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise);background-color:var(--badge-bg);--badge-bg:var(--badge-color,var(--color-base-100));--badge-fg:var(--color-base-content);--size:calc(var(--size-selector,.25rem)*6);height:var(--size);justify-content:center;align-items:center;gap:.5rem;font-size:.875rem;display:inline-flex}.footer{grid-auto-flow:row;place-items:start;gap:2.5rem 1rem;width:100%;font-size:.875rem;line-height:1.25rem;display:grid}.footer>*{place-items:start;gap:.5rem;display:grid}.footer.footer-center{text-align:center;grid-auto-flow:column dense;place-items:center}.footer.footer-center>*{place-items:center}.card-body{padding:var(--card-p,1.5rem);font-size:var(--card-fs,.875rem);flex-direction:column;flex:auto;gap:.5rem;display:flex}.card-body :where(p){flex-grow:1}.alert{border-radius:var(--radius-box);color:var(--color-base-content);background-color:var(--alert-color,var(--color-base-200));text-align:start;border:var(--border)solid var(--color-base-200);background-size:auto,calc(var(--noise)*100%);background-image:none,var(--fx-noise);box-shadow:0 3px 0 -2px oklch(100% 0 0/calc(var(--depth)*.08)) inset,0 1px #000,0 4px 3px -2px oklch(0% 0 0/calc(var(--depth)*.08));grid-template-columns:auto;grid-auto-flow:column;justify-content:start;place-items:center start;gap:1rem;padding-block:.75rem;padding-inline:1rem;font-size:.875rem;line-height:1.25rem;display:grid}@supports (color:color-mix(in lab,red,red)){.alert{box-shadow:0 3px 0 -2px oklch(100% 0 0/calc(var(--depth)*.08)) inset,0 1px color-mix(in oklab,color-mix(in oklab,#000 20%,var(--alert-color,var(--color-base-200)))calc(var(--depth)*20%),#0000),0 4px 3px -2px oklch(0% 0 0/calc(var(--depth)*.08))}}.alert:has(:nth-child(2)){grid-template-columns:auto minmax(auto,1fr)}.alert.alert-outline{color:var(--alert-color);box-shadow:none;background-color:#0000;background-image:none}.alert.alert-dash{color:var(--alert-color);box-shadow:none;background-color:#0000;background-image:none;border-style:dashed}.alert.alert-soft{color:var(--alert-color,var(--color-base-content));background:var(--alert-color,var(--color-base-content))}@supports (color:color-mix(in lab,red,red)){.alert.alert-soft{background:color-mix(in oklab,var(--alert-color,var(--color-base-content))8%,var(--color-base-100))}}.alert.alert-soft{border-color:var(--alert-color,var(--color-base-content))}@supports (color:color-mix(in lab,red,red)){.alert.alert-soft{border-color:color-mix(in oklab,var(--alert-color,var(--color-base-content))10%,var(--color-base-100))}}.alert.alert-soft{box-shadow:none;background-image:none}.fieldset{grid-template-columns:1fr;grid-auto-rows:max-content;gap:.375rem;padding-block:.25rem;font-size:.75rem;display:grid}.card-title{font-size:var(--cardtitle-fs,1.125rem);align-items:center;gap:.5rem;font-weight:600;display:flex}.line-clamp-2{-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.line-clamp-3{-webkit-line-clamp:3;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}:root .prose{--tw-prose-body:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-body:color-mix(in oklab,var(--color-base-content)80%,#0000)}}:root .prose{--tw-prose-headings:var(--color-base-content);--tw-prose-lead:var(--color-base-content);--tw-prose-links:var(--color-base-content);--tw-prose-bold:var(--color-base-content);--tw-prose-counters:var(--color-base-content);--tw-prose-bullets:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-bullets:color-mix(in oklab,var(--color-base-content)50%,#0000)}}:root .prose{--tw-prose-hr:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-hr:color-mix(in oklab,var(--color-base-content)20%,#0000)}}:root .prose{--tw-prose-quotes:var(--color-base-content);--tw-prose-quote-borders:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-quote-borders:color-mix(in oklab,var(--color-base-content)20%,#0000)}}:root .prose{--tw-prose-captions:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-captions:color-mix(in oklab,var(--color-base-content)50%,#0000)}}:root .prose{--tw-prose-code:var(--color-base-content);--tw-prose-pre-code:var(--color-neutral-content);--tw-prose-pre-bg:var(--color-neutral);--tw-prose-th-borders:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-th-borders:color-mix(in oklab,var(--color-base-content)50%,#0000)}}:root .prose{--tw-prose-td-borders:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-td-borders:color-mix(in oklab,var(--color-base-content)20%,#0000)}}:root .prose{--tw-prose-kbd:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){:root .prose{--tw-prose-kbd:color-mix(in oklab,var(--color-base-content)80%,#0000)}}:root .prose :where(code):not(pre>code){background-color:var(--color-base-200);border-radius:var(--radius-selector);border:var(--border)solid var(--color-base-300);font-weight:inherit;padding-inline:.5em}:root .prose :where(code):not(pre>code):before,:root .prose :where(code):not(pre>code):after{display:none}.mask{vertical-align:middle;display:inline-block;-webkit-mask-position:50%;mask-position:50%;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.table{display:table}.aspect-video{aspect-ratio:var(--aspect-video)}.btn-circle{width:var(--size);height:var(--size);border-radius:3.40282e38px;padding-inline:0}.size-3{width:calc(var(--spacing)*3);height:calc(var(--spacing)*3)}.size-3\\.5{width:calc(var(--spacing)*3.5);height:calc(var(--spacing)*3.5)}.size-4{width:calc(var(--spacing)*4);height:calc(var(--spacing)*4)}.size-6{width:calc(var(--spacing)*6);height:calc(var(--spacing)*6)}.size-7{width:calc(var(--spacing)*7);height:calc(var(--spacing)*7)}.size-8{width:calc(var(--spacing)*8);height:calc(var(--spacing)*8)}.size-12{width:calc(var(--spacing)*12);height:calc(var(--spacing)*12)}.size-20{width:calc(var(--spacing)*20);height:calc(var(--spacing)*20)}.size-\\[61\\.8\\%\\]{width:61.8%;height:61.8%}.h-\\(--app-playlist-header-height\\){height:var(--app-playlist-header-height)}.h-1{height:calc(var(--spacing)*1)}.h-2{height:calc(var(--spacing)*2)}.h-2\\.5{height:calc(var(--spacing)*2.5)}.h-5{height:calc(var(--spacing)*5)}.h-7{height:calc(var(--spacing)*7)}.h-8{height:calc(var(--spacing)*8)}.h-12{height:calc(var(--spacing)*12)}.h-16{height:calc(var(--spacing)*16)}.h-20{height:calc(var(--spacing)*20)}.h-24{height:calc(var(--spacing)*24)}.h-28{height:calc(var(--spacing)*28)}.h-32{height:calc(var(--spacing)*32)}.h-auto{height:auto}.h-full{height:100%}.h-screen{height:100vh}.min-h-screen{min-height:100vh}.w-\\(--app-playlist-width\\)\\!{width:var(--app-playlist-width)!important}.w-0{width:calc(var(--spacing)*0)}.w-1{width:calc(var(--spacing)*1)}.w-1\\/3{width:33.3333%}.w-2{width:calc(var(--spacing)*2)}.w-2\\.5{width:calc(var(--spacing)*2.5)}.w-8{width:calc(var(--spacing)*8)}.w-12{width:calc(var(--spacing)*12)}.w-16{width:calc(var(--spacing)*16)}.w-20{width:calc(var(--spacing)*20)}.w-24{width:calc(var(--spacing)*24)}.w-32{width:calc(var(--spacing)*32)}.w-35{width:calc(var(--spacing)*35)}.w-50{width:calc(var(--spacing)*50)}.w-80{width:calc(var(--spacing)*80)}.w-\\[calc\\(100\\%-var\\(--app-playlist-width\\)\\)\\]\\!{width:calc(100% - var(--app-playlist-width))!important}.w-full{width:100%}.w-lg{width:var(--container-lg)}.max-w-214{max-width:calc(var(--spacing)*214)}.max-w-full{max-width:100%}.max-w-xl{max-width:var(--container-xl)}.min-w-32{min-width:calc(var(--spacing)*32)}.flex-1{flex:1}.flex-shrink{flex-shrink:1}.flex-shrink-0{flex-shrink:0}.table-fixed{table-layout:fixed}.-translate-x-1{--tw-translate-x:calc(var(--spacing)*-1);translate:var(--tw-translate-x)var(--tw-translate-y)}.-translate-x-1\\/2{--tw-translate-x: -50% ;translate:var(--tw-translate-x)var(--tw-translate-y)}.-translate-y-1{--tw-translate-y:calc(var(--spacing)*-1);translate:var(--tw-translate-x)var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y: -50% ;translate:var(--tw-translate-x)var(--tw-translate-y)}.\\!scale-80{--tw-scale-x:80%!important;--tw-scale-y:80%!important;--tw-scale-z:80%!important;scale:var(--tw-scale-x)var(--tw-scale-y)!important}.\\!scale-100{--tw-scale-x:100%!important;--tw-scale-y:100%!important;--tw-scale-z:100%!important;scale:var(--tw-scale-x)var(--tw-scale-y)!important}.scale-0{--tw-scale-x:0%;--tw-scale-y:0%;--tw-scale-z:0%;scale:var(--tw-scale-x)var(--tw-scale-y)}.scale-100{--tw-scale-x:100%;--tw-scale-y:100%;--tw-scale-z:100%;scale:var(--tw-scale-x)var(--tw-scale-y)}.swap-rotate .swap-on,.swap-rotate input:indeterminate~.swap-on{rotate:45deg}.swap-rotate input:is(:checked,:indeterminate)~.swap-on,.swap-rotate.swap-active .swap-on{rotate:none}.swap-rotate input:is(:checked,:indeterminate)~.swap-off,.swap-rotate.swap-active .swap-off{rotate:-45deg}.rotate-90{rotate:90deg}.transform{transform:var(--tw-rotate-x,)var(--tw-rotate-y,)var(--tw-rotate-z,)var(--tw-skew-x,)var(--tw-skew-y,)}.transform-gpu{transform:translateZ(0)var(--tw-rotate-x,)var(--tw-rotate-y,)var(--tw-rotate-z,)var(--tw-skew-x,)var(--tw-skew-y,)}.skeleton{border-radius:var(--radius-box);background-color:var(--color-base-300)}@media (prefers-reduced-motion:reduce){.skeleton{transition-duration:15s}}.skeleton{will-change:background-position;background-image:linear-gradient(105deg,#0000 0% 40%,var(--color-base-100)50%,#0000 60% 100%);background-position-x:-50%;background-repeat:no-repeat;background-size:200%}@media (prefers-reduced-motion:no-preference){.skeleton{animation:1.8s ease-in-out infinite skeleton}}.animate-\\[fadeOut_350ms_linear_forwards\\]{animation:.35s linear forwards fadeOut}.link{cursor:pointer;text-decoration-line:underline}.link:focus{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.link:focus{outline-offset:2px;outline:2px solid #0000}}.link:focus-visible{outline-offset:2px;outline:2px solid}.cursor-pointer{cursor:pointer}.cursor-zoom-in{cursor:zoom-in}.resize{resize:both}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-baseline{align-items:baseline}.items-center{align-items:center}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.gap-1{gap:calc(var(--spacing)*1)}.gap-1\\.5{gap:calc(var(--spacing)*1.5)}.gap-2{gap:calc(var(--spacing)*2)}.gap-2\\.5{gap:calc(var(--spacing)*2.5)}.gap-3{gap:calc(var(--spacing)*3)}.gap-4{gap:calc(var(--spacing)*4)}.gap-5{gap:calc(var(--spacing)*5)}.gap-8{gap:calc(var(--spacing)*8)}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-full{border-radius:3.40282e38px}.rounded-lg{border-radius:var(--radius-lg)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-t-xl{border-top-left-radius:var(--radius-xl);border-top-right-radius:var(--radius-xl)}.border{border-style:var(--tw-border-style);border-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-l-2{border-left-style:var(--tw-border-style);border-left-width:2px}.border-base-300,.border-base-300\\/15{border-color:var(--color-base-300)}@supports (color:color-mix(in lab,red,red)){.border-base-300\\/15{border-color:color-mix(in oklab,var(--color-base-300)15%,transparent)}}.border-base-content{border-color:var(--color-base-content)}.border-error{border-color:var(--color-error)}.border-neutral-950{border-color:var(--color-neutral-950)}.\\!bg-white\\/50{background-color:#ffffff80!important}@supports (color:color-mix(in lab,red,red)){.\\!bg-white\\/50{background-color:color-mix(in oklab,var(--color-white)50%,transparent)!important}}.bg-base-100,.bg-base-100\\/60{background-color:var(--color-base-100)}@supports (color:color-mix(in lab,red,red)){.bg-base-100\\/60{background-color:color-mix(in oklab,var(--color-base-100)60%,transparent)}}.bg-base-100\\/90{background-color:var(--color-base-100)}@supports (color:color-mix(in lab,red,red)){.bg-base-100\\/90{background-color:color-mix(in oklab,var(--color-base-100)90%,transparent)}}.bg-base-200{background-color:var(--color-base-200)}.bg-base-300{background-color:var(--color-base-300)}.bg-base-content{background-color:var(--color-base-content)}.bg-base-content\\!{background-color:var(--color-base-content)!important}.bg-base-content\\/30{background-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.bg-base-content\\/30{background-color:color-mix(in oklab,var(--color-base-content)30%,transparent)}}.bg-black{background-color:var(--color-black)}.bg-black\\/30{background-color:#0000004d}@supports (color:color-mix(in lab,red,red)){.bg-black\\/30{background-color:color-mix(in oklab,var(--color-black)30%,transparent)}}.bg-black\\/90{background-color:#000000e6}@supports (color:color-mix(in lab,red,red)){.bg-black\\/90{background-color:color-mix(in oklab,var(--color-black)90%,transparent)}}.bg-error{background-color:var(--color-error)}.bg-neutral-800{background-color:var(--color-neutral-800)}.bg-primary,.bg-primary\\/10{background-color:var(--color-primary)}@supports (color:color-mix(in lab,red,red)){.bg-primary\\/10{background-color:color-mix(in oklab,var(--color-primary)10%,transparent)}}.bg-white{background-color:var(--color-white)}.bg-linear-to-b{--tw-gradient-position:to bottom}@supports (background-image:linear-gradient(in lab,red,red)){.bg-linear-to-b{--tw-gradient-position:to bottom in oklab}}.bg-linear-to-b{background-image:linear-gradient(var(--tw-gradient-stops))}.bg-linear-to-t{--tw-gradient-position:to top}@supports (background-image:linear-gradient(in lab,red,red)){.bg-linear-to-t{--tw-gradient-position:to top in oklab}}.bg-linear-to-t{background-image:linear-gradient(var(--tw-gradient-stops))}.from-black{--tw-gradient-from:var(--color-black);--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from)var(--tw-gradient-from-position),var(--tw-gradient-to)var(--tw-gradient-to-position))}.from-black\\/30{--tw-gradient-from:#0000004d}@supports (color:color-mix(in lab,red,red)){.from-black\\/30{--tw-gradient-from:color-mix(in oklab,var(--color-black)30%,transparent)}}.from-black\\/30{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from)var(--tw-gradient-from-position),var(--tw-gradient-to)var(--tw-gradient-to-position))}.from-black\\/50{--tw-gradient-from:#00000080}@supports (color:color-mix(in lab,red,red)){.from-black\\/50{--tw-gradient-from:color-mix(in oklab,var(--color-black)50%,transparent)}}.from-black\\/50{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from)var(--tw-gradient-from-position),var(--tw-gradient-to)var(--tw-gradient-to-position))}.from-10\\%{--tw-gradient-from-position:10%}.to-transparent{--tw-gradient-to:transparent;--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position),var(--tw-gradient-from)var(--tw-gradient-from-position),var(--tw-gradient-to)var(--tw-gradient-to-position))}.loading-spinner{-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg width='24' height='24' stroke='black' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform-origin='center'%3E%3Ccircle cx='12' cy='12' r='9.5' fill='none' stroke-width='3' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='2s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dasharray' values='0,150;42,150;42,150' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dashoffset' values='0;-16;-59' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3Csvg width='24' height='24' stroke='black' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform-origin='center'%3E%3Ccircle cx='12' cy='12' r='9.5' fill='none' stroke-width='3' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='2s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dasharray' values='0,150;42,150;42,150' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dashoffset' values='0;-16;-59' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\")}.object-contain{object-fit:contain}.object-cover{object-fit:cover}.object-center{object-position:center}.p-0{padding:calc(var(--spacing)*0)}.p-0\\.5{padding:calc(var(--spacing)*.5)}.p-1{padding:calc(var(--spacing)*1)}.p-2{padding:calc(var(--spacing)*2)}.p-2\\.5{padding:calc(var(--spacing)*2.5)}.p-3{padding:calc(var(--spacing)*3)}.p-4{padding:calc(var(--spacing)*4)}.p-6{padding:calc(var(--spacing)*6)}.p-7{padding:calc(var(--spacing)*7)}.p-8{padding:calc(var(--spacing)*8)}.p-10{padding:calc(var(--spacing)*10)}.badge-sm{--size:calc(var(--size-selector,.25rem)*5);padding-inline:calc(.25rem*2.5 - var(--border));font-size:.75rem}.px-\\(--app-playlist-space\\){padding-inline:var(--app-playlist-space)}.px-1{padding-inline:calc(var(--spacing)*1)}.px-1\\.5{padding-inline:calc(var(--spacing)*1.5)}.px-2{padding-inline:calc(var(--spacing)*2)}.px-4{padding-inline:calc(var(--spacing)*4)}.px-5{padding-inline:calc(var(--spacing)*5)}.px-6{padding-inline:calc(var(--spacing)*6)}.px-7{padding-inline:calc(var(--spacing)*7)}.px-20{padding-inline:calc(var(--spacing)*20)}.py-0{padding-block:calc(var(--spacing)*0)}.py-0\\.5{padding-block:calc(var(--spacing)*.5)}.py-1{padding-block:calc(var(--spacing)*1)}.py-2{padding-block:calc(var(--spacing)*2)}.py-3{padding-block:calc(var(--spacing)*3)}.py-4{padding-block:calc(var(--spacing)*4)}.py-8{padding-block:calc(var(--spacing)*8)}.pt-2{padding-top:calc(var(--spacing)*2)}.pt-\\[calc\\(var\\(--app-playlist-header-height\\)\\+var\\(--spacing\\)\\*5\\)\\]{padding-top:calc(var(--app-playlist-header-height) + var(--spacing)*5)}.pr-3{padding-right:calc(var(--spacing)*3)}.pb-2{padding-bottom:calc(var(--spacing)*2)}.pb-5{padding-bottom:calc(var(--spacing)*5)}.pl-3{padding-left:calc(var(--spacing)*3)}.text-center{text-align:center}.text-right{text-align:right}.align-middle{vertical-align:middle}.align-top{vertical-align:top}.font-mono{font-family:var(--font-mono)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}.text-4xl{font-size:var(--text-4xl);line-height:var(--tw-leading,var(--text-4xl--line-height))}.text-5xl{font-size:var(--text-5xl);line-height:var(--tw-leading,var(--text-5xl--line-height))}.text-6xl{font-size:var(--text-6xl);line-height:var(--tw-leading,var(--text-6xl--line-height))}.text-8xl{font-size:var(--text-8xl);line-height:var(--tw-leading,var(--text-8xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.leading-6{--tw-leading:calc(var(--spacing)*6);line-height:calc(var(--spacing)*6)}.leading-relaxed{--tw-leading:var(--leading-relaxed);line-height:var(--leading-relaxed)}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-normal{--tw-font-weight:var(--font-weight-normal);font-weight:var(--font-weight-normal)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.break-words{overflow-wrap:break-word}.break-all{word-break:break-all}.whitespace-nowrap{white-space:nowrap}.whitespace-pre-wrap{white-space:pre-wrap}.range-primary{color:var(--color-primary);--range-thumb:var(--color-primary-content)}.progress-primary{color:var(--color-primary)}.text-base-content,.text-base-content\\/30{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.text-base-content\\/30{color:color-mix(in oklab,var(--color-base-content)30%,transparent)}}.text-base-content\\/50{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.text-base-content\\/50{color:color-mix(in oklab,var(--color-base-content)50%,transparent)}}.text-base-content\\/60{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.text-base-content\\/60{color:color-mix(in oklab,var(--color-base-content)60%,transparent)}}.text-base-content\\/70{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.text-base-content\\/70{color:color-mix(in oklab,var(--color-base-content)70%,transparent)}}.text-base-content\\/80{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.text-base-content\\/80{color:color-mix(in oklab,var(--color-base-content)80%,transparent)}}.text-error-content{color:var(--color-error-content)}.text-gray-100{color:var(--color-gray-100)}.text-neutral-300{color:var(--color-neutral-300)}.text-primary{color:var(--color-primary)}.text-red-400{color:var(--color-red-400)}.text-white{color:var(--color-white)}.text-yellow-400{color:var(--color-yellow-400)}.btn-link{--btn-border:#0000;--btn-bg:#0000;--btn-fg:var(--color-primary);--btn-noise:none;--btn-shadow:\"\";outline-color:currentColor;text-decoration-line:underline}.btn-link:is(.btn-active,:hover,:active:focus,:focus-visible){--btn-border:#0000;--btn-bg:#0000;text-decoration-line:underline}@media (hover:none){.btn-link:hover:not(.btn-active,:active,:focus-visible,:disabled,[disabled],.btn-disabled){text-decoration-line:none}}.no-underline{text-decoration-line:none}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.swap-active .swap-off{opacity:0}.swap-active .swap-on{opacity:1}.opacity-0{opacity:0}.opacity-60{opacity:.6}.opacity-80{opacity:.8}.opacity-100{opacity:1}.shadow-xl\\/60{--tw-shadow-alpha:60%;--tw-shadow:0 20px 25px -5px var(--tw-shadow-color,oklab(0% 0 0/.6)),0 8px 10px -6px var(--tw-shadow-color,oklab(0% 0 0/.6));box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-xs\\/30{--tw-shadow-alpha:30%;--tw-shadow:0 1px 2px 0 var(--tw-shadow-color,oklab(0% 0 0/.3));box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-xs\\/90{--tw-shadow-alpha:90%;--tw-shadow:0 1px 2px 0 var(--tw-shadow-color,oklab(0% 0 0/.9));box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow,.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a),0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-xl{--tw-shadow:0 20px 25px -5px var(--tw-shadow-color,#0000001a),0 8px 10px -6px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-xs{--tw-shadow:0 1px 2px 0 var(--tw-shadow-color,#0000000d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.ring-4{--tw-ring-shadow:var(--tw-ring-inset,)0 0 0 calc(4px + var(--tw-ring-offset-width))var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.ring-base-content,.ring-base-content\\/90{--tw-ring-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.ring-base-content\\/90{--tw-ring-color:color-mix(in oklab,var(--color-base-content)90%,transparent)}}.ring-primary{--tw-ring-color:var(--color-primary)}.btn-ghost:not(.btn-active,:hover,:active:focus,:focus-visible){--btn-shadow:\"\";--btn-bg:#0000;--btn-border:#0000;--btn-noise:none}.btn-ghost:not(.btn-active,:hover,:active:focus,:focus-visible):not(:disabled,[disabled],.btn-disabled){--btn-fg:currentColor;outline-color:currentColor}@media (hover:none){.btn-ghost:hover:not(.btn-active,:active,:focus-visible,:disabled,[disabled],.btn-disabled){--btn-shadow:\"\";--btn-bg:#0000;--btn-border:#0000;--btn-noise:none;--btn-fg:currentColor}}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.drop-shadow-xl\\/30{--tw-drop-shadow-alpha:30%;--tw-drop-shadow-size:drop-shadow(0 9px 7px var(--tw-drop-shadow-color,oklab(0% 0 0/.3)));--tw-drop-shadow:var(--tw-drop-shadow-size);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.drop-shadow-xs\\/60{--tw-drop-shadow-alpha:60%;--tw-drop-shadow-size:drop-shadow(0 1px 1px var(--tw-drop-shadow-color,oklab(0% 0 0/.6)));--tw-drop-shadow:var(--tw-drop-shadow-size);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.drop-shadow-xs\\/90{--tw-drop-shadow-alpha:90%;--tw-drop-shadow-size:drop-shadow(0 1px 1px var(--tw-drop-shadow-color,oklab(0% 0 0/.9)));--tw-drop-shadow:var(--tw-drop-shadow-size);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.drop-shadow-xl{--tw-drop-shadow-size:drop-shadow(0 9px 7px var(--tw-drop-shadow-color,#0000001a));--tw-drop-shadow:drop-shadow(var(--drop-shadow-xl));filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.drop-shadow-xs{--tw-drop-shadow-size:drop-shadow(0 1px 1px var(--tw-drop-shadow-color,#0000000d));--tw-drop-shadow:drop-shadow(var(--drop-shadow-xs));filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.backdrop-blur-2xl{--tw-backdrop-blur:blur(var(--blur-2xl));-webkit-backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,)}.backdrop-blur-xs{--tw-backdrop-blur:blur(var(--blur-xs));-webkit-backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,)}.backdrop-brightness-50{--tw-backdrop-brightness:brightness(50%);-webkit-backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,)}.backdrop-saturate-200{--tw-backdrop-saturate:saturate(200%);-webkit-backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,)var(--tw-backdrop-brightness,)var(--tw-backdrop-contrast,)var(--tw-backdrop-grayscale,)var(--tw-backdrop-hue-rotate,)var(--tw-backdrop-invert,)var(--tw-backdrop-opacity,)var(--tw-backdrop-saturate,)var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,visibility,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[height\\]{transition-property:height;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[width\\]{transition-property:width;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-none{transition-property:none}.delay-60{transition-delay:60ms}.duration-100{--tw-duration:.1s;transition-duration:.1s}.duration-150{--tw-duration:.15s;transition-duration:.15s}.duration-200{--tw-duration:.2s;transition-duration:.2s}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-450{--tw-duration:.45s;transition-duration:.45s}.duration-550{--tw-duration:.55s;transition-duration:.55s}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.ease-linear{--tw-ease:linear;transition-timing-function:linear}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.\\[will-change\\:transform\\]{will-change:transform}.btn-sm{--fontsize:.75rem;--btn-p:.75rem;--size:calc(var(--size-field,.25rem)*8)}.btn-xs{--fontsize:.6875rem;--btn-p:.5rem;--size:calc(var(--size-field,.25rem)*6)}.card-sm .card-body{--card-p:1rem;--card-fs:.75rem}.card-sm .card-title{--cardtitle-fs:1rem}.btn-error{--btn-color:var(--color-error);--btn-fg:var(--color-error-content)}.btn-primary{--btn-color:var(--color-primary);--btn-fg:var(--color-primary-content)}.select-none{-webkit-user-select:none;user-select:none}.select-text{-webkit-user-select:text;user-select:text}.text-shadow-xs\\/60{--tw-text-shadow-alpha:60%;text-shadow:0px 1px 1px var(--tw-text-shadow-color,oklab(0% 0 0/.6))}.\\[--app-playlist-header-height\\:calc\\(var\\(--spacing\\)\\*16\\)\\]{--app-playlist-header-height:calc(var(--spacing)*16)}.\\[--app-playlist-space\\:calc\\(var\\(--spacing\\)\\*4\\)\\]{--app-playlist-space:calc(var(--spacing)*4)}.\\[--app-playlist-width\\:min\\(400px\\,30vw\\)\\]{--app-playlist-width:min(400px,30vw)}.\\[content-visibility\\:auto\\]{content-visibility:auto}.range-xs{--range-thumb-size:calc(var(--size-selector,.25rem)*4)}.text-shadow-\\[0_0_1px_rgb\\(0_0_0_\\/0\\.5\\)\\,0_0_2px_rgb\\(55_55_55_\\/0\\.7\\)\\]{text-shadow:0 0 1px var(--tw-text-shadow-color,#00000080),0 0 2px var(--tw-text-shadow-color,#373737b3)}.text-shadow-\\[0_0_2px_rgba\\(0_0_0_\\/0\\.3\\)\\,0_0_2px_rgba\\(0_0_0_\\/0\\.3\\)\\,0_0_2px_rgba\\(0_0_0_\\/0\\.3\\)\\]{text-shadow:0 0 2px var(--tw-text-shadow-color,#0000004d),0 0 2px var(--tw-text-shadow-color,#0000004d),0 0 2px var(--tw-text-shadow-color,#0000004d)}.text-shadow-xs{text-shadow:0px 1px 1px var(--tw-text-shadow-color,#0003)}.toggle-primary:checked,.toggle-primary[aria-checked=true]{--input-color:var(--color-primary)}.toggle-sm[type=checkbox],.toggle-sm:has([type=checkbox]){--size:calc(var(--size-selector,.25rem)*5)}.before\\:absolute:before{content:var(--tw-content);position:absolute}.before\\:inset-0:before{content:var(--tw-content);inset:calc(var(--spacing)*0)}.before\\:ml-8:before{content:var(--tw-content);margin-left:calc(var(--spacing)*8)}.before\\:rounded-lg:before{content:var(--tw-content);border-radius:var(--radius-lg)}.before\\:bg-black:before{content:var(--tw-content);background-color:var(--color-black)}.before\\:content-\\[\\'\\'\\]:before{--tw-content:\"\";content:var(--tw-content)}.before\\:content-\\[\\\\\\'\\\\\\'\\]:before{--tw-content:\\'\\';content:var(--tw-content)}@media (hover:hover){.hover\\:scale-105:hover{--tw-scale-x:105%;--tw-scale-y:105%;--tw-scale-z:105%;scale:var(--tw-scale-x)var(--tw-scale-y)}.hover\\:scale-\\[1\\.02\\]:hover{scale:1.02}.hover\\:bg-base-content\\/5:hover{background-color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-base-content\\/5:hover{background-color:color-mix(in oklab,var(--color-base-content)5%,transparent)}}.hover\\:bg-primary\\/15:hover{background-color:var(--color-primary)}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-primary\\/15:hover{background-color:color-mix(in oklab,var(--color-primary)15%,transparent)}}.hover\\:text-base-content\\/80:hover{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.hover\\:text-base-content\\/80:hover{color:color-mix(in oklab,var(--color-base-content)80%,transparent)}}.hover\\:no-underline\\!:hover{text-decoration-line:none!important}.hover\\:opacity-90:hover{opacity:.9}.hover\\:btn-error:hover{--btn-color:var(--color-error);--btn-fg:var(--color-error-content)}}.active\\:scale-95:active{--tw-scale-x:95%;--tw-scale-y:95%;--tw-scale-z:95%;scale:var(--tw-scale-x)var(--tw-scale-y)}.disabled\\:text-base-content\\/30:disabled{color:var(--color-base-content)}@supports (color:color-mix(in lab,red,red)){.disabled\\:text-base-content\\/30:disabled{color:color-mix(in oklab,var(--color-base-content)30%,transparent)}}@media (prefers-reduced-motion:no-preference){.motion-safe\\:animate-spin{animation:var(--animate-spin)}}@media (min-width:80rem){.xl\\:px-36{padding-inline:calc(var(--spacing)*36)}}.\\[\\&\\:\\:-webkit-scrollbar-track\\]\\:mt-\\(--app-playlist-header-height\\)::-webkit-scrollbar-track{margin-top:var(--app-playlist-header-height)}}.range{--range-bg:var(--color-primary)}@supports (color:color-mix(in lab,red,red)){.range{--range-bg:color-mix(in oklch,var(--color-primary)30%,transparent)}}.range-xs{--range-thumb-size:calc(var(--size-selector,.25rem)*3);--range-p:0rem}.range-2xs{--range-thumb-size:calc(var(--size-selector,.25rem)*2);--range-p:0rem}[data-theme=dark] .skeleton{background-image:linear-gradient(105deg,#0000,#0000 40%,#fff5,#0000 60%,#0000)}@keyframes dropdown{0%{opacity:0}}@keyframes radio{0%{padding:5px}50%{padding:3px}}@keyframes toast{0%{opacity:0;scale:.9}to{opacity:1;scale:1}}@keyframes rating{0%,40%{filter:brightness(1.05)contrast(1.05);scale:1.1}}@keyframes skeleton{0%{background-position:150%}to{background-position:-50%}}@keyframes progress{50%{background-position-x:-115%}}@property --tw-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-z{syntax:\"*\";inherits:false;initial-value:0}@property --tw-scale-x{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-y{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-z{syntax:\"*\";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:\"*\";inherits:false}@property --tw-rotate-y{syntax:\"*\";inherits:false}@property --tw-rotate-z{syntax:\"*\";inherits:false}@property --tw-skew-x{syntax:\"*\";inherits:false}@property --tw-skew-y{syntax:\"*\";inherits:false}@property --tw-border-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-gradient-position{syntax:\"*\";inherits:false}@property --tw-gradient-from{syntax:\"<color>\";inherits:false;initial-value:#0000}@property --tw-gradient-via{syntax:\"<color>\";inherits:false;initial-value:#0000}@property --tw-gradient-to{syntax:\"<color>\";inherits:false;initial-value:#0000}@property --tw-gradient-stops{syntax:\"*\";inherits:false}@property --tw-gradient-via-stops{syntax:\"*\";inherits:false}@property --tw-gradient-from-position{syntax:\"<length-percentage>\";inherits:false;initial-value:0%}@property --tw-gradient-via-position{syntax:\"<length-percentage>\";inherits:false;initial-value:50%}@property --tw-gradient-to-position{syntax:\"<length-percentage>\";inherits:false;initial-value:100%}@property --tw-leading{syntax:\"*\";inherits:false}@property --tw-font-weight{syntax:\"*\";inherits:false}@property --tw-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:\"*\";inherits:false}@property --tw-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:\"*\";inherits:false}@property --tw-inset-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:\"*\";inherits:false}@property --tw-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:\"*\";inherits:false}@property --tw-inset-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:\"*\";inherits:false}@property --tw-ring-offset-width{syntax:\"<length>\";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:\"*\";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:\"*\";inherits:false}@property --tw-brightness{syntax:\"*\";inherits:false}@property --tw-contrast{syntax:\"*\";inherits:false}@property --tw-grayscale{syntax:\"*\";inherits:false}@property --tw-hue-rotate{syntax:\"*\";inherits:false}@property --tw-invert{syntax:\"*\";inherits:false}@property --tw-opacity{syntax:\"*\";inherits:false}@property --tw-saturate{syntax:\"*\";inherits:false}@property --tw-sepia{syntax:\"*\";inherits:false}@property --tw-drop-shadow{syntax:\"*\";inherits:false}@property --tw-drop-shadow-color{syntax:\"*\";inherits:false}@property --tw-drop-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:\"*\";inherits:false}@property --tw-backdrop-blur{syntax:\"*\";inherits:false}@property --tw-backdrop-brightness{syntax:\"*\";inherits:false}@property --tw-backdrop-contrast{syntax:\"*\";inherits:false}@property --tw-backdrop-grayscale{syntax:\"*\";inherits:false}@property --tw-backdrop-hue-rotate{syntax:\"*\";inherits:false}@property --tw-backdrop-invert{syntax:\"*\";inherits:false}@property --tw-backdrop-opacity{syntax:\"*\";inherits:false}@property --tw-backdrop-saturate{syntax:\"*\";inherits:false}@property --tw-backdrop-sepia{syntax:\"*\";inherits:false}@property --tw-duration{syntax:\"*\";inherits:false}@property --tw-ease{syntax:\"*\";inherits:false}@property --tw-text-shadow-color{syntax:\"*\";inherits:false}@property --tw-text-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-content{syntax:\"*\";inherits:false;initial-value:\"\"}@keyframes spin{to{transform:rotate(360deg)}}",Se=function detectScriptRel(){
			const e="undefined"!=typeof document&&document.createElement("link").relList
			;return e&&e.supports&&e.supports("modulepreload")?"modulepreload":"preload"}(),Ie={},Te=function preload(e,t,r){
			let o=Promise.resolve();if(t&&t.length>0){let allSettled2=function(e){
			return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:"fulfilled",value:e}),e=>({status:"rejected",reason:e
			}))))};document.getElementsByTagName("link")
			;const e=document.querySelector("meta[property=csp-nonce]"),r=(null==e?void 0:e.nonce)||(null==e?void 0:e.getAttribute("nonce"))
			;o=allSettled2(t.map(e=>{if((e=function(e){return "/"+e}(e))in Ie)return;Ie[e]=true
			;const t=e.endsWith(".css"),o=t?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${o}`))return
			;const a=document.createElement("link");return a.rel=t?"stylesheet":Se,t||(a.as="script"),a.crossOrigin="",a.href=e,
			r&&a.setAttribute("nonce",r),document.head.appendChild(a),t?new Promise((t,r)=>{a.addEventListener("load",t),
			a.addEventListener("error",()=>r(new Error(`Unable to preload CSS for ${e}`)));}):void 0}));}
			function handlePreloadError(e){const t=new Event("vite:preloadError",{cancelable:true});if(t.payload=e,
			window.dispatchEvent(t),!t.defaultPrevented)throw e}return o.then(t=>{
			for(const e of t||[])"rejected"===e.status&&handlePreloadError(e.reason);return e().catch(handlePreloadError)})
			},Ae=/^[a-z0-9]+(-[a-z0-9]+)*$/,stringToIcon$1=(e,t,r,o="")=>{const a=e.split(":");if("@"===e.slice(0,1)){
			if(a.length<2||a.length>3)return null;o=a.shift().slice(1);}if(a.length>3||!a.length)return null;if(a.length>1){
			const e=a.pop(),r=a.pop(),n={provider:a.length>0?a[0]:o,prefix:r,name:e};return t&&!validateIconName$1(n)?null:n}
			const n=a[0],i=n.split("-");if(i.length>1){const e={provider:o,prefix:i.shift(),name:i.join("-")}
			;return t&&!validateIconName$1(e)?null:e}if(r&&""===o){const e={provider:o,prefix:"",name:n}
			;return t&&!validateIconName$1(e,r)?null:e}return null
			},validateIconName$1=(e,t)=>!!e&&!(!(t&&""===e.prefix||e.prefix)||!e.name),Le=Object.freeze({left:0,top:0,width:16,
			height:16}),Pe=Object.freeze({rotate:0,vFlip:false,hFlip:false}),Ne=Object.freeze({...Le,...Pe}),Me=Object.freeze({...Ne,
			body:"",hidden:false});function mergeIconData$1(e,t){const r=function mergeIconTransformations$1(e,t){const r={}
			;!e.hFlip!=!t.hFlip&&(r.hFlip=true),!e.vFlip!=!t.vFlip&&(r.vFlip=true);const o=((e.rotate||0)+(t.rotate||0))%4
			;return o&&(r.rotate=o),r}(e,t)
			;for(const o in Me)o in Pe?o in e&&!(o in r)&&(r[o]=Pe[o]):o in t?r[o]=t[o]:o in e&&(r[o]=e[o]);return r}
			function internalGetIconData$1(e,t,r){const o=e.icons,a=e.aliases||Object.create(null);let n={};function parse(e){
			n=mergeIconData$1(o[e]||a[e],n);}return parse(t),r.forEach(parse),mergeIconData$1(e,n)}function parseIconSet$1(e,t){
			const r=[];if("object"!=typeof e||"object"!=typeof e.icons)return r
			;e.not_found instanceof Array&&e.not_found.forEach(e=>{t(e,null),r.push(e);});const o=function getIconsTree$1(e,t){
			const r=e.icons,o=e.aliases||Object.create(null),a=Object.create(null)
			;return Object.keys(r).concat(Object.keys(o)).forEach(function resolve(e){if(r[e])return a[e]=[];if(!(e in a)){a[e]=null
			;const t=o[e]&&o[e].parent,r=t&&resolve(t);r&&(a[e]=[t].concat(r));}return a[e]}),a}(e);for(const a in o){const n=o[a]
			;n&&(t(a,internalGetIconData$1(e,a,n)),r.push(a));}return r}const Oe={provider:"",aliases:{},not_found:{},...Le}
			;function checkOptionalProps$1(e,t){for(const r in t)if(r in e&&typeof e[r]!=typeof t[r])return  false;return  true}
			function quicklyValidateIconSet$1(e){if("object"!=typeof e||null===e)return null;const t=e
			;if("string"!=typeof t.prefix||!e.icons||"object"!=typeof e.icons)return null;if(!checkOptionalProps$1(e,Oe))return null
			;const r=t.icons;for(const a in r){const e=r[a];if(!a||"string"!=typeof e.body||!checkOptionalProps$1(e,Me))return null}
			const o=t.aliases||Object.create(null);for(const a in o){const e=o[a],t=e.parent
			;if(!a||"string"!=typeof t||!r[t]&&!o[t]||!checkOptionalProps$1(e,Me))return null}return t}const ze=Object.create(null)
			;function getStorage$1(e,t){const r=ze[e]||(ze[e]=Object.create(null));return r[t]||(r[t]=function newStorage$1(e,t){
			return {provider:e,prefix:t,icons:Object.create(null),missing:new Set}}(e,t))}function addIconSet$1(e,t){
			return quicklyValidateIconSet$1(t)?parseIconSet$1(t,(t,r)=>{r?e.icons[t]=r:e.missing.add(t);}):[]}let Re=false
			;function allowSimpleNames$1(e){return "boolean"==typeof e&&(Re=e),Re}function addCollection$2(e,t){
			if("object"!=typeof e)return  false;if("string"!=typeof t&&(t=e.provider||""),Re&&!t&&!e.prefix){let t=false
			;return quicklyValidateIconSet$1(e)&&(e.prefix="",parseIconSet$1(e,(e,r)=>{(function addIcon$2(e,t){
			const r=stringToIcon$1(e,true,Re);if(!r)return  false;const o=getStorage$1(r.provider,r.prefix)
			;return t?function addIconToStorage$1(e,t,r){try{if("string"==typeof r.body)return e.icons[t]={...r},!0}catch(o){}
			return  false}(o,r.name,t):(o.missing.add(r.name),true)})(e,r)&&(t=true);})),t}const r=e.prefix;if(!validateIconName$1({prefix:r,
			name:"a"}))return  false;return !!addIconSet$1(getStorage$1(t,r),e)}const De=Object.freeze({width:null,height:null
			}),Fe=Object.freeze({...De,...Pe}),$e=/(-?[0-9.]*[0-9]+[0-9.]*)/g,je=/^-?[0-9.]*[0-9]+[0-9.]*$/g
			;function calculateSize$2(e,t,r){if(1===t)return e;if(r=r||100,"number"==typeof e)return Math.ceil(e*t*r)/r
			;if("string"!=typeof e)return e;const o=e.split($e);if(null===o||!o.length)return e;const a=[]
			;let n=o.shift(),i=je.test(n);for(;;){if(i){const e=parseFloat(n);isNaN(e)?a.push(n):a.push(Math.ceil(e*t*r)/r);
			}else a.push(n);if(n=o.shift(),void 0===n)return a.join("");i=!i;}}
			const Be=/\sid="(\S+)"/g,Ue="IconifyId"+Date.now().toString(16)+(16777216*Math.random()|0).toString(16);let Ve=0
			;const qe=Object.create(null);function getAPIModule$1(e){return qe[e]||qe[""]}function createAPIConfig$1(e){let t
			;if("string"==typeof e.resources)t=[e.resources];else if(t=e.resources,!(t instanceof Array&&t.length))return null
			;return {resources:t,path:e.path||"/",maxURL:e.maxURL||500,rotate:e.rotate||750,timeout:e.timeout||5e3,
			random:true===e.random,index:e.index||0,dataAfterTimeout:false!==e.dataAfterTimeout}}
			const Ge=Object.create(null),He=["https://api.simplesvg.com","https://api.unisvg.com"],Qe=[]
			;for(;He.length>0;)1===He.length||Math.random()>.5?Qe.push(He.shift()):Qe.push(He.pop());function addAPIProvider$2(e,t){
			const r=createAPIConfig$1(t);return null!==r&&(Ge[e]=r,true)}function getAPIConfig$1(e){return Ge[e]}
			Ge[""]=createAPIConfig$1({resources:["https://api.iconify.design"].concat(Qe)});let We=(()=>{let e;try{if(e=fetch,
			"function"==typeof e)return e}catch(t){}})();const Ye={prepare:(e,t,r)=>{
			const o=[],a=function calculateMaxLength$1(e,t){const r=getAPIConfig$1(e);if(!r)return 0;let o;if(r.maxURL){let e=0
			;r.resources.forEach(t=>{const r=t;e=Math.max(e,r.length);});const a=t+".json?icons=";o=r.maxURL-e-r.path.length-a.length;
			}else o=0;return o}(e,t),n="icons";let i={type:n,provider:e,prefix:t,icons:[]},s=0;return r.forEach((r,l)=>{
			s+=r.length+1,s>=a&&l>0&&(o.push(i),i={type:n,provider:e,prefix:t,icons:[]},s=r.length),i.icons.push(r);}),o.push(i),o},
			send:(e,t,r)=>{if(!We)return void r("abort",424);let o=function getPath$1(e){if("string"==typeof e){
			const t=getAPIConfig$1(e);if(t)return t.path}return "/"}(t.provider);switch(t.type){case "icons":{
			const e=t.prefix,r=t.icons.join(",");o+=e+".json?"+new URLSearchParams({icons:r}).toString();break}case "custom":{
			const e=t.uri;o+="/"===e.slice(0,1)?e.slice(1):e;break}default:return void r("abort",400)}let a=503;We(e+o).then(e=>{
			const t=e.status;if(200===t)return a=501,e.json();setTimeout(()=>{r(function shouldAbort$1(e){return 404===e
			}(t)?"abort":"next",t);});}).then(e=>{"object"==typeof e&&null!==e?setTimeout(()=>{r("success",e);}):setTimeout(()=>{
			404===e?r("abort",e):r("next",a);});}).catch(()=>{r("next",a);});}};function removeCallback$1(e,t){e.forEach(e=>{
			const r=e.loaderCallbacks;r&&(e.loaderCallbacks=r.filter(e=>e.id!==t));});}let Xe=0;var Ke={resources:[],index:0,
			timeout:2e3,rotate:750,random:false,dataAfterTimeout:false};function sendQuery$1(e,t,r,o){
			const a=e.resources.length,n=e.random?Math.floor(Math.random()*a):e.index;let i;if(e.random){let t=e.resources.slice(0)
			;for(i=[];t.length>1;){const e=Math.floor(Math.random()*t.length);i.push(t[e]),t=t.slice(0,e).concat(t.slice(e+1));}
			i=i.concat(t);}else i=e.resources.slice(n).concat(e.resources.slice(0,n));const s=Date.now()
			;let l,c="pending",d=0,u=null,p=[],h=[];function resetTimer(){u&&(clearTimeout(u),u=null);}function abort(){
			"pending"===c&&(c="aborted"),resetTimer(),p.forEach(e=>{"pending"===e.status&&(e.status="aborted");}),p=[];}
			function subscribe(e,t){t&&(h=[]),"function"==typeof e&&h.push(e);}function failQuery(){c="failed",h.forEach(e=>{
			e(void 0,l);});}function clearQueue(){p.forEach(e=>{"pending"===e.status&&(e.status="aborted");}),p=[];}function execNext(){
			if("pending"!==c)return;resetTimer();const o=i.shift();if(void 0===o)return p.length?void(u=setTimeout(()=>{
			resetTimer(),"pending"===c&&(clearQueue(),failQuery());},e.timeout)):void failQuery();const a={status:"pending",
			resource:o,callback:(t,r)=>{!function moduleResponse(t,r,o){const a="success"!==r;switch(p=p.filter(e=>e!==t),c){
			case "pending":break;case "failed":if(a||!e.dataAfterTimeout)return;break;default:return}if("abort"===r)return l=o,
			void failQuery();if(a)return l=o,void(p.length||(i.length?execNext():failQuery()));if(resetTimer(),clearQueue(),
			!e.random){const r=e.resources.indexOf(t.resource);-1!==r&&r!==e.index&&(e.index=r);}c="completed",h.forEach(e=>{e(o);});
			}(a,t,r);}};p.push(a),d++,u=setTimeout(execNext,e.rotate),r(o,t,a.callback);}return "function"==typeof o&&h.push(o),
			setTimeout(execNext),function getQueryStatus(){return {startTime:s,payload:t,status:c,queriesSent:d,
			queriesPending:p.length,subscribe:subscribe,abort:abort}}}function initRedundancy$1(e){const t={...Ke,...e};let r=[]
			;function cleanup(){r=r.filter(e=>"pending"===e().status);}return {query:function query(e,o,a){
			const n=sendQuery$1(t,e,o,(e,t)=>{cleanup(),a&&a(e,t);});return r.push(n),n},find:function find(e){
			return r.find(t=>e(t))||null},setIndex:e=>{t.index=e;},getIndex:()=>t.index,cleanup:cleanup}}
			function emptyCallback$1$1(){}const Je=Object.create(null);function sendAPIQuery$1(e,t,r){let o,a
			;if("string"==typeof e){const t=getAPIModule$1(e);if(!t)return r(void 0,424),emptyCallback$1$1;a=t.send
			;const n=function getRedundancyCache$1(e){if(!Je[e]){const t=getAPIConfig$1(e);if(!t)return;const r={config:t,
			redundancy:initRedundancy$1(t)};Je[e]=r;}return Je[e]}(e);n&&(o=n.redundancy);}else {const t=createAPIConfig$1(e);if(t){
			o=initRedundancy$1(t);const r=getAPIModule$1(e.resources?e.resources[0]:"");r&&(a=r.send);}}
			return o&&a?o.query(t,a,r)().abort:(r(void 0,424),emptyCallback$1$1)}function emptyCallback$2(){}
			function loadedNewIcons$1(e){e.iconsLoaderFlag||(e.iconsLoaderFlag=true,setTimeout(()=>{e.iconsLoaderFlag=false,
			function updateCallbacks$1(e){e.pendingCallbacksFlag||(e.pendingCallbacksFlag=true,setTimeout(()=>{
			e.pendingCallbacksFlag=false;const t=e.loaderCallbacks?e.loaderCallbacks.slice(0):[];if(!t.length)return;let r=false
			;const o=e.provider,a=e.prefix;t.forEach(t=>{const n=t.icons,i=n.pending.length;n.pending=n.pending.filter(t=>{
			if(t.prefix!==a)return  true;const i=t.name;if(e.icons[i])n.loaded.push({provider:o,prefix:a,name:i});else {
			if(!e.missing.has(i))return r=true,true;n.missing.push({provider:o,prefix:a,name:i});}return  false}),
			n.pending.length!==i&&(r||removeCallback$1([e],t.id),
			t.callback(n.loaded.slice(0),n.missing.slice(0),n.pending.slice(0),t.abort));});}));}(e);}));}
			function parseLoaderResponse$1(e,t,r){function checkMissing(){const r=e.pendingIcons;t.forEach(t=>{r&&r.delete(t),
			e.icons[t]||e.missing.add(t);});}if(r&&"object"==typeof r)try{if(!addIconSet$1(e,r).length)return void checkMissing()
			}catch(o){}checkMissing(),loadedNewIcons$1(e);}function parsePossiblyAsyncResponse$1(e,t){
			e instanceof Promise?e.then(e=>{t(e);}).catch(()=>{t(null);}):t(e);}function loadNewIcons$1(e,t){
			e.iconsToLoad?e.iconsToLoad=e.iconsToLoad.concat(t).sort():e.iconsToLoad=t,e.iconsQueueFlag||(e.iconsQueueFlag=true,
			setTimeout(()=>{e.iconsQueueFlag=false;const{provider:t,prefix:r}=e,o=e.iconsToLoad;if(delete e.iconsToLoad,
			!o||!o.length)return;const a=e.loadIcon
			;if(e.loadIcons&&(o.length>1||!a))return void parsePossiblyAsyncResponse$1(e.loadIcons(o,r,t),t=>{
			parseLoaderResponse$1(e,o,t);});if(a)return void o.forEach(o=>{parsePossiblyAsyncResponse$1(a(o,r,t),t=>{
			parseLoaderResponse$1(e,[o],t?{prefix:r,icons:{[o]:t}}:null);});})
			;const{valid:n,invalid:i}=function checkIconNamesForAPI$1(e){const t=[],r=[];return e.forEach(e=>{
			(e.match(Ae)?t:r).push(e);}),{valid:t,invalid:r}}(o);if(i.length&&parseLoaderResponse$1(e,i,null),!n.length)return
			;const s=r.match(Ae)?getAPIModule$1(t):null;if(!s)return void parseLoaderResponse$1(e,n,null)
			;s.prepare(t,r,n).forEach(r=>{sendAPIQuery$1(t,r,t=>{parseLoaderResponse$1(e,r.icons,t);});});}));}
			const loadIcons$2=(e,t)=>{const r=function sortIcons$1(e){const t={loaded:[],missing:[],pending:[]
			},r=Object.create(null)
			;e.sort((e,t)=>e.provider!==t.provider?e.provider.localeCompare(t.provider):e.prefix!==t.prefix?e.prefix.localeCompare(t.prefix):e.name.localeCompare(t.name))
			;let o={provider:"",prefix:"",name:""};return e.forEach(e=>{
			if(o.name===e.name&&o.prefix===e.prefix&&o.provider===e.provider)return;o=e
			;const a=e.provider,n=e.prefix,i=e.name,s=r[a]||(r[a]=Object.create(null)),l=s[n]||(s[n]=getStorage$1(a,n));let c
			;c=i in l.icons?t.loaded:""===n||l.missing.has(i)?t.missing:t.pending;const d={provider:a,prefix:n,name:i};c.push(d);}),t
			}(function listToIcons$1(e,t=true,r=false){const o=[];return e.forEach(e=>{const a="string"==typeof e?stringToIcon$1(e,t,r):e
			;a&&o.push(a);}),o}(e,true,allowSimpleNames$1()));if(!r.pending.length){let e=true;return t&&setTimeout(()=>{
			e&&t(r.loaded,r.missing,r.pending,emptyCallback$2);}),()=>{e=false;}}const o=Object.create(null),a=[];let n,i
			;return r.pending.forEach(e=>{const{provider:t,prefix:r}=e;if(r===i&&t===n)return;n=t,i=r,a.push(getStorage$1(t,r))
			;const s=o[t]||(o[t]=Object.create(null));s[r]||(s[r]=[]);}),r.pending.forEach(e=>{
			const{provider:t,prefix:r,name:a}=e,n=getStorage$1(t,r),i=n.pendingIcons||(n.pendingIcons=new Set);i.has(a)||(i.add(a),
			o[t][r].push(a));}),a.forEach(e=>{const t=o[e.provider][e.prefix];t.length&&loadNewIcons$1(e,t);}),
			t?function storeCallback$1(e,t,r){const o=Xe++,a=removeCallback$1.bind(null,r,o);if(!t.pending.length)return a;const n={
			id:o,icons:t,callback:e,abort:a};return r.forEach(e=>{(e.loaderCallbacks||(e.loaderCallbacks=[])).push(n);}),a
			}(t,r,a):emptyCallback$2};const Ze=/[\s,]+/;function flipFromString$1(e,t){t.split(Ze).forEach(t=>{switch(t.trim()){
			case "horizontal":e.hFlip=true;break;case "vertical":e.vFlip=true;}});}function rotateFromString$1(e,t=0){
			const r=e.replace(/^-?[0-9.]*/,"");function cleanup(e){for(;e<0;)e+=4;return e%4}if(""===r){const t=parseInt(e)
			;return isNaN(t)?0:cleanup(t)}if(r!==e){let t=0;switch(r){case "%":t=25;break;case "deg":t=90;}if(t){
			let o=parseFloat(e.slice(0,e.length-r.length));return isNaN(o)?0:(o/=t,o%1==0?cleanup(o):0)}}return t}const et={...Fe,
			inline:false},tt={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink","aria-hidden":true,
			role:"img"},rt={display:"inline-block"},ot={backgroundColor:"currentColor"},at={backgroundColor:"transparent"},nt={
			Image:"var(--svg)",Repeat:"no-repeat",Size:"100% 100%"},it={webkitMask:ot,mask:ot,background:at};for(const zo in it){
			const e=it[zo];for(const t in nt)e[zo+t]=nt[t];}const st={};function fixSize$1(e){
			return e+(e.match(/^[-0-9.]+$/)?"px":"")}["horizontal","vertical"].forEach(e=>{const t=e.slice(0,1)+"Flip"
			;st[e+"-flip"]=t,st[e.slice(0,1)+"-flip"]=t,st[e+"Flip"]=t;});const render=(e,t)=>{
			const r=function mergeCustomisations(e,t){const r={...e};for(const o in t){const e=t[o],a=typeof e
			;o in De?(null===e||e&&("string"===a||"number"===a))&&(r[o]=e):a===typeof r[o]&&(r[o]="rotate"===o?e%4:e);}return r
			}(et,t),o={...tt},a=t.mode||"svg",n={},i=t.style,s="object"!=typeof i||i instanceof Array?{}:i;for(let f in t){
			const e=t[f];if(void 0!==e)switch(f){case "icon":case "style":case "onLoad":case "mode":case "ssr":break;case "inline":
			case "hFlip":case "vFlip":r[f]=true===e||"true"===e||1===e;break;case "flip":"string"==typeof e&&flipFromString$1(r,e);break
			;case "color":n.color=e;break;case "rotate":"string"==typeof e?r[f]=rotateFromString$1(e):"number"==typeof e&&(r[f]=e)
			;break;case "ariaHidden":case "aria-hidden":true!==e&&"true"!==e&&delete o["aria-hidden"];break;default:{const t=st[f]
			;t?true!==e&&"true"!==e&&1!==e||(r[t]=true):void 0===et[f]&&(o[f]=e);}}}const l=function iconToSVG$1(e,t){const r={...Ne,...e
			},o={...Fe,...t},a={left:r.left,top:r.top,width:r.width,height:r.height};let n=r.body;[r,o].forEach(e=>{
			const t=[],r=e.hFlip,o=e.vFlip;let i,s=e.rotate
			;switch(r?o?s+=2:(t.push("translate("+(a.width+a.left).toString()+" "+(0-a.top).toString()+")"),t.push("scale(-1 1)"),
			a.top=a.left=0):o&&(t.push("translate("+(0-a.left).toString()+" "+(a.height+a.top).toString()+")"),
			t.push("scale(1 -1)"),a.top=a.left=0),s<0&&(s-=4*Math.floor(s/4)),s%=4,s){case 1:i=a.height/2+a.top,
			t.unshift("rotate(90 "+i.toString()+" "+i.toString()+")");break;case 2:
			t.unshift("rotate(180 "+(a.width/2+a.left).toString()+" "+(a.height/2+a.top).toString()+")");break;case 3:
			i=a.width/2+a.left,t.unshift("rotate(-90 "+i.toString()+" "+i.toString()+")");}s%2==1&&(a.left!==a.top&&(i=a.left,
			a.left=a.top,a.top=i),a.width!==a.height&&(i=a.width,a.width=a.height,a.height=i)),
			t.length&&(n=function wrapSVGContent$1(e,t,r){const o=function splitSVGDefs$1(e,t="defs"){let r=""
			;const o=e.indexOf("<"+t);for(;o>=0;){const a=e.indexOf(">",o),n=e.indexOf("</"+t);if(-1===a||-1===n)break
			;const i=e.indexOf(">",n);if(-1===i)break;r+=e.slice(a+1,n).trim(),e=e.slice(0,o).trim()+e.slice(i+1);}return {defs:r,
			content:e}}(e);return function mergeDefsAndContent$1(e,t){return e?"<defs>"+e+"</defs>"+t:t}(o.defs,t+o.content+r)
			}(n,'<g transform="'+t.join(" ")+'">',"</g>"));});const i=o.width,s=o.height,l=a.width,c=a.height;let d,u
			;null===i?(u=null===s?"1em":"auto"===s?c:s,d=calculateSize$2(u,l/c)):(d="auto"===i?l:i,
			u=null===s?calculateSize$2(d,c/l):"auto"===s?c:s);const p={},setAttr=(e,t)=>{
			(e=>"unset"===e||"undefined"===e||"none"===e)(t)||(p[e]=t.toString());};setAttr("width",d),setAttr("height",u)
			;const h=[a.left,a.top,l,c];return p.viewBox=h.join(" "),{attributes:p,viewBox:h,body:n}}(e,r),c=l.attributes
			;if(r.inline&&(n.verticalAlign="-0.125em"),"svg"===a){o.style={...n,...s},Object.assign(o,c);let e=0,r=t.id
			;return "string"==typeof r&&(r=r.replace(/-/g,"_")),o.innerHTML=function replaceIDs(e,t=Ue){const r=[];let o
			;for(;o=Be.exec(e);)r.push(o[1]);if(!r.length)return e;const a="suffix"+(16777216*Math.random()|Date.now()).toString(16)
			;return r.forEach(r=>{const o="function"==typeof t?t(r):t+(Ve++).toString(),n=r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")
			;e=e.replace(new RegExp('([#;"])('+n+')([")]|\\.[a-z])',"g"),"$1"+o+a+"$3");}),e=e.replace(new RegExp(a,"g"),"")
			}(l.body,r?()=>r+"ID"+e++:"iconifyVue"),h("svg",o)}
			const{body:d,width:u,height:p}=e,h$1="mask"===a||"bg"!==a&&-1!==d.indexOf("currentColor"),m=function iconToHTML$2(e,t){
			let r=-1===e.indexOf("xlink:")?"":' xmlns:xlink="http://www.w3.org/1999/xlink"';for(const o in t)r+=" "+o+'="'+t[o]+'"'
			;return '<svg xmlns="http://www.w3.org/2000/svg"'+r+">"+e+"</svg>"}(d,{...c,width:u+"",height:p+""});var g
			;return o.style={...n,"--svg":(g=m,'url("'+function svgToData$1(e){
			return "data:image/svg+xml,"+function encodeSVGforURL$1(e){
			return e.replace(/"/g,"'").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/\s+/g," ")
			}(e)}(g)+'")'),width:fixSize$1(c.width),height:fixSize$1(c.height),...rt,...h$1?ot:at,...s},h("span",o)}
			;if(allowSimpleNames$1(true),function setAPIModule$1(e,t){qe[e]=t;
			}("",Ye),"undefined"!=typeof document&&"undefined"!=typeof window){const e=window;if(void 0!==e.IconifyPreload){
			const t=e.IconifyPreload;"object"==typeof t&&null!==t&&(t instanceof Array?t:[t]).forEach(e=>{try{
			"object"!=typeof e||null===e||e instanceof Array||"object"!=typeof e.icons||"string"!=typeof e.prefix||addCollection$2(e);
			}catch(t){}});}if(void 0!==e.IconifyProviders){const t=e.IconifyProviders
			;if("object"==typeof t&&null!==t)for(let e in t){try{const r=t[e]
			;if("object"!=typeof r||!r||void 0===r.resources)continue;addAPIProvider$2(e,r);}catch(Mo){}}}}const lt={...Ne,body:""
			},ct=exports("d", defineComponent((e,{emit:t})=>{const r=ref(null);function abortLoading(){var e,t;r.value&&(null==(t=(e=r.value).abort)||t.call(e),
			r.value=null);}const o=ref(!!e.ssr),a=ref(""),n=shallowRef(null);function getIcon2(){const o=e.icon
			;if("object"==typeof o&&null!==o&&"string"==typeof o.body)return a.value="",{data:o};let n
			;if("string"!=typeof o||null===(n=stringToIcon$1(o,false,true)))return null;let i=function getIconData$1(e){
			const t="string"==typeof e?stringToIcon$1(e,true,Re):e;if(t){const e=getStorage$1(t.provider,t.prefix),r=t.name
			;return e.icons[r]||(e.missing.has(r)?null:void 0)}}(n);if(!i){const e=r.value;return e&&e.name===o||(r.value=null===i?{
			name:o}:{name:o,abort:loadIcons$2([n],updateIconData)}),null}abortLoading(),a.value!==o&&(a.value=o,nextTick(()=>{t("load",o);
			}));const s=e.customise;if(s){i=Object.assign({},i);const e=s(i.body,n.name,n.prefix,n.provider)
			;"string"==typeof e&&(i.body=e);}const l=["iconify"];return ""!==n.prefix&&l.push("iconify--"+n.prefix),
			""!==n.provider&&l.push("iconify--"+n.provider),{data:i,classes:l}}function updateIconData(){var e;const t=getIcon2()
			;t?t.data!==(null==(e=n.value)?void 0:e.data)&&(n.value=t):n.value=null;}return o.value?updateIconData():onMounted(()=>{
			o.value=true,updateIconData();}),watch(()=>e.icon,updateIconData),onUnmounted(abortLoading),()=>{const t=n.value
			;if(!t)return render(lt,e);let r=e;return t.classes&&(r={...e,class:t.classes.join(" ")}),render({...Ne,...t.data},r)}
			},{
			props:["icon","mode","ssr","width","height","style","color","inline","rotate","hFlip","horizontalFlip","vFlip","verticalFlip","flip","id","ariaHidden","customise","title"],
			emits:["load"]}));function tryOnScopeDispose(e){return !!getCurrentScope()&&(onScopeDispose(e),true)}function toReactive(e){if(!isRef(e))return reactive(e)
			;const t=new Proxy({},{get:(t,r,o)=>unref(Reflect.get(e.value,r,o)),
			set:(t,r,o)=>(isRef(e.value[r])&&!isRef(o)?e.value[r].value=o:e.value[r]=o,true),
			deleteProperty:(t,r)=>Reflect.deleteProperty(e.value,r),has:(t,r)=>Reflect.has(e.value,r),
			ownKeys:()=>Object.keys(e.value),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});return reactive(t)}
			const dt="undefined"!=typeof window&&"undefined"!=typeof document;"undefined"!=typeof WorkerGlobalScope&&(WorkerGlobalScope);const notNullish=e=>null!=e,ut=Object.prototype.toString,noop=()=>{},pt=getIsIOS()
			;function getIsIOS(){var e,t
			;return dt&&(null==(e=null==window?void 0:window.navigator)?void 0:e.userAgent)&&(/iP(?:ad|hone|od)/.test(window.navigator.userAgent)||(null==(t=null==window?void 0:window.navigator)?void 0:t.maxTouchPoints)>2&&/iPad|Macintosh/.test(null==window?void 0:window.navigator.userAgent))
			}function createFilterWrapper(e,t){return function wrapper(...r){return new Promise((o,a)=>{
			Promise.resolve(e(()=>t.apply(this,r),{fn:t,thisArg:this,args:r})).then(o).catch(a);})}}const bypassFilter=e=>e()
			;function promiseTimeout(e,t=false,r="Timeout"){return new Promise((o,a)=>{t?setTimeout(()=>a(r),e):setTimeout(o,e);})}
			function getLifeCycleTarget(e){return getCurrentInstance()}function toArray(e){return Array.isArray(e)?e:[e]}function toRef(...e){
			if(1!==e.length)return toRef$1(...e);const t=e[0];return "function"==typeof t?readonly(customRef(()=>({get:t,set:noop}))):ref(t)}
			function useDebounceFn(e,t=200,r={}){return createFilterWrapper(function debounceFilter(e,t={}){let r,o,a=noop
			;const _clearTimeout=e=>{clearTimeout(e),a(),a=noop;};let n;return i=>{const s=toValue(e),l=toValue(t.maxWait)
			;return r&&_clearTimeout(r),s<=0||void 0!==l&&l<=0?(o&&(_clearTimeout(o),o=null),
			Promise.resolve(i())):new Promise((e,c)=>{a=t.rejectOnCancel?c:e,n=i,l&&!o&&(o=setTimeout(()=>{r&&_clearTimeout(r),
			o=null,e(n());},l)),r=setTimeout(()=>{o&&_clearTimeout(o),o=null,e(i());},s);})}}(t,r),e)}
			function useThrottleFn(e,t=200,r=false,o=true,a=false){return createFilterWrapper(function throttleFilter(...e){
			let t,r,o,a,n,i,s=0,l=true,c=noop
			;isRef(e[0])||"object"!=typeof e[0]?[o,a=true,n=true,i=false]=e:({delay:o,trailing:a=true,leading:n=true,rejectOnCancel:i=false}=e[0])
			;const clear=()=>{t&&(clearTimeout(t),t=void 0,c(),c=noop);};return e=>{const d=toValue(o),u=Date.now()-s,invoke=()=>r=e()
			;return clear(),d<=0?(s=Date.now(),invoke()):(u>d&&(n||!l)?(s=Date.now(),invoke()):a&&(r=new Promise((e,r)=>{c=i?r:e,
			t=setTimeout(()=>{s=Date.now(),l=true,e(invoke()),clear();},Math.max(0,d-u));})),n||t||(t=setTimeout(()=>l=true,d)),l=false,r)}
			}(t,r,o,a),e)}function watchPausable(e,t,r={}){
			const{eventFilter:o,initialState:a="active",...n}=r,{eventFilter:i,pause:s,resume:l,isActive:c}=function pausableFilter(e=bypassFilter,t={}){
			const{initialState:r="active"}=t,o=toRef("active"===r);return {isActive:readonly(o),pause:function pause(){o.value=false;},
			resume:function resume(){o.value=true;},eventFilter:(...t)=>{o.value&&e(...t);}}}(o,{initialState:a
			}),d=function watchWithFilter(e,t,r={}){const{eventFilter:o=bypassFilter,...a}=r;return watch(e,createFilterWrapper(o,t),a)
			}(e,t,{...n,eventFilter:i});return {stop:d,pause:s,resume:l,isActive:c}}function syncRef(e,t,...[r]){
			const{flush:o="sync",deep:a=false,immediate:n=true,direction:i="both",transform:s={}}=r||{},l=[],c="ltr"in s&&s.ltr||(e=>e),d="rtl"in s&&s.rtl||(e=>e)
			;"both"!==i&&"ltr"!==i||l.push(watchPausable(e,e=>{l.forEach(e=>e.pause()),t.value=c(e),l.forEach(e=>e.resume());},{
			flush:o,deep:a,immediate:n})),"both"!==i&&"rtl"!==i||l.push(watchPausable(t,t=>{l.forEach(e=>e.pause()),e.value=d(t),
			l.forEach(e=>e.resume());},{flush:o,deep:a,immediate:n}));return ()=>{l.forEach(e=>e.stop());}}
			function tryOnMounted(e,t=true,r){getLifeCycleTarget()?onMounted(e,r):t?e():nextTick(e);}function tryOnUnmounted(e,t){
			getLifeCycleTarget()&&onUnmounted(e,t);}function createUntil(e,t=false){
			function toMatch(r,{flush:o="sync",deep:a=false,timeout:n,throwOnTimeout:i}={}){let s=null;const l=[new Promise(n=>{
			s=watch(e,e=>{r(e)!==t&&(s?s():nextTick(()=>null==s?void 0:s()),n(e));},{flush:o,deep:a,immediate:true});})]
			;return null!=n&&l.push(promiseTimeout(n,i).then(()=>toValue(e)).finally(()=>null==s?void 0:s())),Promise.race(l)}
			function toBe(r,o){if(!isRef(r))return toMatch(e=>e===r,o)
			;const{flush:a="sync",deep:n=false,timeout:i,throwOnTimeout:s}=null!=o?o:{};let l=null;const c=[new Promise(o=>{
			l=watch([e,r],([e,r])=>{t!==(e===r)&&(l?l():nextTick(()=>null==l?void 0:l()),o(e));},{flush:a,deep:n,immediate:true});})]
			;return null!=i&&c.push(promiseTimeout(i,s).then(()=>toValue(e)).finally(()=>(null==l||l(),toValue(e)))),Promise.race(c)}
			function changed(e){return changedTimes(1,e)}function changedTimes(e=1,t){let r=-1;return toMatch(()=>(r+=1,r>=e),t)}
			if(Array.isArray(toValue(e))){return {toMatch:toMatch,toContains:function toContains(e,t){return toMatch(t=>{
			const r=Array.from(t);return r.includes(e)||r.includes(toValue(e))},t)},changed:changed,changedTimes:changedTimes,get not(){
			return createUntil(e,!t)}}}return {toMatch:toMatch,toBe:toBe,toBeTruthy:function toBeTruthy(e){
			return toMatch(e=>Boolean(e),e)},toBeNull:function toBeNull(e){return toBe(null,e)},toBeNaN:function toBeNaN(e){
			return toMatch(Number.isNaN,e)},toBeUndefined:function toBeUndefined(e){return toBe(void 0,e)},changed:changed,
			changedTimes:changedTimes,get not(){return createUntil(e,!t)}}}function until(e){return createUntil(e)}
			function useIntervalFn(e,t=1e3,r={}){const{immediate:o=true,immediateCallback:a=false}=r;let n=null;const i=shallowRef(false)
			;function clean(){n&&(clearInterval(n),n=null);}function pause(){i.value=false,clean();}function resume(){const r=toValue(t)
			;r<=0||(i.value=true,a&&e(),clean(),i.value&&(n=setInterval(e,r)));}if(o&&dt&&resume(),isRef(t)||"function"==typeof t){
			tryOnScopeDispose(watch(t,()=>{i.value&&dt&&resume();}));}return tryOnScopeDispose(pause),{isActive:i,pause:pause,
			resume:resume}}const ht=dt?window:void 0,mt=dt?window.document:void 0,ft=dt?window.navigator:void 0
			;function unrefElement(e){var t;const r=toValue(e);return null!=(t=null==r?void 0:r.$el)?t:r}function useEventListener(...e){
			const t=[],cleanup=()=>{t.forEach(e=>e()),t.length=0;},r=computed(()=>{const t=toArray(toValue(e[0])).filter(e=>null!=e)
			;return t.every(e=>"string"!=typeof e)?t:void 0}),o=function watchImmediate(e,t,r){return watch(e,t,{...r,immediate:true})
			}(()=>{var t,o
			;return [null!=(o=null==(t=r.value)?void 0:t.map(e=>unrefElement(e)))?o:[ht].filter(e=>null!=e),toArray(toValue(r.value?e[1]:e[0])),toArray(unref(r.value?e[2]:e[1])),toValue(r.value?e[3]:e[2])]
			},([e,r,o,a])=>{if(cleanup(),!(null==e?void 0:e.length)||!(null==r?void 0:r.length)||!(null==o?void 0:o.length))return
			;const n=(i=a,"[object Object]"===ut.call(i)?{...a}:a);var i
			;t.push(...e.flatMap(e=>r.flatMap(t=>o.map(r=>((e,t,r,o)=>(e.addEventListener(t,r,o),
			()=>e.removeEventListener(t,r,o)))(e,t,r,n)))));},{flush:"post"});return tryOnScopeDispose(cleanup),()=>{o(),cleanup();}}
			let gt=false;function onClickOutside(e,t,r={}){
			const{window:o=ht,ignore:a=[],capture:n=true,detectIframe:i=false,controls:s=false}=r;if(!o)return s?{stop:noop,cancel:noop,
			trigger:noop}:noop;if(pt&&!gt){gt=true;const e={passive:true}
			;Array.from(o.document.body.children).forEach(t=>useEventListener(t,"click",noop,e)),
			useEventListener(o.document.documentElement,"click",noop,e);}let l=true;const shouldIgnore=e=>toValue(a).some(t=>{
			if("string"==typeof t)return Array.from(o.document.querySelectorAll(t)).some(t=>t===e.target||e.composedPath().includes(t))
			;{const r=unrefElement(t);return r&&(e.target===r||e.composedPath().includes(r))}});const listener=r=>{
			const o=unrefElement(e);null!=r.target&&(o instanceof Element||!function hasMultipleRoots(e){const t=toValue(e)
			;return t&&16===t.$.subTree.shapeFlag}(e)||!function checkMultipleRoots(e,t){
			const r=toValue(e),o=r.$.subTree&&r.$.subTree.children
			;return !(null==o||!Array.isArray(o))&&o.some(e=>e.el===t.target||t.composedPath().includes(e.el))
			}(e,r))&&o&&o!==r.target&&!r.composedPath().includes(o)&&("detail"in r&&0===r.detail&&(l=!shouldIgnore(r)),l?t(r):l=true);}
			;let c=false;const d=[useEventListener(o,"click",e=>{c||(c=true,setTimeout(()=>{c=false;},0),listener(e));},{passive:true,capture:n
			}),useEventListener(o,"pointerdown",t=>{const r=unrefElement(e);l=!shouldIgnore(t)&&!(!r||t.composedPath().includes(r));
			},{passive:true}),i&&useEventListener(o,"blur",r=>{setTimeout(()=>{var a;const n=unrefElement(e)
			;"IFRAME"!==(null==(a=o.document.activeElement)?void 0:a.tagName)||(null==n?void 0:n.contains(o.document.activeElement))||t(r);
			},0);},{passive:true})].filter(Boolean),stop=()=>d.forEach(e=>e());return s?{stop:stop,cancel:()=>{l=false;},trigger:e=>{l=true,
			listener(e),l=false;}}:stop}function useSupported(e){const t=function useMounted(){const e=shallowRef(false),t=getCurrentInstance();return t&&onMounted(()=>{
			e.value=true;},t),e}();return computed(()=>(t.value,Boolean(e())))}function useMutationObserver(e,t,r={}){
			const{window:o=ht,...a}=r;let n;const i=useSupported(()=>o&&"MutationObserver"in o),cleanup=()=>{n&&(n.disconnect(),
			n=void 0);},s=computed(()=>{const t=toArray(toValue(e)).map(unrefElement).filter(notNullish);return new Set(t)}),l=watch(()=>s.value,e=>{
			cleanup(),i.value&&e.size&&(n=new MutationObserver(t),e.forEach(e=>n.observe(e,a)));},{immediate:true,flush:"post"
			}),stop=()=>{l(),cleanup();};return tryOnScopeDispose(stop),{isSupported:i,stop:stop,
			takeRecords:()=>null==n?void 0:n.takeRecords()}}function useAsyncState(e,t,r){
			const{immediate:o=true,delay:a=0,onError:n=noop,onSuccess:i=noop,resetOnExecute:s=true,shallow:l=true,throwError:c}=null!=r?r:{},p=l?shallowRef(t):ref(t),h=shallowRef(false),m=shallowRef(false),f=shallowRef(void 0)
			;async function execute(r=0,...o){s&&(p.value=t),f.value=void 0,h.value=false,m.value=true,r>0&&await promiseTimeout(r)
			;const a="function"==typeof e?e(...o):e;try{const e=await a;p.value=e,h.value=!0,i(e);}catch(Mo){if(f.value=Mo,n(Mo),
			c)throw Mo}finally{m.value=false;}return p.value}o&&execute(a);const g={state:p,isReady:h,isLoading:m,error:f,
			execute:execute};return {...g,then:(e,t)=>function waitUntilIsLoaded(){return new Promise((e,t)=>{
			until(m).toBe(false).then(()=>e(g)).catch(t);})}().then(e,t)}}function usePermission(e,t={}){
			const{controls:r=false,navigator:o=ft}=t,a=useSupported(()=>o&&"permissions"in o),n=shallowRef(),i="string"==typeof e?{name:e
			}:e,s=shallowRef(),update=()=>{var e,t;s.value=null!=(t=null==(e=n.value)?void 0:e.state)?t:"prompt";}
			;useEventListener(n,"change",update,{passive:true});const l=function createSingletonPromise(e){let t;function wrapper(){
			return t||(t=e()),t}return wrapper.reset=async()=>{const e=t;t=void 0,e&&await e;},wrapper}(async()=>{if(a.value){
			if(!n.value)try{n.value=await o.permissions.query(i);}catch(Mo){n.value=void 0;}finally{update();}
			return r?toRaw(n.value):void 0}});return l(),r?{state:s,isSupported:a,query:l}:s}function useClipboard(e={}){
			const{navigator:t=ft,read:r=false,source:o,copiedDuring:a=1500,legacy:n=false}=e,i=useSupported(()=>t&&"clipboard"in t),s=usePermission("clipboard-read"),l=usePermission("clipboard-write"),c=computed(()=>i.value||n),d=shallowRef(""),p=shallowRef(false),h=function useTimeoutFn(e,t,r={}){
			const{immediate:o=true,immediateCallback:a=false}=r,n=shallowRef(false);let i=null;function clear(){i&&(clearTimeout(i),i=null);}
			function stop(){n.value=false,clear();}function start(...r){a&&e(),clear(),n.value=true,i=setTimeout(()=>{n.value=false,i=null,
			e(...r);},toValue(t));}return o&&(n.value=true,dt&&start()),tryOnScopeDispose(stop),{isPending:readonly(n),start:start,stop:stop}
			}(()=>p.value=false,a,{immediate:false});function isAllowed(e){return "granted"===e||"prompt"===e}
			return c.value&&r&&useEventListener(["copy","cut"],async function updateText(){let e=!(i.value&&isAllowed(s.value))
			;if(!e)try{d.value=await t.clipboard.readText();}catch(Mo){e=true;}e&&(d.value=function legacyRead(){var e,t,r
			;return null!=(r=null==(t=null==(e=null==document?void 0:document.getSelection)?void 0:e.call(document))?void 0:t.toString())?r:""
			}());},{passive:true}),{isSupported:c,text:d,copied:p,copy:async function copy(e=toValue(o)){if(c.value&&null!=e){
			let r=!(i.value&&isAllowed(l.value));if(!r)try{await t.clipboard.writeText(e);}catch(Mo){r=true;}r&&function legacyCopy(e){
			const t=document.createElement("textarea");t.value=null!=e?e:"",t.style.position="absolute",t.style.opacity="0",
			document.body.appendChild(t),t.select(),document.execCommand("copy"),t.remove();}(e),d.value=e,p.value=true,h.start();}}}}
			const bt="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},vt="__vueuse_ssr_handlers__",wt=getHandlers()
			;function getHandlers(){return vt in bt||(bt[vt]=bt[vt]||{}),bt[vt]}const yt={boolean:{read:e=>"true"===e,
			write:e=>String(e)},object:{read:e=>JSON.parse(e),write:e=>JSON.stringify(e)},number:{read:e=>Number.parseFloat(e),
			write:e=>String(e)},any:{read:e=>e,write:e=>String(e)},string:{read:e=>e,write:e=>String(e)},map:{
			read:e=>new Map(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e.entries()))},set:{read:e=>new Set(JSON.parse(e)),
			write:e=>JSON.stringify(Array.from(e))},date:{read:e=>new Date(e),write:e=>e.toISOString()}},xt="vueuse-storage"
			;function useStorage(e,t,r,o={}){var a
			;const{flush:n="pre",deep:i=true,listenToStorageChanges:s=true,writeDefaults:l=true,mergeDefaults:c=false,shallow:p,window:m=ht,eventFilter:f,onError:b=e=>{},initOnMounted:v}=o,w=(p?shallowRef:ref)("function"==typeof t?t():t),y=computed(()=>toValue(e))
			;if(!r)try{r=function getSSRHandler(e,t){return wt[e]||t}("getDefaultStorage",()=>{var e
			;return null==(e=ht)?void 0:e.localStorage})();}catch(Mo){b(Mo);}if(!r)return w
			;const x=toValue(t),k=function guessSerializerType(e){
			return null==e?"any":e instanceof Set?"set":e instanceof Map?"map":e instanceof Date?"date":"boolean"==typeof e?"boolean":"string"==typeof e?"string":"object"==typeof e?"object":Number.isNaN(e)?"any":"number"
			}(x),_=null!=(a=o.serializer)?a:yt[k],{pause:C,resume:S}=watchPausable(w,()=>function write(e){try{
			const t=r.getItem(y.value);if(null==e)dispatchWriteEvent(t,null),r.removeItem(y.value);else {const o=_.write(e)
			;t!==o&&(r.setItem(y.value,o),dispatchWriteEvent(t,o));}}catch(Mo){b(Mo);}}(w.value),{flush:n,deep:i,eventFilter:f})
			;function dispatchWriteEvent(e,t){if(m){const o={key:y.value,oldValue:e,newValue:t,storageArea:r}
			;m.dispatchEvent(r instanceof Storage?new StorageEvent("storage",o):new CustomEvent(xt,{detail:o}));}}function update(e){
			if(!e||e.storageArea===r)if(e&&null==e.key)w.value=x;else if(!e||e.key===y.value){C();try{
			(null==e?void 0:e.newValue)!==_.write(w.value)&&(w.value=function read2(e){const t=e?e.newValue:r.getItem(y.value)
			;if(null==t)return l&&null!=x&&r.setItem(y.value,_.write(x)),x;if(!e&&c){const e=_.read(t)
			;return "function"==typeof c?c(e,x):"object"!==k||Array.isArray(e)?e:{...x,...e}}return "string"!=typeof t?t:_.read(t)
			}(e));}catch(Mo){b(Mo);}finally{e?nextTick(S):S();}}}function updateFromCustomEvent(e){update(e.detail);}return watch(y,()=>update(),{
			flush:n}),m&&s&&tryOnMounted(()=>{r instanceof Storage?useEventListener(m,"storage",update,{passive:true
			}):useEventListener(m,xt,updateFromCustomEvent),v&&update();}),v||update(),w}function useCssVar(e,t,r={}){
			const{window:o=ht,initialValue:a,observe:n=false}=r,i=shallowRef(a),s=computed(()=>{var e
			;return unrefElement(t)||(null==(e=null==o?void 0:o.document)?void 0:e.documentElement)});function updateCssVar(){var t
			;const r=toValue(e),n=toValue(s);if(n&&o&&r){const e=null==(t=o.getComputedStyle(n).getPropertyValue(r))?void 0:t.trim()
			;i.value=e||i.value||a;}}return n&&useMutationObserver(s,updateCssVar,{attributeFilter:["style","class"],window:o}),
			watch([s,()=>toValue(e)],(e,t)=>{t[0]&&t[1]&&t[0].style.removeProperty(t[1]),updateCssVar();},{immediate:true}),watch([i,s],([t,r])=>{
			const o=toValue(e);(null==r?void 0:r.style)&&o&&(null==t?r.style.removeProperty(o):r.style.setProperty(o,t));},{immediate:true}),
			i}function useResizeObserver(e,t,r={}){const{window:o=ht,...a}=r;let n
			;const i=useSupported(()=>o&&"ResizeObserver"in o),cleanup=()=>{n&&(n.disconnect(),n=void 0);},s=computed(()=>{const t=toValue(e)
			;return Array.isArray(t)?t.map(e=>unrefElement(e)):[unrefElement(t)]}),l=watch(s,e=>{if(cleanup(),i.value&&o){
			n=new ResizeObserver(t);for(const t of e)t&&n.observe(t,a);}},{immediate:true,flush:"post"}),stop=()=>{cleanup(),l();}
			;return tryOnScopeDispose(stop),{isSupported:i,stop:stop}}function useElementBounding(e,t={}){
			const{reset:r=true,windowResize:o=true,windowScroll:a=true,immediate:n=true,updateTiming:i="sync"}=t,s=shallowRef(0),l=shallowRef(0),c=shallowRef(0),d=shallowRef(0),p=shallowRef(0),m=shallowRef(0),f=shallowRef(0),g=shallowRef(0)
			;function recalculate(){const t=unrefElement(e);if(!t)return void(r&&(s.value=0,l.value=0,c.value=0,d.value=0,p.value=0,
			m.value=0,f.value=0,g.value=0));const o=t.getBoundingClientRect();s.value=o.height,l.value=o.bottom,c.value=o.left,
			d.value=o.right,p.value=o.top,m.value=o.width,f.value=o.x,g.value=o.y;}function update(){
			"sync"===i?recalculate():"next-frame"===i&&requestAnimationFrame(()=>recalculate());}return useResizeObserver(e,update),
			watch(()=>unrefElement(e),e=>!e&&update()),useMutationObserver(e,update,{attributeFilter:["style","class"]}),
			a&&useEventListener("scroll",update,{capture:true,passive:true}),o&&useEventListener("resize",update,{passive:true}),
			tryOnMounted(()=>{n&&update();}),{height:s,bottom:l,left:c,right:d,top:p,width:m,x:f,y:g,update:update}}
			function useElementSize(e,t={width:0,height:0},r={}){const{window:o=ht,box:a="content-box"}=r,n=computed(()=>{var t,r
			;return null==(r=null==(t=unrefElement(e))?void 0:t.namespaceURI)?void 0:r.includes("svg")
			}),i=shallowRef(t.width),s=shallowRef(t.height),{stop:l}=useResizeObserver(e,([t])=>{
			const r="border-box"===a?t.borderBoxSize:"content-box"===a?t.contentBoxSize:t.devicePixelContentBoxSize;if(o&&n.value){
			const t=unrefElement(e);if(t){const e=t.getBoundingClientRect();i.value=e.width,s.value=e.height;}}else if(r){
			const e=toArray(r);i.value=e.reduce((e,{inlineSize:t})=>e+t,0),s.value=e.reduce((e,{blockSize:t})=>e+t,0);
			}else i.value=t.contentRect.width,s.value=t.contentRect.height;},r);tryOnMounted(()=>{const r=unrefElement(e)
			;r&&(i.value="offsetWidth"in r?r.offsetWidth:t.width,s.value="offsetHeight"in r?r.offsetHeight:t.height);})
			;const c=watch(()=>unrefElement(e),e=>{i.value=e?t.width:0,s.value=e?t.height:0;});return {width:i,height:s,
			stop:function stop(){l(),c();}}}function useElementVisibility(e,t={}){
			const{window:r=ht,scrollTarget:o,threshold:a=0,rootMargin:n,once:i=false}=t,s=shallowRef(false),{stop:l}=function useIntersectionObserver(e,t,r={}){
			const{root:o,rootMargin:a="0px",threshold:n=0,window:i=ht,immediate:s=true}=r,l=useSupported(()=>i&&"IntersectionObserver"in i),c=computed(()=>toArray(toValue(e)).map(unrefElement).filter(notNullish))
			;let d=noop;const p=shallowRef(s),m=l.value?watch(()=>[c.value,unrefElement(o),p.value],([e,r])=>{if(d(),!p.value)return
			;if(!e.length)return;const o=new IntersectionObserver(t,{root:unrefElement(r),rootMargin:a,threshold:n})
			;e.forEach(e=>e&&o.observe(e)),d=()=>{o.disconnect(),d=noop;};},{immediate:s,flush:"post"}):noop,stop=()=>{d(),m(),
			p.value=false;};return tryOnScopeDispose(stop),{isSupported:l,isActive:p,pause(){d(),p.value=false;},resume(){p.value=true;},
			stop:stop}}(e,e=>{let t=s.value,r=0;for(const o of e)o.time>=r&&(r=o.time,t=o.isIntersecting);s.value=t,
			i&&function watchOnce(e,t,r){const o=watch(e,(...e)=>(nextTick(()=>o()),t(...e)),r);return o}(s,()=>{l();});},{root:o,window:r,
			threshold:a,rootMargin:toValue(n)});return s}const kt={page:e=>[e.pageX,e.pageY],client:e=>[e.clientX,e.clientY],
			screen:e=>[e.screenX,e.screenY],movement:e=>e instanceof MouseEvent?[e.movementX,e.movementY]:null}
			;function useMouseInElement(e,t={}){
			const{handleOutside:r=true,window:o=ht}=t,a=t.type||"page",{x:n,y:i,sourceType:s}=function useMouse(e={}){
			const{type:t="page",touch:r=true,resetOnTouchEnds:o=false,initialValue:a={x:0,y:0
			},window:n=ht,target:i=n,scroll:s=true,eventFilter:l}=e;let c=null,d=0,p=0
			;const h=shallowRef(a.x),m=shallowRef(a.y),f=shallowRef(null),g="function"==typeof t?t:kt[t],mouseHandler=e=>{const t=g(e);c=e,
			t&&([h.value,m.value]=t,f.value="mouse"),n&&(d=n.scrollX,p=n.scrollY);},touchHandler=e=>{if(e.touches.length>0){
			const t=g(e.touches[0]);t&&([h.value,m.value]=t,f.value="touch");}},scrollHandler=()=>{if(!c||!n)return;const e=g(c)
			;c instanceof MouseEvent&&e&&(h.value=e[0]+n.scrollX-d,m.value=e[1]+n.scrollY-p);},reset=()=>{h.value=a.x,m.value=a.y;
			},b=l?e=>l(()=>mouseHandler(e),{}):e=>mouseHandler(e),v=l?e=>l(()=>touchHandler(e),{}):e=>touchHandler(e),w=l?()=>l(()=>scrollHandler(),{}):()=>scrollHandler()
			;if(i){const e={passive:true}
			;useEventListener(i,["mousemove","dragover"],b,e),r&&"movement"!==t&&(useEventListener(i,["touchstart","touchmove"],v,e),
			o&&useEventListener(i,"touchend",reset,e)),s&&"page"===t&&useEventListener(n,"scroll",w,e);}return {x:h,y:m,sourceType:f}
			}(t),l=shallowRef(null!=e?e:null==o?void 0:o.document.body),c=shallowRef(0),d=shallowRef(0),p=shallowRef(0),m=shallowRef(0),f=shallowRef(0),g=shallowRef(0),b=shallowRef(true);let stop=()=>{}
			;return o&&(stop=watch([l,n,i],()=>{const e=unrefElement(l);if(!(e&&e instanceof Element))return
			;const{left:t,top:s,width:u,height:h}=e.getBoundingClientRect();p.value=t+("page"===a?o.pageXOffset:0),
			m.value=s+("page"===a?o.pageYOffset:0),f.value=h,g.value=u;const v=n.value-p.value,w=i.value-m.value
			;b.value=0===u||0===h||v<0||w<0||v>u||w>h,!r&&b.value||(c.value=v,d.value=w);},{immediate:true}),
			useEventListener(document,"mouseleave",()=>b.value=true,{passive:true})),{x:n,y:i,sourceType:s,elementX:c,elementY:d,
			elementPositionX:p,elementPositionY:m,elementHeight:f,elementWidth:g,isOutside:b,stop:stop}}
			function useTitle(e=null,t={}){var r,o,a
			;const{document:n=mt,restoreOnUnmount:i=e=>e}=t,s=null!=(r=null==n?void 0:n.title)?r:"",l=toRef(null!=(o=null!=e?e:null==n?void 0:n.title)?o:null),c=!(!e||"function"!=typeof e)
			;function format(e){if(!("titleTemplate"in t))return e;const r=t.titleTemplate||"%s"
			;return "function"==typeof r?r(e):toValue(r).replace(/%s/g,e)}return watch(l,(e,t)=>{e!==t&&n&&(n.title=format(null!=e?e:""));},{
			immediate:true
			}),t.observe&&!t.titleTemplate&&n&&!c&&useMutationObserver(null==(a=n.head)?void 0:a.querySelector("title"),()=>{
			n&&n.title!==l.value&&(l.value=format(n.title));},{childList:true}),tryOnScopeDispose(()=>{if(i){const e=i(s,l.value||"")
			;null!=e&&n&&(n.title=e);}}),l}function useVModel(e,t,r,o={}){var a,n,i
			;const{clone:s=false,passive:l=false,eventName:c,deep:u=false,defaultValue:p,shouldEmit:m}=o,f=getCurrentInstance(),b=r||(null==f?void 0:f.emit)||(null==(a=null==f?void 0:f.$emit)?void 0:a.bind(f))||(null==(i=null==(n=null==f?void 0:f.proxy)?void 0:n.$emit)?void 0:i.bind(null==f?void 0:f.proxy))
			;let v=c;t||(t="modelValue"),v=v||`update:${t.toString()}`
			;const cloneFn=e=>s?"function"==typeof s?s(e):function cloneFnJSON(e){return JSON.parse(JSON.stringify(e))
			}(e):e,getValue2=()=>void 0!==e[t]?cloneFn(e[t]):p,triggerEmit=e=>{m?m(e)&&b(v,e):b(v,e);};if(l){
			const r=getValue2(),o=ref(r);let a=false;return watch(()=>e[t],e=>{a||(a=true,o.value=cloneFn(e),nextTick(()=>a=false));}),watch(o,r=>{
			a||r===e[t]&&!u||triggerEmit(r);},{deep:u}),o}return computed({get:()=>getValue2(),set(e){triggerEmit(e);}})}
			function useVModels(e,t,r={}){const o={};for(const a in e)o[a]=useVModel(e,a,t,r);return o}
			const _t="material-symbols:star",Et="material-symbols:star-outline",Ct="material-symbols:order-play-rounded",St="material-symbols:close-rounded",It="material-symbols:skip-previous-rounded",Tt="material-symbols:skip-next-rounded",At=defineComponent({
			__name:"index",props:{type:{default:"error"},retryable:{type:Boolean,default:false},message:{default:void 0},retryText:{
			default:"重试"},noPadding:{type:Boolean,default:false},size:{default:"medium"},icon:{
			default:"line-md:alert-circle-twotone-loop"},fold:{type:Boolean}},emits:["retry"],setup(e){
			const t=e,r=computed(()=>t.icon),o=computed(()=>({
			container:["flex flex-col items-center justify-center text-base-content/70","mini"===t.size?"gap-1":"gap-2",!t.noPadding&&"mini"!==t.size&&"p-2","animate-in fade-in duration-300"],
			icon:[`text-${t.type}`,{mini:"text-2xl",small:"text-3xl",medium:"text-5xl",large:"text-6xl"}[t.size]],
			text:["text-center m-0 select-text font-medium",{mini:"text-xs",small:"text-sm",medium:"text-base",large:"text-lg"
			}[t.size]],detailButton:["btn btn-error btn-xs"],
			retryButton:["btn btn-error btn-sm transition-all duration-200","hover:btn-error hover:scale-105 active:scale-95"]}))
			;function handleShowDetail(){const e=function handleDetail(e){
			return e instanceof Error?`[Error name]: ${e.name}\n[Error message]: ${e.message}\n[Error stack]: ${e.stack}`:e
			}(t.message),{copy:r}=useClipboard();r(e),alert(e),alert("已将错误信息复制到剪贴板");}return (e,a)=>(openBlock(),createElementBlock("div",{
			class:normalizeClass(o.value.container)},[createVNode(unref(ct),{icon:r.value,class:normalizeClass(o.value.icon)},null,8,["icon","class"]),createElementVNode("p",{
			class:normalizeClass(o.value.text)
			},[renderSlot(e.$slots,"default",{},()=>[createTextVNode(toDisplayString(e.message||unref(pe).UNKNOWN_ERROR),1)])],2),t.message instanceof Error?(openBlock(),
			createElementBlock("button",{key:0,class:normalizeClass(o.value.detailButton),onClick:handleShowDetail}," 查看错误 ",2)):createCommentVNode("",true),t.retryable?(openBlock(),
			createElementBlock("button",{key:1,class:normalizeClass(o.value.retryButton),onClick:a[0]||(a[0]=t=>e.$emit("retry"))
			},toDisplayString(t.retryText),3)):createCommentVNode("",true)],2))}}); exports({ _: _t, k: Et, C: Ct, l: St, I: It, T: Tt, A: At });new class ImageCache extends CacheCore{constructor(){super({
			storeName:"image_cache"});}};let Lt=class Logger{constructor(e,t){__publicField(this,"appName"),
			__publicField(this,"moduleName"),this.appName=e,this.moduleName=t;}log(e,...t){0===t.length||"string"==typeof t[0]||t[0];}
			error(e,t){}formatMessage(e,...t){
			return [`%c${this.appName}%c ${this.moduleName}%c ${e}%c ${t}`,"color: #409EFF; font-weight: bold","color: #67C23A; font-weight: bold","color: #E6A23C; font-weight: bold","color: inherit; margin-top: 4px"]
			}};class AppLogger extends Lt{constructor(e){super("115Master",e);}}const log=(...e)=>{},warn=(...e)=>{},error=(...e)=>{}
; exports({ D: log, w: warn, f: error });			const Pt=exports("P", new class QualityPreferenceCache extends CacheCore{constructor(){super({storeName:"quality_preference_cache"
			}),
			__publicField(this,"logger",new AppLogger("Utils QualityPreferenceCache")),__publicField(this,"CACHE_PREFIX","115master_quality_preference_"),
			__publicField(this,"DEFAULT_EXPIRES_IN",Number.POSITIVE_INFINITY);}async getPreference(e){try{
			const t=this.CACHE_PREFIX+e,r=await this.get(t);if(!r)return this.logger.log("getPreference",`画质偏好缓存未找到: ${e}`),null
			;return Date.now()-r.createdAt>this.DEFAULT_EXPIRES_IN?(this.logger.log("getPreference",`画质偏好缓存已过期: ${e}`),
			await this.remove(t),null):(this.logger.log("getPreference",`画质偏好缓存命中: ${e}，画质: ${r.value.quality}`),r.value)}catch(t){
			return this.logger.error("获取画质偏好失败:",t),null}}async setPreference(e,t,r){try{const o=this.CACHE_PREFIX+e,a={quality:t,
			displayQuality:r,updatedAt:Date.now()};await this.set(o,a),this.logger.log("setPreference",`画质偏好已保存: ${e}，画质: ${t}`);
			}catch(o){this.logger.error("保存画质偏好失败:",o);}}async removePreference(e){try{const t=this.CACHE_PREFIX+e
			;await this.remove(t),this.logger.log("removePreference",`画质偏好已删除: ${e}`);}catch(t){this.logger.error("删除画质偏好失败:",t);}}
			async cleanExpired(){try{const e=Date.now(),t=await this.storage.keys()
			;for(const r of t)if(r.startsWith(this.CACHE_PREFIX)){const t=await this.storage.getItem(r)
			;t&&t.createdAt&&e-t.createdAt>this.DEFAULT_EXPIRES_IN&&(await this.remove(r),
			this.logger.log("cleanExpired",`已清理过期画质偏好: ${r}`));}}catch(e){this.logger.error("清理过期画质偏好失败:",e);}}}
);			const Nt=exports("N", new class TransformPreferenceCache extends CacheCore{constructor(){super({
			storeName:"transform_preference_cache",enableQuotaManagement:true
			}),__publicField(this,"logger",new AppLogger("Utils TransformPreferenceCache")),
			__publicField(this,"CACHE_PREFIX","115master_transform_preference_"),
			__publicField(this,"DEFAULT_EXPIRES_IN",Number.POSITIVE_INFINITY);}async getPreference(e){try{
			const t=this.CACHE_PREFIX+e,r=await this.get(t);if(!r)return this.logger.log("getPreference",`旋转翻转偏好缓存未找到: ${e}`),null
			;return Date.now()-r.createdAt>this.DEFAULT_EXPIRES_IN?(this.logger.log("getPreference",`旋转翻转偏好缓存已过期: ${e}`),
			await this.remove(t),
			null):(this.logger.log("getPreference",`旋转翻转偏好缓存命中: ${e}，旋转: ${r.value.rotate}°，水平翻转: ${r.value.flipX}，垂直翻转: ${r.value.flipY}`),
			r.value)}catch(t){return this.logger.error("获取旋转翻转偏好失败:",t),null}}async setPreference(e,t,r,o){try{
			const a=this.CACHE_PREFIX+e,n={rotate:t,flipX:r,flipY:o,createdAt:Date.now()};await this.set(a,n),
			this.logger.log("setPreference",`旋转翻转偏好已保存: ${e}，旋转: ${t}°，水平翻转: ${r}，垂直翻转: ${o}`);}catch(a){
			this.logger.error("保存旋转翻转偏好失败:",a);}}async removePreference(e){try{const t=this.CACHE_PREFIX+e;await this.remove(t),
			this.logger.log("removePreference",`旋转翻转偏好已删除: ${e}`);}catch(t){this.logger.error("删除旋转翻转偏好失败:",t);}}async cleanExpired(){
			try{const e=Date.now(),t=await this.storage.keys();for(const r of t)if(r.startsWith(this.CACHE_PREFIX)){
			const t=await this.storage.getItem(r);t&&t.createdAt&&e-t.createdAt>this.DEFAULT_EXPIRES_IN&&(await this.remove(r),
			this.logger.log("cleanExpired",`已清理过期旋转翻转偏好: ${r}`));}}catch(e){this.logger.error("清理过期旋转翻转偏好失败:",e);}}}
);			const Mt=new class VideoCoverCache extends CacheCore{constructor(){super({storeName:"video_cover_cache_v1"});}}
			;function promiseDelay(e){return new Promise(t=>setTimeout(t,e))}class FetchIO{async fetchBufferRange(e,t,r){
			return fetch(e,{method:"GET",headers:{Range:`bytes=${t}-${r}`},priority:"low"})}async streamChunks(e,t,r={}){
			const o=r.stepChunkSize||385024;let a=0,n=true;try{for(;n;){const r=await this.fetchBufferRange(e,a,a+o-1)
			;if(206!==r.status){n=!1;break}n=await t(await r.arrayBuffer(),a),a+=o;}}catch(i){throw i}}}class HlsIO{constructor(){
			__publicField(this,"info"),__publicField(this,"segmentIndex",0),__publicField(this,"segments",[]),
			__publicField(this,"duration",0);}get segment(){return this.segments[this.segmentIndex]}get segmentUrl(){
			if(!this.info)throw new Error("info is undefined");return new URL(this.segment.uri,this.info.url).href}async open(e){
			this.info=e,await this.fetchMasterPlaylist();}async read(e){var t
			;const r=await fetch(this.segments[this.segmentIndex].uri,{headers:{Range:`bytes=${e.start}-${e.end}`},
			...(null==(t=this.info)?void 0:t.fetchOptions)??{}});return await r.arrayBuffer()}async seek(e){
			if(this.segmentIndex=this.segments.findIndex(t=>t.timestamp<=e&&e<=t.timestamp+t.duration),
			-1===this.segmentIndex)throw new Error("时间超出范围");return this.segment}destroy(){this.segments=[],this.segmentIndex=0,
			this.duration=0,this.info=void 0;}async fetchMasterPlaylist(){if(!this.info)throw new Error("info is undefined")
			;const e=await fetch(this.info.url,{headers:this.info.headers}),t=await e.text(),r=new Parser;r.push(t),r.end();let o=0
			;this.segments=r.manifest.segments.map(e=>{var t;const r=o;return o+=e.duration,{...e,duration:e.duration,timestamp:r,
			url:new URL(e.uri,null==(t=this.info)?void 0:t.url).href}}),this.duration=o;}}var Ot,zt;(zt=Ot||(Ot={})).ERROR="ERROR",
			zt.INFO="INFO",zt.DATA="DATA",zt.DEMUX_DATA="DEMUX_DATA",zt.DONE="DONE"
			;var Rt=Object.create||function objectCreatePolyfill(e){var F=function(){};return F.prototype=e,new F
			},Dt=Object.keys||function objectKeysPolyfill(e){for(var t in e)Object.prototype.hasOwnProperty.call(e,t);return t
			},Ft=Function.prototype.bind||function functionBindPolyfill(e){var t=this;return function(){return t.apply(e,arguments)}
			};let $t=10;const jt=class _EventEmitter{constructor(){__publicField(this,"_maxListeners"),
			__publicField(this,"_eventsCount"),
			__publicField(this,"_events"),this._events&&Object.prototype.hasOwnProperty.call(this,"_events")||(this._events=Rt(null),
			this._eventsCount=0),this._maxListeners=this._maxListeners||void 0;}static listenerCount(e,t){
			return "function"==typeof e.listenerCount?e.listenerCount(t):listenerCount.call(e,t)}emit(e,...t){
			var r,o,a,n,i,s,l="error"===e;if(s=this._events)l=l&&null==s.error;else if(!l)return  false;if(l){
			if(arguments.length>1&&(r=arguments[1]),r instanceof Error)throw r;var c=new Error('Unhandled "error" event. ('+r+")")
			;throw c.context=r,c}if(!(o=s[e]))return  false;var d="function"==typeof o;switch(a=arguments.length){case 1:
			!function emitNone(e,t,r){if(t)e.call(r);else for(var o=e.length,a=arrayClone(e,o),n=0;n<o;++n)try{a[n].call(r);
			}catch(Mo){}}(o,d,this);break;case 2:!function emitOne(e,t,r,o){
			if(t)e.call(r,o);else for(var a=e.length,n=arrayClone(e,a),i=0;i<a;++i)try{n[i].call(r,o);}catch(Mo){}
			}(o,d,this,arguments[1]);break;case 3:!function emitTwo(e,t,r,o,a){
			if(t)e.call(r,o,a);else for(var n=e.length,i=arrayClone(e,n),s=0;s<n;++s)try{i[s].call(r,o,a);}catch(Mo){}
			}(o,d,this,arguments[1],arguments[2]);break;case 4:!function emitThree(e,t,r,o,a,n){
			if(t)e.call(r,o,a,n);else for(var i=e.length,s=arrayClone(e,i),l=0;l<i;++l)try{s[l].call(r,o,a,n);}catch(Mo){}
			}(o,d,this,arguments[1],arguments[2],arguments[3]);break;default:for(n=new Array(a-1),i=1;i<a;i++)n[i-1]=arguments[i]
			;!function emitMany(e,t,r,o){if(t)e.apply(r,o);else for(var a=e.length,n=arrayClone(e,a),i=0;i<a;++i)try{n[i].apply(r,o);
			}catch(Mo){}}(o,d,this,n);}return  true}on(e,t){return function _addListener(e,t,r){var o,a,n
			;if("function"!=typeof r)throw new TypeError('"listener" argument must be a function')
			;(a=e._events)?(a.newListener&&(e.emit("newListener",t,r.listener?r.listener:r),a=e._events),
			n=a[t]):(a=e._events=Rt(null),e._eventsCount=0);if(n){if("function"==typeof n?n=a[t]=[n,r]:n.push(r),
			!n.warned&&(o=function $getMaxListeners(e){return void 0===e._maxListeners?Ut.defaultMaxListeners:e._maxListeners
			}(e))&&o>0&&n.length>o){n.warned=true;class CustomError extends Error{constructor(){super(...arguments),
			__publicField(this,"emitter"),__publicField(this,"type"),__publicField(this,"count");}}
			let r=new CustomError("Possible Dispatcher memory leak detected. "+n.length+' "'+String(t)+'" listeners added. Use emitter.setMaxListeners() to increase limit.')
			;r.name="MaxListenersExceededWarning",r.emitter=e,r.type=t,r.count=n.length;}
			}else n=a[t]=r,++e._eventsCount;return e}(this,e,t)}once(e,t){
			if("function"!=typeof t)throw new TypeError('"listener" argument must be a function')
			;return this.on(e,function _onceWrap(e,t,r){var o={fired:false,wrapFn:void 0,target:e,type:t,listener:r
			},a=Ft.call(onceWrapper,o);return a.listener=r,o.wrapFn=a,a}(this,e,t)),this}off(e,t){
			return _removeListener.call(this,e,t)}removeAllListeners(e){var t,r,o;if(!(r=this._events))return this
			;if(!r.off)return 0===arguments.length?(this._events=Rt(null),
			this._eventsCount=0):r[e]&&(0===--this._eventsCount?this._events=Rt(null):delete r[e]),this;if(0===arguments.length){
			var a,n=Dt(r);for(o=0;o<n.length;++o)"off"!==(a=n[o])&&this.removeAllListeners(a);return this.removeAllListeners("off"),
			this._events=Rt(null),this._eventsCount=0,this}
			if("function"==typeof(t=r[e]))this.off(e,t);else if(t)for(o=t.length-1;o>=0;o--)this.off(e,t[o]);return this}
			listeners(e){return _listeners(this,e,true)}rawListeners(e){return _listeners(this,e,false)}listenerCount(){
			return _EventEmitter.listenerCount.apply(this,arguments)}};__publicField(jt,"defaultMaxListeners");let Bt,Ut=jt;try{
			var Vt={};Object.defineProperty&&Object.defineProperty(Vt,"x",{value:0}),Bt=0===Vt.x;}catch(Oo){Bt=false;}
			function _removeListener(e,t){var r,o,a,n,i
			;if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');if(!(o=this._events))return this
			;if(!(r=o[e]))return this;if(r===t||r.listener===t)0===--this._eventsCount?this._events=Rt(null):(delete o[e],
			o.off&&this.emit("off",e,r.listener||t));else if("function"!=typeof r){for(a=-1,
			n=r.length-1;n>=0;n--)if(r[n]===t||r[n].listener===t){i=r[n].listener,a=n;break}if(a<0)return this
			;0===a?r.shift():function spliceOne(e,t){for(var r=t,o=r+1,a=e.length;o<a;r+=1,o+=1)e[r]=e[o];e.pop();}(r,a),
			1===r.length&&(o[e]=r[0]),o.off&&this.emit("off",e,i||t);}return this}function onceWrapper(){
			if(!this.fired)switch(this.target.off(this.type,this.wrapFn),this.fired=true,arguments.length){case 0:
			return this.listener.call(this.target);case 1:return this.listener.call(this.target,arguments[0]);case 2:
			return this.listener.call(this.target,arguments[0],arguments[1]);case 3:
			return this.listener.call(this.target,arguments[0],arguments[1],arguments[2]);default:
			for(var e=new Array(arguments.length),t=0;t<e.length;++t)e[t]=arguments[t];this.listener.apply(this.target,e);}}
			function _listeners(e,t,r){var o=e._events;if(!o)return [];var a=o[t]
			;return a?"function"==typeof a?r?[a.listener||a]:[a]:r?function unwrapListeners(e){
			for(var t=new Array(e.length),r=0;r<t.length;++r)t[r]=e[r].listener||e[r];return t}(a):arrayClone(a,a.length):[]}
			function listenerCount(e){var t=this._events;if(t){var r=t[e];if("function"==typeof r)return 1;if(r)return r.length}
			return 0}function arrayClone(e,t){for(var r=new Array(t),o=0;o<t;++o)r[o]=e[o];return r}
			Bt?Object.defineProperty(Ut,"defaultMaxListeners",{enumerable:true,get:function(){return $t},set:function(e){
			if("number"!=typeof e||e<0||e!=e)throw new TypeError('"defaultMaxListeners" must be a positive number');$t=e;}
			}):Ut.defaultMaxListeners=$t;class Context extends Ut{}var qt=Object.prototype.toString;function isObjectLike(e){
			return !!e&&"object"==typeof e}function isNumber(e){return "number"==typeof e&&!isNaN(e)}function isArrayBuffer(e){
			return isObjectLike(e)&&"[object arraybuffer]"===qt.call(e).toLowerCase()}class CacheBuffer{constructor(){
			__publicField(this,"byteLength_"),__publicField(this,"list_",[]);}get byteLength(){if(!isNumber(this.byteLength_)){
			let e=0;for(let t,r=0;r<this.list_.length;r++)t=this.list_[r],e+=t.byteLength;this.byteLength_=e;}return this.byteLength_
			}get bytes(){const{bufferList:e}=this;let t=null;return e.length>0&&(t=0===e.length?e[0]:this.toNewBytes()),t}
			get empty(){return 0===this.list_.length}get bufferList(){return this.list_}clear(){let e=this.list_.length
			;e>0&&this.list_.splice(0,e),this.byteLength_=null;}toNewBytes(){let e=null,t=0;for(;null===e;)try{t++,
			e=new Uint8Array(this.byteLength);}catch(Mo){if(t>50)throw Mo}for(let r=0,o=0;r<this.list_.length;r++){
			let t=this.list_[r];e.set(t,o),o+=t.byteLength;}return e}append(e){
			e instanceof CacheBuffer?this.list_=this.list_.concat(e.bufferList):this.list_.push(e),this.byteLength_=null;}
			cut(e,t=true){let r=null;if(e>0&&!this.empty){let o=this.list_,a=0,n=0;for(;o.length>0;){let i=o.shift();if(0!==n){
			let n=e-a;if(i.byteLength>=n){t&&r.set(i.subarray(0,n),a),i=i.subarray(n),i.byteLength>0&&o.unshift(i);break}
			t&&r.set(i,a),a+=i.byteLength;break}if(i.byteLength>=e){t&&(r=i.subarray(0,e)),i.byteLength>e&&(i=i.subarray(e),
			o.unshift(i));break}if(t){try{r=new Uint8Array(e);}catch(Mo){throw `alloc_memory_error@ cache buffer: ${e} ${Mo.message}`}
			r.set(i,0);}a+=i.byteLength,n++;}this.byteLength_=null;}return r}}class MultiMap{constructor(){__publicField(this,"map_"),
			this.map_={};}push(e,t){Object.prototype.hasOwnProperty.call(this.map_,e)?this.map_[e].push(t):this.map_[e]=[t];}get(e){
			let t=this.map_[e];return t?t.slice():null}getAll(){let e=[];for(let t in this.map_)e.push.apply(e,this.map_[t])
			;return e}remove(e,t){let r=this.map_[e];if(r)for(let o=0;o<r.length;++o)r[o]==t&&(r.splice(o,1),--o);}clear(){
			this.map_={};}forEach(e){for(let t in this.map_)e(t,this.map_[t]);}}class Binding_{constructor(e,t,r){
			__publicField(this,"target"),__publicField(this,"type"),__publicField(this,"listener"),this.target=e,this.type=t,
			this.listener=r,this.target.addEventListener?this.target.addEventListener(t,r,false):this.target.on&&this.target.on(t,r,false);
			}off(){
			this.target.removeEventListener?this.target.removeEventListener(this.type,this.listener,false):this.target.off&&this.target.off(this.type,this.listener,false),
			this.target=null,this.listener=null;}}class EventManager{constructor(){__publicField(this,"bindingMap_"),
			this.bindingMap_=new MultiMap;}destroy(){this.removeAll(),this.bindingMap_=null;}on(e,t,r){if(!this.bindingMap_)return
			;let o=new Binding_(e,t,r);return this.bindingMap_.push(t,o),this}once(e,t,r){this.on(e,t,function(o){this.off(e,t),r(o);
			}.bind(this));}off(e,t){if(!this.bindingMap_)return;let r=this.bindingMap_.get(t)||[];for(let o=0;o<r.length;++o){
			let a=r[o];a.target==e&&(a.off(),this.bindingMap_.remove(t,a));}}removeAll(){if(!this.bindingMap_)return
			;let e=this.bindingMap_.getAll();for(let t=0;t<e.length;++t)e[t].off();this.bindingMap_.clear();}}let Gt
			;Gt="undefined"==typeof window?self:window;let Ht=Gt.console
			;const Qt="undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope&&"undefined"!=typeof importScripts,Wt=">>>"
			;let Yt=new class Logger2 extends Ut{constructor(){super(),__publicField(this,"MSG_NAME"),__publicField(this,"_enable"),
			this._enable=false;}get enable(){return this._enable}set enable(e){this._enable=e,this.MSG_NAME="__log__";}log(...e){
			Qt?Yt.emit(this.MSG_NAME,"log",[...e].join("")):this._enable&&Ht.log.call(Ht,Wt,...e);}debug(...e){
			Qt?Yt.emit(this.MSG_NAME,"debug",[...e].join("")):this._enable&&Ht.debug&&Ht.debug.call(Ht,Wt,...e);}assert(...e){
			if(this._enable&&Ht.assert){let t=e[0],r=Array.prototype.slice.call(e,1);r.unshift(Wt),Ht.assert.call(Ht,t,...r);}}
			warn(...e){Qt?Yt.emit(this.MSG_NAME,"warn",[...e].join("")):this._enable&&Ht.warn.call(Ht,Wt,...e);}error(...e){
			Qt?Yt.emit(this.MSG_NAME,"error",[...e].join("")):this._enable&&Ht.error.call(Ht,Wt,...e);}};class Stream extends Ut{
			constructor(){super();}pipe(e){return this.on("reset",function(){e.reset();}),this.on("data",function(t){e.push(t);}),
			this.on("done",function(t){e.flush(t);}),e}unpipe(){return this.removeAllListeners("reset"),
			this.removeAllListeners("data"),this.removeAllListeners("done"),this}push(e,t){this.emit("data",e);}flush(e){
			this.emit("done",e);}reset(){this.emit("reset");}}class DemuxFacade extends Stream{constructor(e={}){super(),
			__publicField(this,"eventManager_"),__publicField(this,"ctx_"),__publicField(this,"options_"),
			__publicField(this,"cache_buffer_"),e.debug&&(Yt.enable=true),this.ctx_=new Context,this.options_=e,
			this.cache_buffer_=new CacheBuffer;}listenEndStream_(){this.eventManager_=new EventManager,
			this.eventManager_.on(this.endStream,"data",e=>{this.emit(Ot.DEMUX_DATA,e);}).on(this.endStream,"done",e=>{
			this.emit(Ot.DONE,e);}).on(this.ctx_,"error",e=>{this.emit(Ot.ERROR,e);});}constraintPushData_(e){let t=null
			;return isArrayBuffer(e)||function isUint8Array(e){
			return isObjectLike(e)&&"[object uint8array]"===qt.call(e).toLowerCase()}(e)?(t=isArrayBuffer(e)?new Uint8Array(e):e,
			t):(Yt.error(`Data pushed is not an ArrayBuffer or Uint8Array: ${e}`),t)}reset(){}destroy(){this.unpipe(),
			this.endStream.unpipe(),this.eventManager_.removeAll();}}var Xt,Kt
			;(Kt=Xt||(Xt={}))[Kt.WORKER_EXCEPTION=0]="WORKER_EXCEPTION",Kt[Kt.WORKER_MSG_EXCEPTION=1]="WORKER_MSG_EXCEPTION",
			Kt[Kt.TS_SYNC_BYTE=2]="TS_SYNC_BYTE",Kt[Kt.FLV_HEAD_SIGNATURE=3]="FLV_HEAD_SIGNATURE",
			Kt[Kt.FLV_NOT_EXPECTED_ADJACENT_DATA=4]="FLV_NOT_EXPECTED_ADJACENT_DATA";var Jt=Xt;class PATSection{constructor(e){
			__publicField(this,"pmtTable");var t,r=0,o=((15&e[1])<<8|e[2])-4-5
			;for(this.pmtTable=[];r<o;r+=4)if(0==(t=e[r+8]<<8|e[r+9])){let t=(31&e[10+r])<<8|e[11+r]
			;Yt.log("packet->network_PID %0x /n/n",t);}else this.pmtTable.push({programNum:t,program_map_PID:(31&e[10+r])<<8|e[11+r]
			});}}class PMTSection{constructor(e){__publicField(this,"pes_table");let t=(15&e[1])<<8|e[2];const r=(15&e[10])<<8|e[11]
			;if(r<0)return;if(r>2){let t=0;for(;t<r;){t+=e[13+t];}}var o=12+r,a=t-r-9-4,n=o+a
			;if(o>=n)return void Yt.warn(`es_section_pos < es_section_end ${o}, ${n}`);this.pes_table=[];let i=0;for(;i<a;){
			let t=o+i,r=e[t],a=8191&(e[t+1]<<8|e[t+2]),n=4095&(e[t+3]<<8|e[t+4]);this.pes_table.push({streamType:r,PID:a}),i+=n+5;}}}
			class PSI{constructor(){__publicField(this,"pat_table"),__publicField(this,"pes_streams"),this.pat_table=[],
			this.pes_streams=[];}get currentProgramPID(){let e=[]
			;for(let t=0;t<this.pat_table.length;t++)e.push(this.pat_table[t].pid);return e.length>0?e[0]:-1}get tracks(){
			return this.pes_streams}reset(){
			this.pat_table.splice(0,this.pat_table.length),this.pes_streams.splice(0,this.pes_streams.length);}parse(e){
			0===e.PID?this._parsePat(e):1===e.PID||2===e.PID||3<=e.PID&&e.PID<=15||17===e.PID||e.PID===this.currentProgramPID&&this._parsePmt(e);
			}findTrack(e){let t=null,r=this.pes_streams;for(let o=0;o<r.length;o++)if(r[o].id===e){t=r[o];break}return t}
			_parsePat(e){let t;if(e.payload_unit_start_indicator){let r=e.payload[0];t=e.payload.subarray(r+1);}else t=e.payload
			;let r=new PATSection(t)
			;for(var o=0;o<r.pmtTable.length;o++)this._add_pid_to_pmt(r.pmtTable[o].programNum,r.pmtTable[o].program_map_PID)
			;return r}_add_pid_to_pmt(e,t){let r=this.pat_table;(function get_pmt(e){for(let t,o=0;o<r.length;o++)if(t=r[o],
			t.id===e)return {idx:o,item:t};return null})(e)||r.push({id:e,pid:t});}_parsePmt(e){let t
			;if(e.payload_unit_start_indicator){let r=e.payload[0];t=e.payload.subarray(r+1);}else t=e.payload
			;let r=new PMTSection(t);for(var o=0;o<r.pes_table.length;o++)this._add_pes_stream(r.pes_table[o]);return r}
			_add_pes_stream(e){let t=this.pes_streams;(function get_program(e){for(let r,o=0;o<t.length;o++)if(r=t[o],
			r.id===e)return {idx:o,item:r};return null})(e.PID)||t.push({id:e.PID,stream_type:e.streamType,duration:0,sps:[],pps:[],
			pixelRatio:[1,1],timescale:9e4,width:0,height:0});}}class M2TSComplexStream extends Stream{constructor(e,t){super(),
			this.context=e,this.PSI=t,this.videoTrack=null,this.audioTrack=null,this.captionTrack=null;}push(e){let t=e
			;for(let r,o=0;o<t.length;o++)switch(r=t[o],r.type){case "video":this._complexVideo(r);break;case "audio":
			this._complexAudio(r);break;case "caption":this._complexCaption(r);}}flush(){this.emit("done"),this._clearStream();}
			reset(){this._clearStream();}_clearStream(){this.videoTrack=null,this.audioTrack=null,this.captionTrack=null;}
			_complexVideo(e){let t=this.PSI.findTrack(e.trackId);t&&(t.type="video",t.gops=e,t.firstDTS=e[0][0].dts,
			t.firstPTS=e[0][0].pts,t.duration=Number.POSITIVE_INFINITY,this.videoTrack=t,this.emit("data",{
			videoTrack:this.videoTrack}));}_complexAudio(e){let t=this.PSI.findTrack(e.trackId);t&&(t.type="audio",t.frames=e,
			t.firstPTS=t.firstDTS=e[0].dts,t.duration=Number.POSITIVE_INFINITY,this.audioTrack=t,this.emit("data",{
			audioTrack:this.audioTrack}));}_complexCaption(){}}const Zt={mac:false,iphone:false,android:false},er={version:false,CHROME:false,
			SAFARI:false,FIREFOX:false,IE11:false,IE:false,EDGE:false,WECHAT:false};let tr=navigator.userAgent.toLowerCase()
			;var rr=/(edge)\/([\w.]+)/.exec(tr)||/(opr)[/]([\w.]+)/.exec(tr)||/(chrome)[ /]([\w.]+)/.exec(tr)||/(firefox)[ /]([\w.]+)/.exec(tr)||/(iemobile)[/]([\w.]+)/.exec(tr)||/(version)(applewebkit)[ /]([\w.]+).*(safari)[ /]([\w.]+)/.exec(tr)||/(webkit)[ /]([\w.]+).*(version)[ /]([\w.]+).*(safari)[ /]([\w.]+)/.exec(tr)||/(webkit)[ /]([\w.]+)/.exec(tr)||/(opera)(?:.*version|)[ /]([\w.]+)/.exec(tr)||/(msie) ([\w.]+)/.exec(tr)||tr.indexOf("trident")>=0&&/(rv)(?::| )([\w.]+)/.exec(tr)||tr.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(tr)||[],or=/(ipad)/.exec(tr)||/(ipod)/.exec(tr)||/(windows phone)/.exec(tr)||/(iphone)/.exec(tr)||/(kindle)/.exec(tr)||/(silk)/.exec(tr)||/(android)/.exec(tr)||/(win)/.exec(tr)||/(mac)/.exec(tr)||/(linux)/.exec(tr)||/(cros)/.exec(tr)||/(playbook)/.exec(tr)||/(bb)/.exec(tr)||/(blackberry)/.exec(tr)||[],ar={
			version:void 0},nr={browser:rr[5]||rr[3]||rr[1]||"",version:rr[2]||rr[4]||"0",versionNumber:rr[4]||rr[2]||"0",
			platform:or[0]||""};if(nr.browser){ar[nr.browser]=true;let e=nr.versionNumber.split(".");ar.version={
			major:parseInt(nr.versionNumber,10),string:nr.version},e.length>1&&(ar.version.minor=parseInt(e[1],10)),
			e.length>2&&(ar.version.build=parseInt(e[2],10));}er.version=ar.version,er.CHROME=!!ar.chrome,
			er.SAFARI=!!ar.safari&&!er.CHROME,er.FIREFOX=!!ar.firefox,er.IE11=/rv:11/.test(tr),er.IE=!!ar.msie||er.IE11,
			er.EDGE=!!ar.edge,er.WECHAT=/(wechat)|(micromessenger)/.test(tr),Zt.mac=!!nr.platform.mac,
			Zt.iphone=!!nr.platform.iphone,Zt.android=!!nr.platform.android;var ir=er,sr=Zt
			;const lr=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350]
			;const cr=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350];class ADTSCodec extends Ut{
			constructor(){super();}push(e){let t,r,o,a,n,{pts:i,dts:s,payload:l}=e,c=l,d=0,u=0;for(;d+5<c.length;){
			if(255!==c[d]||240!=(246&c[d+1])){d++;continue}if(r=2*(1&~c[d+1]),t=(3&c[d+3])<<11|c[d+4]<<3|(224&c[d+5])>>5,
			a=1024*(1+(3&c[d+6])),n=9e4*a/cr[(60&c[d+2])>>>2],o=d+t,c.byteLength<o)return;let e={pts:i+u*n,dts:s+u*n,sampleCount:a,
			audioObjectType:1+(c[d+2]>>>6&3),channelCount:(1&c[d+2])<<2|(192&c[d+3])>>>6,sampleRate:cr[(60&c[d+2])>>>2],
			samplingFrequencyIndex:(60&c[d+2])>>>2,sampleSize:16,data:c.subarray(d+7+r,o)};if(this.emit("frame",e),
			c.byteLength===o)return c=void 0,void this.emit("done");u++,c=c.subarray(o);}}}class ADTSStream extends Stream{
			constructor(e){super(),__publicField(this,"PSI"),__publicField(this,"trackId"),__publicField(this,"codec"),
			__publicField(this,"frames"),this.PSI=e,this.trackId=null,this.codec=new ADTSCodec,this.codec.on("frame",e=>{
			this.frames.push(e),this.frames.byteLength+=e.data.byteLength,this.frames.trackId=this.trackId;}),this._newFrames();}
			push(e){15===e.stream_type&&(this.trackId=e.pid,this.codec.push({dts:e.pes.DTS,pts:e.pes.PTS,payload:e.pes.data_byte}));}
			flush(){if(this.frames.length>0){
			let e=this.frames.length,t=this.frames[0],r=this.frames[e-1],o=r.sampleRate*r.sampleCount/9e4
			;this.frames.firstDTS=t.dts,this.frames.firstPTS=t.pts,this.frames.duration=1===e?o:o+(r.pts-t.pts),
			this._updateTrackMeta(t),this.emit("data",this.frames),this.reset(),this.emit("done");}}reset(){this.trackId=null,
			this._newFrames();}_newFrames(){this.frames=[],this.frames.type="audio",this.frames.byteLength=0,this.frames.duration=0,
			this.frames.firstDTS=0,this.frames.firstPTS=0;}_updateTrackMeta(e){let t=this.PSI.findTrack(this.trackId),r=((e,t,r)=>{
			let o,a,n=e;if(!(t>lr.length-1))return ir.FIREFOX?t>=6?(e=5,a=new Array(4),o=t-3):(e=2,a=new Array(2),
			o=t):sr.android?(e=2,a=new Array(2),o=t):(e=5,a=new Array(4),t>=6?o=t-3:(1===r&&(e=2,a=new Array(2)),o=t)),a[0]=e<<3,
			a[0]|=(14&t)>>1,a[1]|=(1&t)<<7,a[1]|=r<<3,5===e&&(a[1]|=(14&o)>>1,a[2]=(1&o)<<7,a[2]|=8,a[3]=0),{config:a,
			sampleRate:lr[t],channelCount:r,codec:"mp4a.40."+e,realCodec:"mp4a.40."+n};Yt.error(`invalid sampling index:${t}`);
			})(e.audioObjectType,e.samplingFrequencyIndex,e.channelCount);t.config=r.config,t.sampleRate=r.sampleRate,
			t.inputTimeScale=t.inputTimeScale||t.timescale,t.timescale=r.sampleRate,t.channelCount=r.channelCount,t.codec=r.codec,
			t.realCodec=r.realCodec,t.isAAC=true;}}function read(e){let t=0;return ArrayBuffer.isView(e)&&(t=e.byteOffset,e=e.buffer),
			new DataView(e,t)}class DataViewReader{constructor(){}readUint8(e,t){return read(e).getUint8(t)}readUint16(e,t,r=false){
			return read(e).getUint16(t,r)}readUint32(e,t,r=false){return read(e).getUint32(t,r)}}function readBit(e,t=0,r=1){
			let o=0,a=0,n=0,i="",s=0;for(let l=t;l<t+r;l++)o=Math.floor(l/8),a=7-l%8,s=e[o]>>a&1,i+=s;return n=parseInt(i,2),n}
			function readUEV(e,t=0){let r=[],o=8*e.byteLength,a=false,n=0,i=0,s=0,l="";for(let d=t;d<o;d++)if(n=Math.floor(d/8),
			i=7-d%8,s=e[n]>>i&1,!a){if(0!==s){a=true,t=d;break}r.push(0);}let c=r.length+1;for(let d=t;d<t+c;d++)n=Math.floor(d/8),
			i=7-d%8,s=e[n]>>i&1,l+=s;return {bitLength:r.length+c,value:parseInt(l,2)-1}}var dr={readUEV:readUEV,
			readSEV:function readSEV(e,t=0){let r=readUEV(e,t),o=r.value,a=Math.pow(-1,o+1)*Math.ceil(o/2);return {
			bitLength:r.bitLength,value:a}},readBit:readBit,readByte:function readByte(e,t=0){return readBit(e,t,8)}};let ur=0
			;function scaling_list(e,t){let r,o=8,a=8;for(var n=0;n<t;n++)0!=a&&(r=dr.readUEV(e,ur),ur+=r.bitLength,
			a=(o+r.value+256)%256),o=e[n];}class NALU extends DataViewReader{constructor(e){switch(super(),
			__publicField(this,"forbidden_zero_bit"),__publicField(this,"ref_idc"),__publicField(this,"unit_type"),
			__publicField(this,"data"),__publicField(this,"rawData"),__publicField(this,"sps"),__publicField(this,"pps"),
			__publicField(this,"sei"),__publicField(this,"primary_pic_type"),__publicField(this,"pts"),__publicField(this,"dts"),
			this.forbidden_zero_bit=e[0]>>7,this.ref_idc=e[0]>>5&3,this.unit_type=31&e[0],this.data=function discardEP3B(e){
			let t,r=e.byteLength,o=[],a=1,n=new Uint8Array(0);for(;a<r-2;)0===e[a]&&0===e[a+1]&&3===e[a+2]?(o.push(a+2),a+=2):a++
			;if(0===o.length)return e;t=r-o.length;try{n=new Uint8Array(t);}catch(Mo){throw `epsb alloc mem error ${t}`}let i=0
			;for(a=0;a<t;i++,a++)i===o[0]&&(i++,o.shift()),n[a]=e[i];return n}(e.subarray(1)),this.rawData=e,this.unit_type){case 1:
			case 2:case 3:case 4:case 5:break;case 7:this.sps=function decodeSPS(e){ur=0
			;let t,r,o,a,n,i,s,l=e[0],c=e[1],d=e[2],u=e.subarray(3),p=0,h=[1,1],m=1,f=0,g=true,b=dr.readUEV(u,ur);if(ur+=b.bitLength,
			100==l||110==l||122==l||244==l||44==l||83==l||86==l||118==l||128==l){let e=dr.readUEV(u,ur);ur+=e.bitLength,
			3==e.value&&(ur+=1);let t=dr.readUEV(u,ur);ur+=t.bitLength;let r=dr.readUEV(u,ur);if(ur+=r.bitLength,ur+=1,
			p=dr.readBit(u,ur),ur+=1,p)for(let o=0;o<(3!=e.value?8:12);o++){let e=dr.readBit(u,ur);ur+=1,
			e&&scaling_list(u,o<6?16:64);}}let v=dr.readUEV(u,ur);ur+=v.bitLength;let w=dr.readUEV(u,ur),y=w.value
			;if(ur+=w.bitLength,0===y)t=dr.readUEV(u,ur),ur+=t.bitLength;else if(1===y){ur+=1,r=dr.readSEV(u,ur),ur+=r.bitLength,
			o=dr.readSEV(u,ur),ur+=o.bitLength,a=dr.readUEV(u,ur),ur+=a.bitLength;for(let e,t=0;t<a.value;t++)e=dr.readSEV(u,ur),
			ur+=e.bitLength;}let x=dr.readUEV(u,ur);ur+=x.bitLength,ur+=1;let k=dr.readUEV(u,ur);ur+=k.bitLength
			;let _=dr.readUEV(u,ur);ur+=_.bitLength;let E=dr.readBit(u,ur);ur+=1,E||(ur+=1),ur+=1;let C=dr.readBit(u,ur);ur+=1
			;let S=0,I=0,T=0,A=0;if(C){let e=dr.readUEV(u,ur);ur+=e.bitLength,S=e.value;let t=dr.readUEV(u,ur);ur+=t.bitLength,
			I=t.value;let r=dr.readUEV(u,ur);ur+=r.bitLength,T=r.value;let o=dr.readUEV(u,ur);ur+=o.bitLength,A=o.value;}
			let L=dr.readBit(u,ur);if(ur+=1,L){let e=dr.readBit(u,ur);if(ur+=1,e){const e=dr.readByte(u,ur);switch(ur+=8,e){case 1:
			h=[1,1];break;case 2:h=[12,11];break;case 3:h=[10,11];break;case 4:h=[16,11];break;case 5:h=[40,33];break;case 6:
			h=[24,11];break;case 7:h=[20,11];break;case 8:h=[32,11];break;case 9:h=[80,33];break;case 10:h=[18,11];break;case 11:
			h=[15,11];break;case 12:h=[64,33];break;case 13:h=[160,99];break;case 14:h=[4,3];break;case 15:h=[3,2];break;case 16:
			h=[2,1];break;case 255:{let e=dr.readByte(u,ur);ur+=8;let t=dr.readByte(u,ur);ur+=8;let r=dr.readByte(u,ur);ur+=8
			;let o=dr.readByte(u,ur);ur+=8,h=[e<<8|t,r<<8|o];break}}h&&(m=h[0]/h[1]),255===e&&(ur+=16,ur+=16);}let t=dr.readBit(u,ur)
			;ur+=1,t&&(ur+=1);let r=dr.readBit(u,ur);if(ur+=1,r){n=dr.readBit(u,ur,3),ur+=3,ur+=1;let e=dr.readBit(u,ur);ur+=1,
			e&&(ur+=24);}let o=dr.readBit(u,ur);if(ur+=1,o){let e=dr.readUEV(u,ur);ur+=e.bitLength;let t=dr.readUEV(u,ur)
			;ur+=t.bitLength;}let a=dr.readBit(u,ur);ur+=1,a&&(i=dr.readBit(u,ur,32),ur+=32,s=dr.readBit(u,ur,32),ur+=32,
			g=!!dr.readBit(u,ur),ur+=1,f=s/(2*i));}return {payload:u,profile_idc:l,profile_compatibility:c,level_idc:d,sps_id:b.value,
			log2_max_frame_num_minus4:w.value,pic_order_cnt_type:y,log2_max_pic_order_cnt_lsb_minus4:t?t.value:0,
			width:Math.ceil((16*(k.value+1)-2*S-2*I)*m),height:(2-E)*(_.value+1)*16-2*T-2*A,pixelRatio:h,video_format:n,fps:f,
			fixedFPS:g}}(this.data);break;case 8:this.pps=function decodePPS(e){let t,r,o=0,a=e,n=[],i=0
			;o+=dr.readUEV(a,o).bitLength,o+=dr.readUEV(a,o).bitLength,o+=1,o+=1;let s=dr.readUEV(a,o);if(o+=s.bitLength,s.value>0){
			let e=dr.readUEV(a,o);o+=e.bitLength;let l,c=0;switch(e.value){case 0:for(c=0;c<=e.value;c++)l=dr.readUEV(a,o),
			o+=l.bitLength;break;case 2:for(c=0;c<=e.value;c++)l=dr.readUEV(a,o),o+=l.bitLength,l=dr.readUEV(a,o),o+=l.bitLength
			;break;case 3:case 4:case 5:o+=1,t=dr.readUEV(a,o),o+=t.bitLength;break;case 6:{r=dr.readUEV(a,o),o+=r.bitLength
			;let e=Math.ceil(Math.log2(s.value+1));for(i=0;i<=r.value;i++)n.push(dr.readBit(a,o,e)),o+=e;}}}
			return o+=dr.readUEV(a,o).bitLength,o+=dr.readUEV(a,o).bitLength,o+=1,o+=1,o+=dr.readSEV(a,o).bitLength,
			o+=dr.readSEV(a,o).bitLength,o+=dr.readSEV(a,o).bitLength,o+=1,o+=1,o+=1,{sliceGroupNum:s.value+1}}(this.data);break
			;case 6:this.sei=(this.data,{});break;case 9:this.primary_pic_type=function _decodeAUD(e){return e[0]>>5}(this.data);}}}
			class AVCCodec extends Ut{constructor(){super(...arguments),__publicField(this,"lastState",null),
			__publicField(this,"lastNALu",null),__publicField(this,"lastNALuState",null);}spitNalu_(e,t,r){let o=new NALU(e);o.pts=t,
			o.dts=r,this.lastNALu=o,this.emit("nalu",o);}push(e){const{lastState:t,lastNALuState:r}=this
			;let o=0,a=-1,{pts:n,dts:i,payload:s,naluSizeLength:l}=e;if(l){let e=0,t=0,r=0,o=s.length;do{t=0
			;for(let r=0;r<l;r++)t|=s[e+r]<<8*(l-r-1);e+=l,r=e+t,r>o&&(r=o),this.spitNalu_(s.subarray(e,r),n,i),e=r;}while(e<o)}else {
			let e=s.byteLength-1,l=0;do{if(0!==s[e])break;l++,e--;}while(e>0);l>=3&&(s=s.subarray(0,e+1));const c=s.length;let d=0
			;do{let e=s[o++];if(0!==d)if(1!==d)if(e)if(1===e){
			if(a>=0)this.lastNALuState=d,this.spitNalu_(s.subarray(a,o-1-d),n,i);else {const e=this.lastNALu;if(e){
			t&&o<=4-t&&r&&(e.rawData=e.rawData.subarray(0,e.rawData.byteLength-t));let a=o-d-1;if(a>0){
			Yt.log(`overflow NALU found: ${a}/${n}/${i}`);let t=new CacheBuffer;t.append(e.rawData),t.append(s.subarray(0,a))
			;let r=t.toNewBytes();t.clear(),e.rawData=r;}}}o<c&&(a=o,d=0);}else d=0;else d=3;else d=e?0:2;else d=e?0:1;}while(o<c)
			;a>=0&&d>=0&&(this.lastNALuState=d,this.spitNalu_(s.subarray(a,c),n,i)),this.lastState=d;}this.emit("done");}reset(){
			this.lastState=null,this.lastNALu=null,this.lastNALuState=null;}}function getAVCConfig(e){
			let t="avc1.",r=[e.profile_idc,e.profile_compatibility,e.level_idc];for(let o=0;o<r.length;o++){let e=r[o].toString(16)
			;e.length<2&&(e="0"+e),t+=e;}return {codec:t}}class H264Stream extends Stream{constructor(e){super(),
			__publicField(this,"PSI"),__publicField(this,"trackId"),__publicField(this,"currentFrame"),
			__publicField(this,"prevFrame"),__publicField(this,"codec"),__publicField(this,"gop"),__publicField(this,"gops"),
			this.PSI=e,this.trackId=null,this.currentFrame=[],this.codec=new AVCCodec,this._newGop(),this._newGops(),
			this.codec.on("nalu",e=>{if(7===e.unit_type){let t=this.PSI.findTrack(this.trackId),r=getAVCConfig(e.sps)
			;t.codec=r.codec,t.width=e.sps.width,t.height=e.sps.height,t.profileIdc=e.sps.profile_idc,
			t.profileCompatibility=e.sps.profile_compatibility,t.levelIdc=e.sps.level_idc,t.pixelRatio=e.sps.pixelRatio,
			t.sps=[e.rawData];}else if(8===e.unit_type){this.PSI.findTrack(this.trackId).pps=[e.rawData];}this.emit("nalu",e),
			this._grouping(e);});}push(e){const{stream_type:t,pes:r,pid:o}=e;if(27===t||36===t){this.trackId=o;let e={pts:r.PTS,
			dts:r.DTS,payload:r.data_byte};this.codec.push(e);}}flush(){
			this.currentFrame.length>0&&(this.prevFrame&&(!this.currentFrame.duration||this.currentFrame.duration<=0)&&(this.currentFrame.duration=this.prevFrame.duration||0),
			this._pushFrameIntoGop(),this.currentFrame=[]),this.gop.length>0&&this._pushGopIntoGroup();}reset(){this.codec.reset(),
			this.currentFrame=[],this._newGop(),this._newGops();}_grouping(e){
			9===e.unit_type?(this.currentFrame.length>0&&(this.currentFrame.duration=e.dts-this.currentFrame.dts,
			this.gop.length>0&&this.currentFrame.keyframe&&(this.gop.trackId=this.trackId,this._pushGopIntoGroup()),
			this.currentFrame.keyframe||this.gop.length>0?this._pushFrameIntoGop():Yt.warn("h264 codec drop frame")),
			this.emit("frame",this.currentFrame),this.prevFrame=this.currentFrame,this.currentFrame=[],
			this.currentFrame.keyframe=false,this.currentFrame.byteLength=0,this.currentFrame.naluCount=0,
			this.currentFrame.pts=e.pts/9e4,this.currentFrame.dts=e.dts/9e4):(5===e.unit_type&&(this.currentFrame.keyframe=true),
			this.currentFrame.byteLength+=e.rawData.byteLength,this.currentFrame.naluCount++,this.currentFrame.push(e)),
			this.currentFrame.duration=e.dts-this.currentFrame.dts;}_newGop(){this.gop=[],this.gop.duration=0,this.gop.naluCount=0,
			this.gop.byteLength=0;}_pushFrameIntoGop(){
			this.gop.push(this.currentFrame),this.gop.duration+=this.currentFrame.duration,
			this.gop.byteLength+=this.currentFrame.byteLength,this.gop.naluCount+=this.currentFrame.naluCount;}_newGops(){
			this.gops=[],this.gops.type="video",this.gops.duration=0,this.gops.naluCount=0,this.gops.byteLength=0,
			this.gops.frameLength=0,this.gops.firstDTS=0;}_pushGopIntoGroup(){let e=this.gop[0];this.gops.trackId=this.trackId,
			this.gops.duration+=this.gop.duration,this.gops.byteLength+=this.gop.byteLength,this.gops.naluCount+=this.gop.naluCount,
			this.gops.frameLength+=this.gop.length,this.gops.firstDTS=e.dts,this.gops.firstPTS=e.pts,this.gops.push(this.gop),
			this.emit("data",this.gops),this._newGop(),this._newGops(),this.emit("done");}}class ElementaryStream extends Stream{
			constructor(e,t,r={}){super(),__publicField(this,"context"),__publicField(this,"PSI"),__publicField(this,"options"),
			__publicField(this,"tracks"),__publicField(this,"adtsStream"),__publicField(this,"avcStream"),
			__publicField(this,"streams"),this.context=e,this.PSI=t,this.options=r,this.tracks=[],this.adtsStream=new ADTSStream(t),
			this.avcStream=new H264Stream(t),
			this.streams=[this.adtsStream,this.avcStream],r.decodeCodec&&(this.avcStream.on("data",e=>{let t=r.config.stubTime
			;if(isNumber(t)){let r=(e.firstPTS+e.duration)/9e4
			;if(r<t)return void Yt.warn(`drop avc gop, start/end/stubTime(${e.firstPTS}/${r}/${t})`)}this.tracks.push(e),
			this.emit("data",this.tracks),this.tracks=[],this.adtsStream.flush();}),this.adtsStream.on("data",e=>{
			let t=r.config.stubTime;if(isNumber(t)){let r=(e.firstPTS+e.duration)/9e4
			;if(r<t)return void Yt.warn(`drop adts, start/end/stubTime(${e.firstPTS}/${r}/${t})`)}this.tracks.push(e),
			this.emit("data",this.tracks),this.tracks=[];}));}push(e){const{options:t,adtsStream:r,avcStream:o}=this
			;let{stream_type:a}=e;if(t.decodeCodec)switch(a){case 27:case 36:o.push(e);break;case 15:r.push(e);break;default:
			Yt.warn(`ts elementary encounter unknown stream type ${a}`);}else this.emit("data",e);}flush(){
			let{streams:e,tracks:t}=this;for(let r=0;r<this.streams.length;r++){e[r].flush();}t.length>0&&this.emit("data",t),
			this.emit("done"),t.splice(0,t.length);}reset(){this.tracks=[];for(let e=0;e<this.streams.length;e++){
			this.streams[e].reset();}this.emit("reset");}}class Pes{constructor(e){__publicField(this,"PTS"),
			__publicField(this,"DTS"),__publicField(this,"data_byte");let t=e[7]>>6,r=e[8];this.PTS=0,
			2&~t||(this.PTS=this.calcTimestamp_(e,9)),this.DTS=this.PTS,1&~t||(this.DTS=this.calcTimestamp_(e,14)),
			this.data_byte=e.subarray(9+r);}calcTimestamp_(e,t){
			return 536870912*(14&e[t])+(e[t+1]<<22)+(e[t+2]>>1<<15)+(e[t+3]<<7)+(e[t+4]>>1)}}class PesStream extends Stream{
			constructor(e,t){super(),__publicField(this,"context"),__publicField(this,"PSI"),__publicField(this,"PID"),
			__publicField(this,"cache_buffer"),this.context=e,this.PSI=t,this.PID=null,this.cache_buffer=new CacheBuffer;}push(e){
			const t=this
			;e.PID>31&&e.PID<8191&&(-1==this.PSI.currentProgramPID?t._pushPacket(e):this.PSI.currentProgramPID!==e.PID&&(1===e.payload_unit_start_indicator&&t._assembleOnePES(),
			t._pushPacket(e)));}flush(){this._assembleOnePES(),this.emit("done");}reset(){this._clearCached(),this.emit("reset");}
			_clearCached(){this.PID=null,this.cache_buffer.clear();}_pushPacket(e){let t=this.cache_buffer.empty
			;t&&0===e.payload_unit_start_indicator||(t&&(this.PID=e.PID),this.cache_buffer.append(e.payload));}_assembleOnePES(){
			const e=this;if(!this.cache_buffer.empty){let t;try{t=this.cache_buffer.toNewBytes();}catch(Mo){
			throw `pes alloc mem err ${this.cache_buffer.byteLength}`}let r=new Pes(t),o=this.PSI.findTrack(this.PID);if(o){let t={
			pid:o.id,stream_type:o.stream_type,pes:r};e.emit("data",t);}e._clearCached();}}}class Packet{constructor(e){
			if(__publicField(this,"sync_byte"),__publicField(this,"payload_unit_start_indicator"),__publicField(this,"PID"),
			__publicField(this,"afc"),__publicField(this,"has_payload"),__publicField(this,"has_adaptation"),
			__publicField(this,"payload"),this.sync_byte=e[0],this.payload_unit_start_indicator=e[1]>>6&1,
			this.PID=8191&(e[1]<<8|e[2]),this.afc=e[3]>>4&3,this.has_payload=1&this.afc,this.has_adaptation=2&this.afc,
			this.has_payload)if(this.has_adaptation){let t=e[4];this.payload=e.subarray(5+t);}else this.payload=e.subarray(4);}
			valid(){return 71===this.sync_byte&&1===this.has_payload}}class TSDemux extends DemuxFacade{constructor(e={}){super(e),
			__publicField(this,"psi_"),__publicField(this,"pesStream_"),__publicField(this,"elementaryStream_"),
			__publicField(this,"complexStream_"),this.psi_=new PSI,this.pesStream_=new PesStream(this.ctx_,this.psi_),
			this.elementaryStream_=new ElementaryStream(this.ctx_,this.psi_,e),
			this.complexStream_=new M2TSComplexStream(this.ctx_,this.psi_),this.pipe(this.pesStream_),
			this.pesStream_.pipe(this.elementaryStream_),this.elementaryStream_.pipe(this.complexStream_),super.listenEndStream_();}
			get endStream(){let e=this.elementaryStream_;return this.options_.decodeCodec&&(e=this.complexStream_),e}push(e,t={}){
			const{done:r}=t,{options_:o,ctx_:a,cache_buffer_:n,psi_:i}=this;let s=super.constraintPushData_(e),l=n.byteLength,c=null
			;for(o.config=t,Yt.log(`hls demux received ${s.byteLength} bytes, cache ${l} bytes. ${r?"chunk done":""}`),
			n.append(s);n.byteLength>=188;){let e=n.cut(188);if(e){let t=new Packet(e);if(!t.valid()){
			let r=`Encounter invalid ts packet, packet_length(${e.length}), cache_length(${this.cache_buffer_.byteLength}), has_payload(${t.has_payload}), data(${e})`
			;Yt.error(r),this.reset(),a.emit("error",Jt.TS_SYNC_BYTE,r,{startByte:c,endByte:c+e.byteLength});break}i.parse(t),
			this.emit("data",t),c+=e.byteLength;}}n.empty&&r&&this.emit("done");}reset(){this.cache_buffer_.clear(),this.emit("reset");
			}}var pr,hr,mr,fr,gr,br,vr,wr,yr,xr,kr,_r,Er,Cr;(hr=pr||(pr={}))[hr.HEAD=0]="HEAD",hr[hr.BODY=1]="BODY",
			(fr=mr||(mr={}))[fr.SCRIPT_DATA=18]="SCRIPT_DATA",fr[fr.VIDEO=9]="VIDEO",fr[fr.AUDIO=8]="AUDIO",
			(br=gr||(gr={}))[br.G711A=7]="G711A",br[br.G711U=8]="G711U",br[br.AAC=10]="AAC",br[br.OPUS=13]="OPUS",
			(wr=vr||(vr={}))[wr.MONO=0]="MONO",wr[wr.STEREO=1]="STEREO",(xr=yr||(yr={}))[xr.SEQUENCE_HEAD=0]="SEQUENCE_HEAD",
			xr[xr.AAC_RAW=1]="AAC_RAW",(_r=kr||(kr={}))[_r.SEQUENCE_HEAD=0]="SEQUENCE_HEAD",_r[_r.RAW=1]="RAW",
			(Cr=Er||(Er={}))[Cr.SEQUENCE_HEAD=0]="SEQUENCE_HEAD",Cr[Cr.NALU=1]="NALU",Cr[Cr.SEQUENCE_END=2]="SEQUENCE_END";var Sr,Ir
			;(new AVCCodec).on("nalu",e=>{}),(Ir=Sr||(Sr={}))[Ir.AVC=7]="AVC";const Tr=7;class DemuxerTsNew{constructor(e){
			__publicField(this,"demux"),__publicField(this,"firstOnDataTime",0),__publicField(this,"_onDecodeChunk"),
			__publicField(this,"_onConfig"),this.demux=new TSDemux({debug:false,decodeCodec:true}),
			this.demux.on(Ot.DONE,this._onDeMuxDataDone.bind(this)),
			this.demux.elementaryStream_.avcStream.on("frame",this._onDemuxFrame.bind(this)),this._onDecodeChunk=e.onDecodeChunk,
			this._onConfig=e.onConfig;}push(e,t){if(!this.demux)throw new Error("解复用器未初始化");this.demux.push(new Uint8Array(e),{
			...t||{}});}destroy(){var e;null==(e=this.demux)||e.destroy(),this.demux=void 0;}_onDemuxFrame(e){
			const t=this._createFrameData(e);t&&this._sendVideoFrame(e,t);}_createFrameData(e){try{
			const t=[],r=new Uint8Array([0,0,0,1]);for(let i=0,s=e.length;i<s;i++){const o=e[i]
			;if(!o||!o.rawData||0===o.rawData.byteLength)continue;if(o.unit_type===Tr){const e=getAVCConfig(o.sps);this._onConfig({
			codec:e.codec,width:o.sps.width,height:o.sps.height});}const a=new Uint8Array(r.length+o.rawData.byteLength);a.set(r,0),
			a.set(new Uint8Array(o.rawData),r.length),t.push(a);}if(0===t.length)return null
			;const o=t.reduce((e,t)=>e+t.byteLength,0),a=new Uint8Array(o);let n=0;for(const e of t)a.set(e,n),n+=e.byteLength
			;return a}catch(t){return null}}_sendVideoFrame(e,t){try{if(!t||0===t.byteLength)return;this._onDecodeChunk({avcFrame:e,
			rawData:t});}catch(r){}}_onDeMuxDataDone(){performance.now(),this.firstOnDataTime;}}const Ar={num:1,den:1e6},Lr={num:1,
			den:1};class M3U8ClipperNew{constructor(e){__publicField(this,"hlsIo"),this.options=e,this.hlsIo=new HlsIO;}destroy(){
			this.hlsIo.destroy();}async open(){await this.hlsIo.open(this.options);}async seek(e,t=false){const r=Date.now();let o,a=true
			;const n=await this.hlsIo.seek(e),i=new FetchIO,s=[],l=new VideoDecoder({output:r=>{
			const a=this._getFrameRealTime(r.timestamp);!t||o?a>=e&&!o?o=r:r.close():o=r;},error:()=>{destroy();}
			}),c=new DemuxerTsNew({onConfig:e=>{l.configure({codec:e.codec});},onDecodeChunk:e=>{const t=new EncodedVideoChunk({
			type:e.avcFrame.keyframe?"key":"delta",timestamp:1e6*e.avcFrame.pts,duration:1e6*e.avcFrame.duration,data:e.rawData})
			;s.push(t);},onDone:()=>{l.flush();}}),destroy=()=>{if(a=false,c.destroy(),o){try{o.close();}catch{}o=void 0;}
			"closed"!==l.state&&l.close();};if(t)i.streamChunks(n.url,async e=>!!c.demux&&(c.push(e),await promiseDelay(100),
			!o));else {const e=await i.fetchBufferRange(n.url,0,-1),t=await e.arrayBuffer();c.push(t,{done:true});}for(;a;){
			if(o)return a=false,c.destroy(),"closed"!==l.state&&l.close(),{videoFrame:o,frameTime:this._getFrameRealTime(o.timestamp),
			seekTime:e,consumedTime:Date.now()-r};if(Date.now()-r>5e3)return a=false,void destroy();if(s.length>0){const e=s.shift()
			;e&&(l.decode(e),await l.flush());}else await promiseDelay(0);}}_getFrameRealTime(e){
			return function timebaseConvert(e,t,r){return e*t.num/t.den*r.den/r.num}(e,Ar,Lr)}} exports("M", M3U8ClipperNew);function getImageResize(e,t,r,o){
			let a=e,n=t;return a>n?a>r&&(n=Math.round(n*(r/a)),a=r):n>o&&(a=Math.round(a*(o/n)),n=o),{width:a,height:n}}
			var Pr=(e=>(e.Pending="pending",e.Running="running",e.Paused="paused",e.Cancelled="cancelled",e.Completed="completed",
			e.Failed="failed",e))(Pr||{});class SchedulerError{} exports("i", SchedulerError);__publicField(SchedulerError,"TaskExist",class extends Error{
			constructor(){super("Task Exist");}}),__publicField(SchedulerError,"TaskCancelled",class extends Error{constructor(){
			super("Task Cancelled");}}),__publicField(SchedulerError,"QueueCleared",class extends Error{constructor(){
			super("Queue Cleared");}}),__publicField(SchedulerError,"QueueFull",class extends Error{constructor(){super("Queue Full");
			}}),__publicField(SchedulerError,"TaskTimeout",class extends Error{constructor(){super("Task Timeout");}})
			;class Scheduler{constructor(e={}){__publicField(this,"queue",[]),__publicField(this,"options",{maxConcurrent:3,
			maxQueueLength:1/0,defaultRetryDelay:1e3,laneConfig:{}}),__publicField(this,"running",new Map),
			__publicField(this,"laneRunningCount",new Map),this.options={...this.options,...e},
			Object.keys(this.options.laneConfig).forEach(e=>{this.laneRunningCount.set(e,0);});}get length(){return this.queue.length}
			get runningCount(){return this.running.size}async add(e,t={}){
			if(this.queue.length>=this.options.maxQueueLength)throw new SchedulerError.QueueFull
			;if(t.id&&this.get(t.id))throw new SchedulerError.TaskExist;let r,o;const a={execute:e,promise:new Promise((e,t)=>{r=e,
			o=t;}),priority:t.priority||0,resolve:r,reject:o,timeout:t.timeout,retries:t.retries||0,
			id:t.id||Math.random().toString(36).substr(2,9),lane:t.lane,status:"pending",immediate:t.immediate,action:t.action}
			;return a.lane&&this.isPaused(a.lane)&&(a.status="paused"),"push"===a.action?this.queue.push(a):this.queue.unshift(a),
			this.sort(),a.immediate&&this.processQueue(),a.promise}pause(e){this.running.forEach(t=>{
			e&&t.id!==e&&t.lane!==e||(t.status="paused");}),this.queue.forEach(t=>{e&&t.id!==e&&t.lane!==e||(t.status="paused");});}
			resume(e){this.queue.forEach(t=>{e&&t.id!==e&&t.lane!==e||"paused"!==t.status||(t.status="pending");}),this.sort(),
			this.processQueue();}cancel(e){this.queue=this.queue.filter(t=>t.id!==e&&t.lane!==e||(t.status="cancelled",
			t.reject(new SchedulerError.TaskCancelled),false)),this.running.forEach((t,r)=>{
			t.id!==e&&t.lane!==e||(t.status="cancelled",t.reject(new SchedulerError.TaskCancelled),this.running.delete(r),
			t.lane&&this.decrementLaneRunningCount(t.lane));});}remove(e){
			this.cancel(e),this.queue=this.queue.filter(t=>t.id!==e&&t.lane!==e);}retry(e,t){const r=[];this.queue.forEach(o=>{
			o.id!==e&&o.lane!==e||"failed"!==o.status||(o.retries=t??o.retries,o.status="pending",r.push(o));}),r.forEach(e=>{
			this.queue.push(e);}),this.processQueue();}isPaused(e){return Boolean(this.queue.some(t=>t.lane===e&&"paused"===t.status))
			}isPending(e){return Boolean(this.queue.some(t=>t.lane===e&&"pending"===t.status))}getStatus(){const e={}
			;return this.laneRunningCount.forEach((t,r)=>{var o;e[r]={running:t,
			maxConcurrent:(null==(o=this.options.laneConfig[r])?void 0:o.maxConcurrent)||0};}),{queueLength:this.queue.length,
			runningCount:this.running.size,maxConcurrent:this.options.maxConcurrent,lanes:e,tasks:{
			pending:this.queue.filter(e=>"pending"===e.status).length,running:this.running.size,
			paused:this.queue.filter(e=>"paused"===e.status).length,failed:this.queue.filter(e=>"failed"===e.status).length,
			completed:this.queue.filter(e=>"completed"===e.status).length,
			cancelled:this.queue.filter(e=>"cancelled"===e.status).length}}}get(e){
			return this.queue.find(t=>t.id===e||t.lane===e)??this.running.get(e)}hasRunning(){return this.running.size>0}
			getLaneStatus(e){const t=this.options.laneConfig[e];return {name:e,running:this.getLaneRunningCount(e),
			maxConcurrent:(null==t?void 0:t.maxConcurrent)||0,priority:(null==t?void 0:t.priority)||0,hasConfig:!!t}}
			tryOvertaking(e,t,r){const o=this.get(e)
			;return !!o&&(("pending"===o.status||"running"===o.status||"paused"===o.status)&&(o.lane=t,o.priority=r??o.priority,
			this.sort(),this.processQueue(),true))}tryResume(e){const t=this.get(e);return !!t&&("paused"===t.status&&(this.resume(e),
			true))}setLaneConfig(e,t){const r=this.options.laneConfig[e]||{name:e,priority:0,maxConcurrent:this.options.maxConcurrent}
			;this.options.laneConfig[e]={...r,...t},this.laneRunningCount.has(e)||this.laneRunningCount.set(e,0),this.sort(),
			this.processQueue();}async waitIdle(e=100){this.hasRunning()&&(await new Promise(t=>setTimeout(t,e)),
			await this.waitIdle());}async waitLaneIdle(e,t=100){
			0!==this.getLaneRunningCount(e)&&(await new Promise(e=>setTimeout(e,t)),await this.waitLaneIdle(e,t));}clear(){
			this.queue.forEach(e=>{e.status="cancelled",e.reject(new SchedulerError.QueueCleared);}),this.queue=[],
			this.running.clear(),this.laneRunningCount.clear(),Object.keys(this.options.laneConfig).forEach(e=>{
			this.laneRunningCount.set(e,0);});}incrementLaneRunningCount(e){const t=this.laneRunningCount.get(e)||0
			;this.laneRunningCount.set(e,t+1);}decrementLaneRunningCount(e){const t=this.laneRunningCount.get(e)||0
			;t>0&&this.laneRunningCount.set(e,t-1);}getLaneRunningCount(e){return this.laneRunningCount.get(e)||0}
			canLaneRunMoreTasks(e){const t=this.options.laneConfig[e];if(!t)return  true
			;return this.getLaneRunningCount(e)<t.maxConcurrent}async processQueue(){
			if(this.running.size>=this.options.maxConcurrent)return
			;const e=this.queue.find(e=>"pending"===e.status&&!this.isPaused(e.id)&&!(e.lane&&!this.canLaneRunMoreTasks(e.lane)))
			;if(e){this.running.set(e.id,e),e.status="running",e.lane&&this.incrementLaneRunningCount(e.lane);try{let t
			;const executeWithTimeout=async()=>{if(e.timeout){const r=new Promise((r,o)=>{t=window.setTimeout(()=>{
			o(new SchedulerError.TaskTimeout);},e.timeout);});return Promise.race([e.execute(),r])}return e.execute()
			},r=await this.executeWithRetry(executeWithTimeout,e.retries||0,e);t&&clearTimeout(t),e.status="completed",e.resolve(r);
			}catch(t){e.status="failed",e.reject(t);}finally{
			this.running.delete(e.id),e.lane&&this.decrementLaneRunningCount(e.lane),this.processQueue();}}}
			async executeWithRetry(e,t,r){try{return await e()}catch(o){
			if(t>0&&"cancelled"!==r.status)return await new Promise(e=>setTimeout(e,this.options.defaultRetryDelay)),
			this.executeWithRetry(e,t-1,r);throw o}}sort(){this.queue.sort((e,t)=>{var r,o
			;const a=e.lane&&(null==(r=this.options.laneConfig[e.lane])?void 0:r.priority)||0,n=t.lane&&(null==(o=this.options.laneConfig[t.lane])?void 0:o.priority)||0
			;return a!==n?a-n:e.priority-t.priority});}} exports("S", Scheduler);const Nr=new Scheduler({maxConcurrent:3})
			;const getCacheKey=(e,t)=>`${e}_${t}`;function toDisplayableData(e){return {img:URL.createObjectURL(e.blob),...e}}
			async function getVideoCover(e,t,r){const o=(await Ee.getM3u8(t)).sort((e,t)=>e.quality-t.quality)[0]
			;if(!o)throw new Error("source is null");const a=new M3U8ClipperNew({url:o.url});await a.open();const n=r.map(async t=>{
			const r=getCacheKey(e,t),o=await async function generateVideoCoverRaw(e,t){const r=await e.seek(t,true)
			;if(!r)throw new Error("no clipper result");try{
			const e=getImageResize(r.videoFrame.displayWidth,r.videoFrame.displayHeight,720,720),o=new OffscreenCanvas(e.width,e.height),a=o.getContext("2d")
			;if(!a)throw new Error("no canvas context");const n=await createImageBitmap(r.videoFrame,{resizeQuality:"pixelated",
			resizeWidth:e.width,resizeHeight:e.height});try{a.drawImage(n,0,0,e.width,e.height);return {blob:await o.convertToBlob({
			type:"image/webp",quality:.85}),width:e.width,height:e.height,frameTime:r.frameTime,seekTime:t}}finally{n.close();}
			}finally{r.videoFrame.close();}}(a,t);return Mt.set(r,o),toDisplayableData(o)});return Promise.all(n)}
			function useSmartVideoCover(e,t){const r=reactive({isReady:false,isLoading:false,error:void 0,state:[]
			}),o=function generateTaskId(e){return `cover_${e.sha1}_${e.pickCode}_${e.coverNum}_${e.duration}`
			}(e.value),a=function calculateVideoCoverTimes(e,t){const r=e/5,o=r,a=e-r-o;return Array.from({length:t
			},(e,r)=>Math.floor(o+a/t*r))}(e.value.duration,e.value.coverNum),n=useElementVisibility(t.elementRef,{
			threshold:t.threshold??0,rootMargin:t.rootMargin??"0%",scrollTarget:t.scrollTarget}),getData=async(e,t)=>{
			if(r.isReady||r.error)return;if(!Nr.get(e)){r.isLoading=true;try{
			const o=await((e,t,r,o)=>Nr.add(()=>getVideoCover(t,r,o),{id:e,immediate:!0}))(e,t.sha1,t.pickCode,a);r.state=o,
			r.isReady=!0;}catch(o){if(o instanceof SchedulerError.TaskCancelled)return
			;if(o instanceof Drive115Error.NotFoundM3u8File)return void(r.error=pe.CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING);r.error=o;
			}finally{r.isLoading=false;}}},getDataByCache=async e=>{if(!r.isReady&&!r.error){r.isLoading=true;try{
			const t=await async function getVideoCoversFromCache(e,t){const r=[];for(const o of t){
			const t=getCacheKey(e,o),a=await Mt.get(t);if(!a)return [];const n=a.value;r.push(toDisplayableData(n));}return r
			}(e.sha1,a);t.length>0&&(r.state=t,r.isLoading=!1,r.isReady=!0);}catch(t){r.error=t;}finally{r.isLoading=false;}}
			},{isScrolling:i}=function useScroll(e,t={}){const{throttle:r=0,idle:o=200,onStop:a=noop,onScroll:n=noop,offset:i={
			left:0,right:0,top:0,bottom:0},eventListenerOptions:s={capture:false,passive:true
			},behavior:l="auto",window:c=ht,onError:d=e=>{}}=t,p=shallowRef(0),h=shallowRef(0),m=computed({get:()=>p.value,set(e){scrollTo(e,void 0);}}),f=computed({
			get:()=>h.value,set(e){scrollTo(void 0,e);}});function scrollTo(t,r){var o,a,n,i;if(!c)return;const s=toValue(e);if(!s)return
			;null==(n=s instanceof Document?c.document.body:s)||n.scrollTo({top:null!=(o=toValue(r))?o:f.value,
			left:null!=(a=toValue(t))?a:m.value,behavior:toValue(l)})
			;const d=(null==(i=null==s?void 0:s.document)?void 0:i.documentElement)||(null==s?void 0:s.documentElement)||s
			;null!=m&&(p.value=d.scrollLeft),null!=f&&(h.value=d.scrollTop);}const g=shallowRef(false),b=reactive({left:true,right:false,top:true,bottom:false
			}),v=reactive({left:false,right:false,top:false,bottom:false}),onScrollEnd=e=>{g.value&&(g.value=false,v.left=false,v.right=false,v.top=false,
			v.bottom=false,a(e));},w=useDebounceFn(onScrollEnd,r+o),setArrivedState=e=>{var t;if(!c)return
			;const r=(null==(t=null==e?void 0:e.document)?void 0:t.documentElement)||(null==e?void 0:e.documentElement)||unrefElement(e),{display:o,flexDirection:a,direction:n}=getComputedStyle(r),s="rtl"===n?-1:1,l=r.scrollLeft
			;v.left=l<p.value,v.right=l>p.value
			;const d=Math.abs(l*s)<=(i.left||0),u=Math.abs(l*s)+r.clientWidth>=r.scrollWidth-(i.right||0)-1
			;"flex"===o&&"row-reverse"===a?(b.left=u,b.right=d):(b.left=d,b.right=u),p.value=l;let m=r.scrollTop
			;e!==c.document||m||(m=c.document.body.scrollTop),v.top=m<h.value,v.bottom=m>h.value
			;const f=Math.abs(m)<=(i.top||0),g=Math.abs(m)+r.clientHeight>=r.scrollHeight-(i.bottom||0)-1
			;"flex"===o&&"column-reverse"===a?(b.top=g,b.bottom=f):(b.top=f,b.bottom=g),h.value=m;},onScrollHandler=e=>{var t
			;if(!c)return;const r=null!=(t=e.target.documentElement)?t:e.target;setArrivedState(r),g.value=true,w(e),n(e);}
			;return useEventListener(e,"scroll",r?useThrottleFn(onScrollHandler,r,true,false):onScrollHandler,s),tryOnMounted(()=>{try{
			const t=toValue(e);if(!t)return;setArrivedState(t);}catch(Mo){d(Mo);}}),useEventListener(e,"scrollend",onScrollEnd,s),{x:m,y:f,
			isScrolling:g,arrivedState:b,directions:v,measure(){const t=toValue(e);c&&t&&setArrivedState(t);}}}(t.scrollTarget,{
			throttle:1e3/60,idle:100,onStop:async()=>{n.value&&(await getDataByCache(e.value),getData(o,e.value));}})
			;return watch(n,async t=>{t?i.value?getDataByCache(e.value):(await getDataByCache(e.value),getData(o,e.value)):(()=>{
			const e=Nr.get(o);e&&e.status===Pr.Pending&&Nr.cancel(o);})();}),onUnmounted(()=>{Nr.remove(o),function cleanupBlobUrl(e){
			e.forEach(e=>{e.startsWith("blob:")&&URL.revokeObjectURL(e);});
			}(r.state.map(e=>null==e?void 0:e.img).filter(e=>void 0!==e));}),{videoCover:r}}
			const Mr=["id"],Or=["onClick"],zr=["src","alt"],Rr=defineComponent({__name:"index",props:{pickCode:{},sha1:{},duration:{},
			listScrollBoxNode:{}},setup(e){const t=e,r={container:{main:"w-full max-w-214 px-20 h-24 [content-visibility:auto]",
			content:"relative h-full flex items-center bg-base-300 rounded overflow-hidden"},states:{
			error:"flex items-center justify-center flex-1"},skeleton:"skeleton w-full h-full rounded",cover:{
			container:["w-full h-full flex overflow-hidden select-none overflow-hidden"],
			thumbItem:["h-full aspect-video","overflow-hidden","cursor-zoom-in no-underline","hover:opacity-90 transition-opacity"],
			thumbImage:["h-full w-full object-contain object-center align-top"]}
			},o=ref(),a=ref(null),n=computed(()=>t.listScrollBoxNode),i=computed(()=>({sha1:t.sha1,pickCode:t.pickCode,coverNum:5,
			duration:Number(t.duration)})),s={elementRef:o,scrollTarget:n},{videoCover:l}=useSmartVideoCover(i,s)
			;return watch(()=>l.isReady,async e=>{e&&(await nextTick(),function initPhotoSwipe(){a.value&&(a.value.destroy(),a.value=null),
			a.value=new G({dataSource:l.state.map(e=>({src:e.img,width:e.width,height:e.height,alt:"视频封面"})),
			showHideAnimationType:"fade",pswpModule:()=>Te(()=>module.import('photoswipe'),void 0),mouseMovePan:true,
			initialZoomLevel:"fit",secondaryZoomLevel:2,maxZoomLevel:4,wheelToZoom:true,bgOpacity:.9}),a.value.init();}());}),onBeforeUnmount(()=>{
			a.value&&(a.value.destroy(),a.value=null);}),(e,n)=>(openBlock(),createElementBlock("div",{ref_key:"rootRef",ref:o,class:normalizeClass(r.container.main)
			},[createElementVNode("div",{class:normalizeClass(r.container.content)},[unref(l).error?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(r.states.error)},[createVNode(At,{size:"mini",
			message:unref(l).error},null,8,["message"])],2)):unref(l).isLoading?(openBlock(),createElementBlock("div",{key:1,class:normalizeClass(r.skeleton)
			},null,2)):unref(l).isReady?(openBlock(),createElementBlock("div",{key:2,id:`gallery-${t.pickCode}`,class:normalizeClass(["pswp-gallery",r.cover.container])
			},[(openBlock(true),createElementBlock(Fragment,null,renderList(unref(l).state,(e,t)=>(openBlock(),createElementBlock("a",{key:t,class:normalizeClass([r.cover.thumbItem]),
			onClick:withModifiers(e=>function openPhotoSwipe(e){a.value&&l.isReady&&a.value.loadAndOpen(e);}(t),["prevent","stop"])},[createElementVNode("img",{
			src:e.img,alt:`视频封面 ${t+1}`,class:normalizeClass(r.cover.thumbImage)},null,10,zr)],10,Or))),128))],10,Mr)):createCommentVNode("",true)],2)],2))}})
			;class FileListScrollHistory{constructor(){__publicField(this,"scrollBox",null),
			__publicField(this,"storage",new FileListScrollHistoryStorage),__publicField(this,"handleScroll",throttle(()=>{var e
			;const t=(null==(e=this.scrollBox)?void 0:e.scrollTop)??0;this.save(se.FileMainReInstanceSetting,t);},1e3/60,{leading:true,
			trailing:true}));}clearAll(){this.storage.clear();}destroy(){var e
			;this.clearAll(),null==(e=this.scrollBox)||e.removeEventListener("scroll",this.handleScroll);}setScrollBox(e){
			this.scrollBox&&this.scrollBox.removeEventListener("scroll",this.handleScroll),this.scrollBox=e,
			this.restore(se.FileMainReInstanceSetting,e),this.scrollBox.addEventListener("scroll",this.handleScroll);}save(e,t){
			this.storage.set(e.cid.toString(),Number(e.offset),Number(e.limit),t);}restore(e,t){
			let r=this.storage.get(e.cid.toString(),Number(e.offset),Number(e.limit))
			;return (!r||r<=0)&&(r=this.storage.getNearestPosition(e.cid.toString(),Number(e.offset),Number(e.limit))),
			!!(r&&r>0)&&(t.scrollTo({top:r,behavior:"instant"}),true)}}class FileListScrollHistoryStorage{constructor(){
			__publicField(this,"STORAGE_KEY","115_master_file_list_scroll_history"),
			__publicField(this,"store",window.sessionStorage);}get storeData(){
			return JSON.parse(this.store.getItem(this.STORAGE_KEY)??"{}")}set storeData(e){
			this.store.setItem(this.STORAGE_KEY,JSON.stringify(e));}get(e,t,r){return this.storeData[this.getDataKey(e,t,r)]??0}
			getNearestPosition(e,t,r){const o=this.storeData,a=`${e}-`;let n=0,i=1/0
			;for(const[s,l]of Object.entries(o))if(s.startsWith(a)){const e=s.split("-");if(e.length>=3){
			const o=Number.parseInt(e[1]);if(Number.parseInt(e[2])===r&&"number"==typeof l&&l>0){const e=Math.abs(o-t);e<i&&(i=e,
			n=l);}}}return n>0&&i<=2*r?n:0}set(e,t,r,o){const a=this.storeData;a[this.getDataKey(e,t,r)]=o,this.storeData=a;}clear(){
			this.storeData={};}getDataKey(e,t,r){return `${e}-${t}-${r}`}}
			const Dr=[class FileItemModVideoCover extends FileItemModBase{constructor(){super(...arguments),
			__publicField(this,"ENABLE_KEY_IN_USER_SETTING","enableFilelistPreview"),__publicField(this,"vueApp",null);}onLoad(){
			if(this.itemInfo.fileListType===ce.grid)return;if(this.itemInfo.attributes.iv!==le.Yes)return
			;this.itemNode.classList.add("with-ext-video-cover");const e=document.createElement("div");e.style.width="100%",
			this.itemNode.append(e);const t=e.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=Ce,
			t.appendChild(r);const o=document.createElement("div");o.className="ext-video-cover-root",
			o.setAttribute("data-theme","light"),t.appendChild(o);const a=createApp(Rr,{pickCode:this.itemInfo.attributes.pick_code,
			sha1:this.itemInfo.attributes.sha1,duration:String(this.itemInfo.duration),
			listScrollBoxNode:this.itemInfo.listScrollBoxNode});a.mount(o),this.vueApp=a;}onDestroy(){var e
			;null==(e=this.vueApp)||e.unmount();}},class FileItemModExtMenu extends FileItemModBase{get buttonConfig(){return [{
			class:"115-player",title:"使用【115官方播放器】",text:"5️⃣ 官方播放",visible:this.itemInfo.attributes.iv===le.Yes,click:()=>{
			ae(new URL(`/?pickcode=${this.itemInfo.attributes.pick_code}&share_id=0`,K).href,{active:true});}},{class:"master-player",
			title:"使用【Master播放器】",text:"▶️ Master 播放",visible:this.itemInfo.attributes.iv===le.Yes,click:()=>{goToPlayer({
			pickCode:this.itemInfo.attributes.pick_code,cid:this.itemInfo.attributes.cid},true);}}]}get fileOprNode(){
			return this.itemNode.querySelector(".file-opr")??this.itemNode.querySelector(".file-opt")}onLoad(){
			this.itemInfo.fileListType!==ce.grid&&this.createButtons();}onDestroy(){}createButtons(){this.buttonConfig.forEach(e=>{
			var t;if(!e.visible)return;const r=this.createNormalItemButtonElement(e);null==(t=this.fileOprNode)||t.prepend(r),
			r.addEventListener("mousedown",async t=>{t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),e.click();});
			});}createNormalItemButtonElement(e){const t=document.createElement("a");if(t.href="javascript:void(0)",
			t.className=e.class,
			t.title=e.title,t.style.cssText="\n      pointer-events: all;\n      position: relative;\n      z-index: 1000;\n      display: flex;\n      align-items: center;\n      gap: 4px;\n    ",
			e.icon){const r=document.createElement("img");r.src=e.icon,r.style.cssText="width: 16px; height: 16px;",t.prepend(r);}
			const r=document.createElement("span");return r.textContent=e.text,r.style.pointerEvents="none",t.appendChild(r),t}
			},class FileItemModClickPlay extends FileItemModBase{get fileNameNode(){
			return this.itemNode.querySelector(".file-thumb")??this.itemNode.querySelector(".file-name .name")}onLoad(){var e
			;this.itemInfo.attributes.iv===le.Yes&&(null==(e=this.fileNameNode)||e.addEventListener("click",this.handleClickPlayer.bind(this),true),
			this.itemNode.addEventListener("dblclick",this.handleClickPlayer.bind(this)),
			this.itemNode.addEventListener("auxclick",this.handleAuxclick.bind(this)));}onDestroy(){var e
			;null==(e=this.fileNameNode)||e.removeEventListener("click",this.handleClickPlayer.bind(this),true),
			this.itemNode.removeEventListener("dblclick",this.handleClickPlayer.bind(this)),
			this.itemNode.removeEventListener("auxclick",this.handleAuxclick.bind(this));}handleAuxclick(e){
			1===e.button&&(e.preventDefault(),e.stopPropagation(),e.stopImmediatePropagation(),
			ae(new URL(`/?pickcode=${this.itemInfo.attributes.pick_code}&share_id=0`,K).href,{active:true}));}handleClickPlayer(e){
			e.preventDefault(),e.stopPropagation(),e.stopImmediatePropagation(),goToPlayer({
			pickCode:this.itemInfo.attributes.pick_code,cid:this.itemInfo.attributes.cid},true);}
			},class FileItemModDownload extends FileItemModBase{get fileOprNode(){return this.itemNode.querySelector(".file-opr")}
			get downloadOneNode(){var e;return null==(e=this.fileOprNode)?void 0:e.querySelector('a[menu="download_one"]')}
			get downloadDirOneNode(){var e;return null==(e=this.fileOprNode)?void 0:e.querySelector('a[menu="download_dir_one"]')}
			onLoad(){this.fileOprNode&&(ve||(this.downloadDirOneNode&&(this.downloadDirOneNode.onclick=async e=>{
			e.stopImmediatePropagation(),e.preventDefault(),alert("当前未支持文件夹下载");
			}),this.downloadOneNode&&(this.downloadOneNode.onclick=async e=>{e.stopImmediatePropagation(),e.preventDefault();try{
			const e=await Ee.getFileDownloadUrl(this.itemInfo.attributes.pick_code)
			;if(e.url.url)return void window.open(e.url.url,"_blank");throw new Error("下载失败")}catch(t){
			t instanceof Error?alert(t.message):alert("下载失败");}})));}onDestroy(){}}];class FileListMod extends BaseMod{constructor(){
			super(),__publicField(this,"itemModLoaderMaps",new Map),__publicField(this,"observerContent",null),
			__publicField(this,"scrollHistory",null),this.init();}get dataListBoxNode(){
			return document.querySelector(se.Main.CONFIG.DataListBox)}get listCellNode(){
			return document.querySelector(".list-cell")??null}get listContentsNode(){var e
			;return null==(e=this.listCellNode)?void 0:e.querySelector(".list-contents")}get listThumbNode(){var e
			;return null==(e=this.listCellNode)?void 0:e.querySelector(".list-thumb")}get listScrollBoxNode(){
			return this.listContentsNode??this.listThumbNode}get listType(){return this.listContentsNode?ce.list:ce.grid}
			get itemNodes(){var e;return null==(e=this.listCellNode)?void 0:e.querySelectorAll("li")}destroy(){var e,t
			;null==(e=this.observerContent)||e.disconnect(),this.destroyAllItemModLoader(),null==(t=this.scrollHistory)||t.destroy();
			}async init(){var e;this.updateItems(),this.scrollHistory=new FileListScrollHistory,
			this.listScrollBoxNode&&(null==(e=this.scrollHistory)||e.setScrollBox(this.listScrollBoxNode)),this.watchItemsChange();}
			watchItemsChange(){let e=null;e=new MutationObserver(e=>{var t
			;for(const r of e)if(r.target.isSameNode(this.dataListBoxNode)&&r.addedNodes.length>0){this.updateItems(),
			this.listScrollBoxNode&&(null==(t=this.scrollHistory)||t.setScrollBox(this.listScrollBoxNode));break}}),
			this.dataListBoxNode&&(e.observe(this.dataListBoxNode,{childList:true}),this.observerContent=e);}updateItems(){
			const e=this.itemNodes,t=new Set(e);if(t){for(const e of t){if(this.itemModLoaderMaps.has(e))continue
			;const t=new FileItemModLoader(e,this.listType,this.listScrollBoxNode,Dr);t.load(),this.itemModLoaderMaps.set(e,t);}
			for(const[e,r]of this.itemModLoaderMaps.entries())t.has(e)||(r.destroy(),this.itemModLoaderMaps.delete(e));}}
			destroyAllItemModLoader(){this.itemModLoaderMaps.forEach(e=>{e.destroy();}),this.itemModLoaderMaps.clear();}}
			/**
			* (c) Iconify
			*
			* For the full copyright and license information, please view the license.txt
			* files at https://github.com/iconify/iconify
			*
			* Licensed under MIT.
			*
			* @license MIT
			* @version 3.0.0
			*/const Fr=Object.freeze({left:0,top:0,width:16,height:16}),$r=Object.freeze({rotate:0,vFlip:false,hFlip:false
			}),jr=Object.freeze({...Fr,...$r}),Br=Object.freeze({...jr,body:"",hidden:false}),Ur=Object.freeze({width:null,height:null
			}),Vr=Object.freeze({...Ur,...$r});const qr=/[\s,]+/;const Gr={...Vr,preserveAspectRatio:""}
			;function getCustomisations(e){const t={...Gr},attr=(t,r)=>e.getAttribute(t)||r;return t.width=attr("width",null),
			t.height=attr("height",null),t.rotate=function rotateFromString(e,t=0){const r=e.replace(/^-?[0-9.]*/,"")
			;function cleanup(e){for(;e<0;)e+=4;return e%4}if(""===r){const t=parseInt(e);return isNaN(t)?0:cleanup(t)}if(r!==e){
			let t=0;switch(r){case "%":t=25;break;case "deg":t=90;}if(t){let o=parseFloat(e.slice(0,e.length-r.length))
			;return isNaN(o)?0:(o/=t,o%1==0?cleanup(o):0)}}return t}(attr("rotate","")),function flipFromString(e,t){
			t.split(qr).forEach(t=>{switch(t.trim()){case "horizontal":e.hFlip=true;break;case "vertical":e.vFlip=true;}});
			}(t,attr("flip","")),t.preserveAspectRatio=attr("preserveAspectRatio",attr("preserveaspectratio","")),t}
			const Hr=/^[a-z0-9]+(-[a-z0-9]+)*$/,stringToIcon=(e,t,r,o="")=>{const a=e.split(":");if("@"===e.slice(0,1)){
			if(a.length<2||a.length>3)return null;o=a.shift().slice(1);}if(a.length>3||!a.length)return null;if(a.length>1){
			const e=a.pop(),r=a.pop(),n={provider:a.length>0?a[0]:o,prefix:r,name:e};return t&&!validateIconName(n)?null:n}
			const n=a[0],i=n.split("-");if(i.length>1){const e={provider:o,prefix:i.shift(),name:i.join("-")}
			;return t&&!validateIconName(e)?null:e}if(r&&""===o){const e={provider:o,prefix:"",name:n}
			;return t&&!validateIconName(e,r)?null:e}return null
			},validateIconName=(e,t)=>!!e&&!(!(t&&""===e.prefix||e.prefix)||!e.name);function mergeIconData(e,t){
			const r=function mergeIconTransformations(e,t){const r={};!e.hFlip!=!t.hFlip&&(r.hFlip=true),
			!e.vFlip!=!t.vFlip&&(r.vFlip=true);const o=((e.rotate||0)+(t.rotate||0))%4;return o&&(r.rotate=o),r}(e,t)
			;for(const o in Br)o in $r?o in e&&!(o in r)&&(r[o]=$r[o]):o in t?r[o]=t[o]:o in e&&(r[o]=e[o]);return r}
			function internalGetIconData(e,t,r){const o=e.icons,a=e.aliases||Object.create(null);let n={};function parse(e){
			n=mergeIconData(o[e]||a[e],n);}return parse(t),r.forEach(parse),mergeIconData(e,n)}function parseIconSet(e,t){const r=[]
			;if("object"!=typeof e||"object"!=typeof e.icons)return r;e.not_found instanceof Array&&e.not_found.forEach(e=>{
			t(e,null),r.push(e);});const o=function getIconsTree(e,t){
			const r=e.icons,o=e.aliases||Object.create(null),a=Object.create(null)
			;return Object.keys(r).concat(Object.keys(o)).forEach(function resolve(e){if(r[e])return a[e]=[];if(!(e in a)){a[e]=null
			;const t=o[e]&&o[e].parent,r=t&&resolve(t);r&&(a[e]=[t].concat(r));}return a[e]}),a}(e);for(const a in o){const n=o[a]
			;n&&(t(a,internalGetIconData(e,a,n)),r.push(a));}return r}const Qr={provider:"",aliases:{},not_found:{},...Fr}
			;function checkOptionalProps(e,t){for(const r in t)if(r in e&&typeof e[r]!=typeof t[r])return  false;return  true}
			function quicklyValidateIconSet(e){if("object"!=typeof e||null===e)return null;const t=e
			;if("string"!=typeof t.prefix||!e.icons||"object"!=typeof e.icons)return null;if(!checkOptionalProps(e,Qr))return null
			;const r=t.icons;for(const a in r){const e=r[a];if(!a||"string"!=typeof e.body||!checkOptionalProps(e,Br))return null}
			const o=t.aliases||Object.create(null);for(const a in o){const e=o[a],t=e.parent
			;if(!a||"string"!=typeof t||!r[t]&&!o[t]||!checkOptionalProps(e,Br))return null}return t}const Wr=Object.create(null)
			;function getStorage(e,t){const r=Wr[e]||(Wr[e]=Object.create(null));return r[t]||(r[t]=function newStorage(e,t){return {
			provider:e,prefix:t,icons:Object.create(null),missing:new Set}}(e,t))}function addIconSet(e,t){
			return quicklyValidateIconSet(t)?parseIconSet(t,(t,r)=>{r?e.icons[t]=r:e.missing.add(t);}):[]}function listIcons$1(e,t){
			let r=[];return ("string"==typeof e?[e]:Object.keys(Wr)).forEach(e=>{
			("string"==typeof e&&"string"==typeof t?[t]:Object.keys(Wr[e]||{})).forEach(t=>{const o=getStorage(e,t)
			;r=r.concat(Object.keys(o.icons).map(r=>(""!==e?"@"+e+":":"")+t+":"+r));});}),r}let Yr=false;function allowSimpleNames(e){
			return "boolean"==typeof e&&(Yr=e),Yr}function getIconData(e){const t="string"==typeof e?stringToIcon(e,true,Yr):e;if(t){
			const e=getStorage(t.provider,t.prefix),r=t.name;return e.icons[r]||(e.missing.has(r)?null:void 0)}}
			function addIcon$1(e,t){const r=stringToIcon(e,true,Yr);if(!r)return  false;const o=getStorage(r.provider,r.prefix)
			;return t?function addIconToStorage(e,t,r){try{if("string"==typeof r.body)return e.icons[t]={...r},!0}catch(Oo){}
			return  false}(o,r.name,t):(o.missing.add(r.name),true)}function addCollection$1(e,t){if("object"!=typeof e)return  false
			;if("string"!=typeof t&&(t=e.provider||""),Yr&&!t&&!e.prefix){let t=false;return quicklyValidateIconSet(e)&&(e.prefix="",
			parseIconSet(e,(e,r)=>{addIcon$1(e,r)&&(t=true);})),t}const r=e.prefix;if(!validateIconName({prefix:r,name:"a"}))return  false
			;return !!addIconSet(getStorage(t,r),e)}function iconLoaded$1(e){return !!getIconData(e)}function getIcon$1(e){
			const t=getIconData(e);return t?{...jr,...t}:t}function removeCallback(e,t){e.forEach(e=>{const r=e.loaderCallbacks
			;r&&(e.loaderCallbacks=r.filter(e=>e.id!==t));});}let Xr=0;const Kr=Object.create(null);function setAPIModule(e,t){Kr[e]=t;
			}function getAPIModule(e){return Kr[e]||Kr[""]}var Jr={resources:[],index:0,timeout:2e3,rotate:750,random:false,
			dataAfterTimeout:false};function sendQuery(e,t,r,o){
			const a=e.resources.length,n=e.random?Math.floor(Math.random()*a):e.index;let i;if(e.random){let t=e.resources.slice(0)
			;for(i=[];t.length>1;){const e=Math.floor(Math.random()*t.length);i.push(t[e]),t=t.slice(0,e).concat(t.slice(e+1));}
			i=i.concat(t);}else i=e.resources.slice(n).concat(e.resources.slice(0,n));const s=Date.now()
			;let l,c="pending",d=0,u=null,p=[],h=[];function resetTimer(){u&&(clearTimeout(u),u=null);}function abort(){
			"pending"===c&&(c="aborted"),resetTimer(),p.forEach(e=>{"pending"===e.status&&(e.status="aborted");}),p=[];}
			function subscribe(e,t){t&&(h=[]),"function"==typeof e&&h.push(e);}function failQuery(){c="failed",h.forEach(e=>{
			e(void 0,l);});}function clearQueue(){p.forEach(e=>{"pending"===e.status&&(e.status="aborted");}),p=[];}function execNext(){
			if("pending"!==c)return;resetTimer();const o=i.shift();if(void 0===o)return p.length?void(u=setTimeout(()=>{
			resetTimer(),"pending"===c&&(clearQueue(),failQuery());},e.timeout)):void failQuery();const a={status:"pending",
			resource:o,callback:(t,r)=>{!function moduleResponse(t,r,o){const a="success"!==r;switch(p=p.filter(e=>e!==t),c){
			case "pending":break;case "failed":if(a||!e.dataAfterTimeout)return;break;default:return}if("abort"===r)return l=o,
			void failQuery();if(a)return l=o,void(p.length||(i.length?execNext():failQuery()));if(resetTimer(),clearQueue(),
			!e.random){const r=e.resources.indexOf(t.resource);-1!==r&&r!==e.index&&(e.index=r);}c="completed",h.forEach(e=>{e(o);});
			}(a,t,r);}};p.push(a),d++,u=setTimeout(execNext,e.rotate),r(o,t,a.callback);}return "function"==typeof o&&h.push(o),
			setTimeout(execNext),function getQueryStatus(){return {startTime:s,payload:t,status:c,queriesSent:d,
			queriesPending:p.length,subscribe:subscribe,abort:abort}}}function initRedundancy(e){const t={...Jr,...e};let r=[]
			;function cleanup(){r=r.filter(e=>"pending"===e().status);}return {query:function query(e,o,a){
			const n=sendQuery(t,e,o,(e,t)=>{cleanup(),a&&a(e,t);});return r.push(n),n},find:function find(e){
			return r.find(t=>e(t))||null},setIndex:e=>{t.index=e;},getIndex:()=>t.index,cleanup:cleanup}}function createAPIConfig(e){
			let t;if("string"==typeof e.resources)t=[e.resources];else if(t=e.resources,!(t instanceof Array&&t.length))return null
			;return {resources:t,path:e.path||"/",maxURL:e.maxURL||500,rotate:e.rotate||750,timeout:e.timeout||5e3,
			random:true===e.random,index:e.index||0,dataAfterTimeout:false!==e.dataAfterTimeout}}
			const Zr=Object.create(null),eo=["https://api.simplesvg.com","https://api.unisvg.com"],to=[]
			;for(;eo.length>0;)1===eo.length||Math.random()>.5?to.push(eo.shift()):to.push(eo.pop());function addAPIProvider$1(e,t){
			const r=createAPIConfig(t);return null!==r&&(Zr[e]=r,true)}function getAPIConfig(e){return Zr[e]}
			function listAPIProviders(){return Object.keys(Zr)}function emptyCallback$1(){}Zr[""]=createAPIConfig({
			resources:["https://api.iconify.design"].concat(to)});const ro=Object.create(null);function sendAPIQuery(e,t,r){let o,a
			;if("string"==typeof e){const t=getAPIModule(e);if(!t)return r(void 0,424),emptyCallback$1;a=t.send
			;const n=function getRedundancyCache(e){if(!ro[e]){const t=getAPIConfig(e);if(!t)return;const r={config:t,
			redundancy:initRedundancy(t)};ro[e]=r;}return ro[e]}(e);n&&(o=n.redundancy);}else {const t=createAPIConfig(e);if(t){
			o=initRedundancy(t);const r=getAPIModule(e.resources?e.resources[0]:"");r&&(a=r.send);}}
			return o&&a?o.query(t,a,r)().abort:(r(void 0,424),emptyCallback$1)}function emptyCallback(){}function loadedNewIcons(e){
			e.iconsLoaderFlag||(e.iconsLoaderFlag=true,setTimeout(()=>{e.iconsLoaderFlag=false,function updateCallbacks(e){
			e.pendingCallbacksFlag||(e.pendingCallbacksFlag=true,setTimeout(()=>{e.pendingCallbacksFlag=false
			;const t=e.loaderCallbacks?e.loaderCallbacks.slice(0):[];if(!t.length)return;let r=false;const o=e.provider,a=e.prefix
			;t.forEach(t=>{const n=t.icons,i=n.pending.length;n.pending=n.pending.filter(t=>{if(t.prefix!==a)return  true;const i=t.name
			;if(e.icons[i])n.loaded.push({provider:o,prefix:a,name:i});else {if(!e.missing.has(i))return r=true,true;n.missing.push({
			provider:o,prefix:a,name:i});}return  false}),n.pending.length!==i&&(r||removeCallback([e],t.id),
			t.callback(n.loaded.slice(0),n.missing.slice(0),n.pending.slice(0),t.abort));});}));}(e);}));}
			function parseLoaderResponse(e,t,r){function checkMissing(){const r=e.pendingIcons;t.forEach(t=>{r&&r.delete(t),
			e.icons[t]||e.missing.add(t);});}if(r&&"object"==typeof r)try{if(!addIconSet(e,r).length)return void checkMissing()
			}catch(Oo){}checkMissing(),loadedNewIcons(e);}function parsePossiblyAsyncResponse(e,t){e instanceof Promise?e.then(e=>{
			t(e);}).catch(()=>{t(null);}):t(e);}function loadNewIcons(e,t){
			e.iconsToLoad?e.iconsToLoad=e.iconsToLoad.concat(t).sort():e.iconsToLoad=t,e.iconsQueueFlag||(e.iconsQueueFlag=true,
			setTimeout(()=>{e.iconsQueueFlag=false;const{provider:t,prefix:r}=e,o=e.iconsToLoad;if(delete e.iconsToLoad,
			!o||!o.length)return;const a=e.loadIcon
			;if(e.loadIcons&&(o.length>1||!a))return void parsePossiblyAsyncResponse(e.loadIcons(o,r,t),t=>{
			parseLoaderResponse(e,o,t);});if(a)return void o.forEach(o=>{parsePossiblyAsyncResponse(a(o,r,t),t=>{
			parseLoaderResponse(e,[o],t?{prefix:r,icons:{[o]:t}}:null);});})
			;const{valid:n,invalid:i}=function checkIconNamesForAPI(e){const t=[],r=[];return e.forEach(e=>{
			(e.match(Hr)?t:r).push(e);}),{valid:t,invalid:r}}(o);if(i.length&&parseLoaderResponse(e,i,null),!n.length)return
			;const s=r.match(Hr)?getAPIModule(t):null;if(!s)return void parseLoaderResponse(e,n,null);s.prepare(t,r,n).forEach(r=>{
			sendAPIQuery(t,r,t=>{parseLoaderResponse(e,r.icons,t);});});}));}const loadIcons$1=(e,t)=>{const r=function sortIcons(e){
			const t={loaded:[],missing:[],pending:[]},r=Object.create(null)
			;e.sort((e,t)=>e.provider!==t.provider?e.provider.localeCompare(t.provider):e.prefix!==t.prefix?e.prefix.localeCompare(t.prefix):e.name.localeCompare(t.name))
			;let o={provider:"",prefix:"",name:""};return e.forEach(e=>{
			if(o.name===e.name&&o.prefix===e.prefix&&o.provider===e.provider)return;o=e
			;const a=e.provider,n=e.prefix,i=e.name,s=r[a]||(r[a]=Object.create(null)),l=s[n]||(s[n]=getStorage(a,n));let c
			;c=i in l.icons?t.loaded:""===n||l.missing.has(i)?t.missing:t.pending;const d={provider:a,prefix:n,name:i};c.push(d);}),t
			}(function listToIcons(e,t=true,r=false){const o=[];return e.forEach(e=>{const a="string"==typeof e?stringToIcon(e,t,r):e
			;a&&o.push(a);}),o}(e,true,allowSimpleNames()));if(!r.pending.length){let e=true;return t&&setTimeout(()=>{
			e&&t(r.loaded,r.missing,r.pending,emptyCallback);}),()=>{e=false;}}const o=Object.create(null),a=[];let n,i
			;return r.pending.forEach(e=>{const{provider:t,prefix:r}=e;if(r===i&&t===n)return;n=t,i=r,a.push(getStorage(t,r))
			;const s=o[t]||(o[t]=Object.create(null));s[r]||(s[r]=[]);}),r.pending.forEach(e=>{
			const{provider:t,prefix:r,name:a}=e,n=getStorage(t,r),i=n.pendingIcons||(n.pendingIcons=new Set);i.has(a)||(i.add(a),
			o[t][r].push(a));}),a.forEach(e=>{const t=o[e.provider][e.prefix];t.length&&loadNewIcons(e,t);}),
			t?function storeCallback(e,t,r){const o=Xr++,a=removeCallback.bind(null,r,o);if(!t.pending.length)return a;const n={
			id:o,icons:t,callback:e,abort:a};return r.forEach(e=>{(e.loaderCallbacks||(e.loaderCallbacks=[])).push(n);}),a
			}(t,r,a):emptyCallback},loadIcon$1=e=>new Promise((t,r)=>{const o="string"==typeof e?stringToIcon(e,true):e
			;o?loadIcons$1([o||e],a=>{if(a.length&&o){const e=getIconData(o);if(e)return void t({...jr,...e})}r(e);}):r(e);})
			;function testIconObject(e){try{const t="string"==typeof e?JSON.parse(e):e;if("string"==typeof t.body)return {...t}
			}catch(Oo){}}let oo=false;try{oo=0===navigator.vendor.indexOf("Apple");}catch(Oo){}
			const ao=/(-?[0-9.]*[0-9]+[0-9.]*)/g,no=/^-?[0-9.]*[0-9]+[0-9.]*$/g;function calculateSize$1(e,t,r){if(1===t)return e
			;if(r=r||100,"number"==typeof e)return Math.ceil(e*t*r)/r;if("string"!=typeof e)return e;const o=e.split(ao)
			;if(null===o||!o.length)return e;const a=[];let n=o.shift(),i=no.test(n);for(;;){if(i){const e=parseFloat(n)
			;isNaN(e)?a.push(n):a.push(Math.ceil(e*t*r)/r);}else a.push(n);if(n=o.shift(),void 0===n)return a.join("");i=!i;}}
			function iconToSVG(e,t){const r={...jr,...e},o={...Vr,...t},a={left:r.left,top:r.top,width:r.width,height:r.height}
			;let n=r.body;[r,o].forEach(e=>{const t=[],r=e.hFlip,o=e.vFlip;let i,s=e.rotate
			;switch(r?o?s+=2:(t.push("translate("+(a.width+a.left).toString()+" "+(0-a.top).toString()+")"),t.push("scale(-1 1)"),
			a.top=a.left=0):o&&(t.push("translate("+(0-a.left).toString()+" "+(a.height+a.top).toString()+")"),
			t.push("scale(1 -1)"),a.top=a.left=0),s<0&&(s-=4*Math.floor(s/4)),s%=4,s){case 1:i=a.height/2+a.top,
			t.unshift("rotate(90 "+i.toString()+" "+i.toString()+")");break;case 2:
			t.unshift("rotate(180 "+(a.width/2+a.left).toString()+" "+(a.height/2+a.top).toString()+")");break;case 3:
			i=a.width/2+a.left,t.unshift("rotate(-90 "+i.toString()+" "+i.toString()+")");}s%2==1&&(a.left!==a.top&&(i=a.left,
			a.left=a.top,a.top=i),a.width!==a.height&&(i=a.width,a.width=a.height,a.height=i)),
			t.length&&(n=function wrapSVGContent(e,t,r){const o=function splitSVGDefs(e,t="defs"){let r="";const o=e.indexOf("<"+t)
			;for(;o>=0;){const a=e.indexOf(">",o),n=e.indexOf("</"+t);if(-1===a||-1===n)break;const i=e.indexOf(">",n)
			;if(-1===i)break;r+=e.slice(a+1,n).trim(),e=e.slice(0,o).trim()+e.slice(i+1);}return {defs:r,content:e}}(e)
			;return function mergeDefsAndContent(e,t){return e?"<defs>"+e+"</defs>"+t:t}(o.defs,t+o.content+r)
			}(n,'<g transform="'+t.join(" ")+'">',"</g>"));});const i=o.width,s=o.height,l=a.width,c=a.height;let d,u
			;null===i?(u=null===s?"1em":"auto"===s?c:s,d=calculateSize$1(u,l/c)):(d="auto"===i?l:i,
			u=null===s?calculateSize$1(d,c/l):"auto"===s?c:s);const p={},setAttr=(e,t)=>{
			(e=>"unset"===e||"undefined"===e||"none"===e)(t)||(p[e]=t.toString());};setAttr("width",d),setAttr("height",u)
			;const h=[a.left,a.top,l,c];return p.viewBox=h.join(" "),{attributes:p,viewBox:h,body:n}}function iconToHTML$1(e,t){
			let r=-1===e.indexOf("xlink:")?"":' xmlns:xlink="http://www.w3.org/1999/xlink"';for(const o in t)r+=" "+o+'="'+t[o]+'"'
			;return '<svg xmlns="http://www.w3.org/2000/svg"'+r+">"+e+"</svg>"}function svgToURL$1(e){
			return 'url("'+function svgToData(e){return "data:image/svg+xml,"+function encodeSVGforURL(e){
			return e.replace(/"/g,"'").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/\s+/g," ")
			}(e)}(e)+'")'}let io=(()=>{let e;try{if(e=fetch,"function"==typeof e)return e}catch(Oo){}})();function setFetch(e){io=e;}
			function getFetch(){return io}const so={prepare:(e,t,r)=>{const o=[],a=function calculateMaxLength(e,t){
			const r=getAPIConfig(e);if(!r)return 0;let o;if(r.maxURL){let e=0;r.resources.forEach(t=>{const r=t
			;e=Math.max(e,r.length);});const a=t+".json?icons=";o=r.maxURL-e-r.path.length-a.length;}else o=0;return o}(e,t),n="icons"
			;let i={type:n,provider:e,prefix:t,icons:[]},s=0;return r.forEach((r,l)=>{s+=r.length+1,s>=a&&l>0&&(o.push(i),i={type:n,
			provider:e,prefix:t,icons:[]},s=r.length),i.icons.push(r);}),o.push(i),o},send:(e,t,r)=>{
			if(!io)return void r("abort",424);let o=function getPath(e){if("string"==typeof e){const t=getAPIConfig(e)
			;if(t)return t.path}return "/"}(t.provider);switch(t.type){case "icons":{const e=t.prefix,r=t.icons.join(",")
			;o+=e+".json?"+new URLSearchParams({icons:r}).toString();break}case "custom":{const e=t.uri
			;o+="/"===e.slice(0,1)?e.slice(1):e;break}default:return void r("abort",400)}let a=503;io(e+o).then(e=>{const t=e.status
			;if(200===t)return a=501,e.json();setTimeout(()=>{r(function shouldAbort(e){return 404===e}(t)?"abort":"next",t);});
			}).then(e=>{"object"==typeof e&&null!==e?setTimeout(()=>{r("success",e);}):setTimeout(()=>{
			404===e?r("abort",e):r("next",a);});}).catch(()=>{r("next",a);});}};function setCustomIconsLoader$1(e,t,r){
			getStorage(r||"",t).loadIcons=e;}function setCustomIconLoader$1(e,t,r){getStorage(r||"",t).loadIcon=e;}
			const lo="data-style";let co="";function appendCustomStyle(e){co=e;}function updateStyle(e,t){
			let r=Array.from(e.childNodes).find(e=>e.hasAttribute&&e.hasAttribute(lo));r||(r=document.createElement("style"),
			r.setAttribute(lo,lo),
			e.appendChild(r)),r.textContent=":host{display:inline-block;vertical-align:"+(t?"-0.125em":"0")+"}span,svg{display:block;margin:auto}"+co;
			}function exportFunctions(){let e;setAPIModule("",so),allowSimpleNames(true);try{e=window;}catch(Oo){}if(e){
			if(void 0!==e.IconifyPreload){const t=e.IconifyPreload
			;"object"==typeof t&&null!==t&&(t instanceof Array?t:[t]).forEach(e=>{try{
			"object"!=typeof e||null===e||e instanceof Array||"object"!=typeof e.icons||"string"!=typeof e.prefix||addCollection$1(e);
			}catch(Mo){}});}if(void 0!==e.IconifyProviders){const t=e.IconifyProviders
			;if("object"==typeof t&&null!==t)for(const e in t){try{const r=t[e]
			;if("object"!=typeof r||!r||void 0===r.resources)continue;addAPIProvider$1(e,r);}catch(Mo){}}}}return {
			iconLoaded:iconLoaded$1,getIcon:getIcon$1,listIcons:listIcons$1,addIcon:addIcon$1,addCollection:addCollection$1,
			calculateSize:calculateSize$1,buildIcon:iconToSVG,iconToHTML:iconToHTML$1,svgToURL:svgToURL$1,loadIcons:loadIcons$1,
			loadIcon:loadIcon$1,addAPIProvider:addAPIProvider$1,setCustomIconLoader:setCustomIconLoader$1,
			setCustomIconsLoader:setCustomIconsLoader$1,appendCustomStyle:appendCustomStyle,_api:{getAPIConfig:getAPIConfig,
			setAPIModule:setAPIModule,sendAPIQuery:sendAPIQuery,setFetch:setFetch,getFetch:getFetch,
			listAPIProviders:listAPIProviders}}}const uo={"background-color":"currentColor"},po={"background-color":"transparent"
			},ho={image:"var(--svg)",repeat:"no-repeat",size:"100% 100%"},mo={"-webkit-mask":uo,mask:uo,background:po}
			;for(const zo in mo){const e=mo[zo];for(const t in ho)e[zo+"-"+t]=ho[t];}function fixSize(e){
			return e?e+(e.match(/^[-0-9.]+$/)?"px":""):"inherit"}let fo;function cleanUpInnerHTML(e){
			return void 0===fo&&function createPolicy(){try{fo=window.trustedTypes.createPolicy("iconify",{createHTML:e=>e});
			}catch(Oo){fo=null;}}(),fo?fo.createHTML(e):e}function findIconElement(e){return Array.from(e.childNodes).find(e=>{
			const t=e.tagName&&e.tagName.toUpperCase();return "SPAN"===t||"SVG"===t})}function renderIcon(e,t){
			const r=t.icon.data,o=t.customisations,a=iconToSVG(r,o)
			;o.preserveAspectRatio&&(a.attributes.preserveAspectRatio=o.preserveAspectRatio);const n=t.renderedMode;let i
			;if("svg"===n)i=function renderSVG(e){const t=document.createElement("span"),r=e.attributes;let o=""
			;r.width||(o="width: inherit;"),r.height||(o+="height: inherit;"),o&&(r.style=o);const a=iconToHTML$1(e.body,r)
			;return t.innerHTML=cleanUpInnerHTML(a),t.firstChild}(a);else i=function renderSPAN(e,t,r){
			const o=document.createElement("span");let a=e.body;-1!==a.indexOf("<a")&&(a+="\x3c!-- "+Date.now()+" --\x3e")
			;const n=e.attributes,i=svgToURL$1(iconToHTML$1(a,{...n,width:t.width+"",height:t.height+""})),s=o.style,l={"--svg":i,
			width:fixSize(n.width),height:fixSize(n.height),...r?uo:po};for(const c in l)s.setProperty(c,l[c]);return o}(a,{...jr,
			...r},"mask"===n);const s=findIconElement(e)
			;s?"SPAN"===i.tagName&&s.tagName===i.tagName?s.setAttribute("style",i.getAttribute("style")):e.replaceChild(i,s):e.appendChild(i);
			}function setPendingState(e,t,r){return {rendered:false,inline:t,icon:e,lastRender:r&&(r.rendered?r:r.lastRender)}}
			const go=function defineIconifyIcon(e="iconify-icon"){let t,r;try{t=window.customElements,r=window.HTMLElement;
			}catch(Oo){return}if(!t||!r)return;const o=t.get(e);if(o)return o
			;const a=["icon","mode","inline","noobserver","width","height","rotate","flip"],n=class extends r{constructor(){super(),
			__publicField(this,"_shadowRoot"),__publicField(this,"_initialised",false),__publicField(this,"_state"),
			__publicField(this,"_checkQueued",false),__publicField(this,"_connected",false),__publicField(this,"_observer",null),
			__publicField(this,"_visible",true);const e=this._shadowRoot=this.attachShadow({mode:"open"
			}),t=this.hasAttribute("inline");updateStyle(e,t),this._state=setPendingState({value:""},t),this._queueCheck();}
			connectedCallback(){this._connected=true,this.startObserver();}disconnectedCallback(){this._connected=false,
			this.stopObserver();}static get observedAttributes(){return a.slice(0)}attributeChangedCallback(e){switch(e){
			case "inline":{const e=this.hasAttribute("inline"),t=this._state;e!==t.inline&&(t.inline=e,
			updateStyle(this._shadowRoot,e));break}case "noobserver":
			this.hasAttribute("noobserver")?this.startObserver():this.stopObserver();break;default:this._queueCheck();}}get icon(){
			const e=this.getAttribute("icon");if(e&&"{"===e.slice(0,1))try{return JSON.parse(e)}catch(Oo){}return e}set icon(e){
			"object"==typeof e&&(e=JSON.stringify(e)),this.setAttribute("icon",e);}get inline(){return this.hasAttribute("inline")}
			set inline(e){e?this.setAttribute("inline","true"):this.removeAttribute("inline");}get observer(){
			return this.hasAttribute("observer")}set observer(e){
			e?this.setAttribute("observer","true"):this.removeAttribute("observer");}restartAnimation(){const e=this._state
			;if(e.rendered){const t=this._shadowRoot;if("svg"===e.renderedMode)try{return void t.lastChild.setCurrentTime(0)
			}catch(Oo){}renderIcon(t,e);}}get status(){const e=this._state
			;return e.rendered?"rendered":null===e.icon.data?"failed":"loading"}_queueCheck(){
			this._checkQueued||(this._checkQueued=true,setTimeout(()=>{this._check();}));}_check(){if(!this._checkQueued)return
			;this._checkQueued=false;const e=this._state,t=this.getAttribute("icon")
			;if(t!==e.icon.value)return void this._iconChanged(t);if(!e.rendered||!this._visible)return
			;const r=this.getAttribute("mode"),o=getCustomisations(this);e.attrMode===r&&!function haveCustomisationsChanged(e,t){
			for(const r in Gr)if(e[r]!==t[r])return  true;return  false
			}(e.customisations,o)&&findIconElement(this._shadowRoot)||this._renderIcon(e.icon,o,r);}_iconChanged(e){
			const t=function parseIconValue(e,t){if("object"==typeof e)return {data:testIconObject(e),value:e}
			;if("string"!=typeof e)return {value:e};if(e.includes("{")){const t=testIconObject(e);if(t)return {data:t,value:e}}
			const r=stringToIcon(e,true,true);if(!r)return {value:e};const o=getIconData(r);if(void 0!==o||!r.prefix)return {value:e,
			name:r,data:o};const a=loadIcons$1([r],()=>t(e,r,getIconData(r)));return {value:e,name:r,loading:a}}(e,(e,t,r)=>{
			const o=this._state;if(o.rendered||this.getAttribute("icon")!==e)return;const a={value:e,name:t,data:r}
			;a.data?this._gotIconData(a):o.icon=a;})
			;t.data?this._gotIconData(t):this._state=setPendingState(t,this._state.inline,this._state);}_forceRender(){
			if(!this._visible){const e=findIconElement(this._shadowRoot);return void(e&&this._shadowRoot.removeChild(e))}
			this._queueCheck();}_gotIconData(e){
			this._checkQueued=false,this._renderIcon(e,getCustomisations(this),this.getAttribute("mode"));}_renderIcon(e,t,r){
			const o=function getRenderMode(e,t){switch(t){case "svg":case "bg":case "mask":return t}
			return "style"===t||!oo&&-1!==e.indexOf("<a")?-1===e.indexOf("currentColor")?"bg":"mask":"svg"
			}(e.data.body,r),a=this._state.inline;renderIcon(this._shadowRoot,this._state={rendered:true,icon:e,inline:a,
			customisations:t,attrMode:r,renderedMode:o});}startObserver(){if(!this._observer&&!this.hasAttribute("noobserver"))try{
			this._observer=new IntersectionObserver(e=>{const t=e.some(e=>e.isIntersecting);t!==this._visible&&(this._visible=t,
			this._forceRender());}),this._observer.observe(this);}catch(Oo){if(this._observer){try{this._observer.disconnect();
			}catch(e){}this._observer=null;}}}stopObserver(){this._observer&&(this._observer.disconnect(),this._observer=null,
			this._visible=true,this._connected&&this._forceRender());}};a.forEach(e=>{
			e in n.prototype||Object.defineProperty(n.prototype,e,{get:function(){return this.getAttribute(e)},set:function(t){
			null!==t?this.setAttribute(e,t):this.removeAttribute(e);}});});const i=exportFunctions()
			;for(const s in i)n[s]=n.prototype[s]=i[s];return t.define(e,n),n
			}()||exportFunctions(),{iconLoaded:bo,getIcon:vo,listIcons:wo,addIcon:yo,addCollection:xo,calculateSize:ko,buildIcon:_o,iconToHTML:Eo,svgToURL:Co,loadIcons:So,loadIcon:Io,setCustomIconLoader:To,setCustomIconsLoader:Ao,addAPIProvider:Lo,_api:Po}=go
			;class TopFilePathMod extends BaseMod{constructor(){super(),__publicField(this,"mutationObserver",null),
			__publicField(this,"backButton",null),this.init();}get filePathBoxNode(){
			return document.querySelector("#js_top_header_file_path_box")}get topFilePathContainerNode(){
			return document.querySelector(".list-topheader .top-file-path")}get commonLittlePopNode(){var e
			;return null==(e=this.filePathBoxNode)?void 0:e.querySelector(".common-little-pop")}get filePathNode(){var e
			;return null==(e=this.topFilePathContainerNode)?void 0:e.querySelector(".file-path")}get readPathLinkNodes(){var e
			;return null==(e=this.filePathNode)?void 0:e.querySelectorAll("a")}get hasSearchBackButton(){var e
			;return null==(e=this.topFilePathContainerNode)?void 0:e.querySelector('[menu="back_search"]')}destroy(){var e,t
			;null==(e=this.mutationObserver)||e.disconnect(),null==(t=this.backButton)||t.remove();}readPaths(){
			const e=this.readPathLinkNodes;if(!e)return [];const t=e.length>1;return Array.from(e).map(e=>{
			const r=e.getAttribute("titletext")??"",o=e.getAttribute("cid")??"";return t&&"0"===o?"":r}).filter(e=>""!==e)}
			setTopDocumentTitleWithPaths(){const e=this.readPaths(),t=(null==e?void 0:e.reverse().join(" < "))??""
			;(null==top?void 0:top.document)&&""!==t&&(top.document.title=t);}addBackButton(){var e,t
			;this.topFilePathContainerNode&&(this.backButton=document.createElement("a"),
			this.backButton.classList.add("master-back-button"),this.backButton.href="javascript:void(0)",
			this.backButton.innerHTML='<iconify-icon icon="material-symbols:line-start-arrow-notch" noobserver></iconify-icon>返回目录',
			null==(e=this.topFilePathContainerNode)||e.before(this.backButton),
			this.commonLittlePopNode&&(this.commonLittlePopNode.style.marginLeft=`${null==(t=this.filePathNode)?void 0:t.getBoundingClientRect().left}px`),
			this.backButton.addEventListener("click",()=>{var e
			;const t=null==(e=this.readPathLinkNodes)?void 0:e[this.readPathLinkNodes.length-2];t&&t.click();}));}removeBackButton(){
			var e
			;null==(e=this.backButton)||e.remove(),this.backButton=null,this.commonLittlePopNode&&(this.commonLittlePopNode.style.marginLeft="0");
			}controlBackButtonShow(){var e
			;((null==(e=this.readPathLinkNodes)?void 0:e.length)??0)<=1||this.hasSearchBackButton?this.removeBackButton():this.backButton||this.addBackButton();
			}watchPathsChange(e){this.topFilePathContainerNode&&(this.mutationObserver=new MutationObserver(e),
			this.mutationObserver.observe(this.topFilePathContainerNode,{childList:true,subtree:true}));}init(){defer(()=>{
			this.setTopDocumentTitleWithPaths(),this.controlBackButtonShow(),this.watchPathsChange(()=>{
			this.setTopDocumentTitleWithPaths(),this.controlBackButtonShow();});});}}class HomePage{constructor(){
			__publicField(this,"modManager"),this.init();}destroy(){var e;null==(e=this.modManager)||e.destroy();}async init(){
			this.modManager=new ModManager([new FileListMod,new TopFilePathMod]);}}function setVideoCookie(e){
			return new Promise((t,r)=>{const o=document.createElement("iframe");o.src=`${J}/video/token`,o.style.display="none",
			window.addEventListener("message",a=>{var n
			;a.origin===J&&"ready"===a.data.event&&(null==(n=o.contentWindow)||n.postMessage({event:"set-cookies",data:e},J)),
			a.origin===J&&"set-cookies-callback"===a.data.event&&(a.data.data?r(a.data.data):t("success"),o.remove());}),
			document.body.appendChild(o);})}async function videoPage(){!function resetDocument(){
			document.body.style.backgroundColor="#000",
			document.body.style.margin="0",document.body.innerHTML='<div id="my-app" data-theme="dark"></div>',document.title="",
			ee("\n    ::-webkit-scrollbar {\n      width: 8px;\n      height: 8px;\n      /* display: none !important; */\n    }\n\n    ::-webkit-scrollbar-track {\n      background: transparent;\n    }\n\n    ::-webkit-scrollbar-thumb {\n      background: rgba(255, 255, 255, 0.3);\n      border-radius: 4px;\n    }\n\n    ::-webkit-scrollbar-thumb:hover {\n      background: rgba(255, 255, 255, 0.3);\n    }\n\n    /* 隐藏滚动条 */\n    :fullscreen html::-webkit-scrollbar,\n    :fullscreen body::-webkit-scrollbar {\n      width: 0 !important;\n      height: 0 !important;\n      display: none !important\n    }\n  ");
			}();const e=document.createElement("style");e.textContent=Ce,e.dataset.v="style_css",document.head.append(e),createApp(defineAsyncComponent({
			loader:()=>Te(()=>module.import('./index-CToiM--M-BP3VQFC6.js'),void 0)})).mount("#my-app");}(new class DebugInfo{
			constructor(){__publicField(this,"Logger"),this.Logger=new Lt("115Master","DebugInfo");}bootstrapInfo(){
			this.Logger.log("bootstrap-info",`${oe.script.name} 已启动`);}}).bootstrapInfo();const No=[{match:Z.HOME,
			exec:()=>new HomePage},{match:Z.VIDEO,exec:()=>videoPage()},{match:Z.VIDEO_TOKEN,exec:()=>function videoTokenPage(){
			window.parent.postMessage({event:"ready"},X),window.addEventListener("message",e=>{
			e.origin===X&&"set-cookies"===e.data.event&&te.set(e.data.data,e=>{window.parent.postMessage({
			event:"set-cookies-callback",data:e},X);});});}()}];function main(){
			for(const e of No)Q(e.match).test(window.location.href)&&e.exec();}
			"complete"===document.readyState||"interactive"===document.readyState?main():window.addEventListener("DOMContentLoaded",main)

			;

		})
	};
}));

System.register("./index-CToiM--M-BP3VQFC6.js", ['vue', './__monkey.entry-BIbooO62.js', 'lodash', 'hls.js', 'localforage', 'dayjs', 'blueimp-md5', 'big-integer', 'photoswipe/lightbox', 'm3u8-parser'], (function (exports, module) {
	'use strict';
	var defineComponent, ref, reactive, shallowRef, onUnmounted, watch, computed, onMounted, createElementBlock, openBlock, normalizeClass, createElementVNode, createCommentVNode, unref, createVNode, normalizeStyle, withCtx, provide, watchEffect, createBlock, renderSlot, toDisplayString, Fragment, renderList, useTemplateRef, nextTick, createTextVNode, Transition, withModifiers, toValue, inject, withDirectives, vShow, Teleport, mergeProps, useStorage, useAsyncState, useThrottleFn, useDebounceFn, Ee$1, ct$1, Ct$1, It$1, Tt$1, de$1, setVideoCookie, ge$1, error, Scheduler, tryOnUnmounted, blurTime, SchedulerError, pe$1, M3U8ClipperNew, useTitle, At$1, warn, _t$1, Et$1, St$1, goToPlayer, getImageResize, useVModels, useEventListener, useCssVar, useSmartVideoCover, syncRef, toReactive, getDefaultExportFromCjs, useIntervalFn, Pt$1, log, useElementSize, Nt$1, useMouseInElement, useVModel, useElementBounding, onClickOutside, ue$1, se$1, shuffle, get, S_, m_;
	return {
		setters: [module => {
			defineComponent = module.defineComponent;
			ref = module.ref;
			reactive = module.reactive;
			shallowRef = module.shallowRef;
			onUnmounted = module.onUnmounted;
			watch = module.watch;
			computed = module.computed;
			onMounted = module.onMounted;
			createElementBlock = module.createElementBlock;
			openBlock = module.openBlock;
			normalizeClass = module.normalizeClass;
			createElementVNode = module.createElementVNode;
			createCommentVNode = module.createCommentVNode;
			unref = module.unref;
			createVNode = module.createVNode;
			normalizeStyle = module.normalizeStyle;
			withCtx = module.withCtx;
			provide = module.provide;
			watchEffect = module.watchEffect;
			createBlock = module.createBlock;
			renderSlot = module.renderSlot;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
			useTemplateRef = module.useTemplateRef;
			nextTick = module.nextTick;
			createTextVNode = module.createTextVNode;
			Transition = module.Transition;
			withModifiers = module.withModifiers;
			toValue = module.toValue;
			inject = module.inject;
			withDirectives = module.withDirectives;
			vShow = module.vShow;
			Teleport = module.Teleport;
			mergeProps = module.mergeProps;
		}, module => {
			useStorage = module.u;
			useAsyncState = module.a;
			useThrottleFn = module.b;
			useDebounceFn = module.c;
			Ee$1 = module.E;
			ct$1 = module.d;
			Ct$1 = module.C;
			It$1 = module.I;
			Tt$1 = module.T;
			de$1 = module.e;
			setVideoCookie = module.s;
			ge$1 = module.g;
			error = module.f;
			Scheduler = module.S;
			tryOnUnmounted = module.t;
			blurTime = module.h;
			SchedulerError = module.i;
			pe$1 = module.p;
			M3U8ClipperNew = module.M;
			useTitle = module.j;
			At$1 = module.A;
			warn = module.w;
			_t$1 = module._;
			Et$1 = module.k;
			St$1 = module.l;
			goToPlayer = module.m;
			getImageResize = module.n;
			useVModels = module.o;
			useEventListener = module.q;
			useCssVar = module.r;
			useSmartVideoCover = module.v;
			syncRef = module.x;
			toReactive = module.y;
			getDefaultExportFromCjs = module.z;
			useIntervalFn = module.B;
			Pt$1 = module.P;
			log = module.D;
			useElementSize = module.F;
			Nt$1 = module.N;
			useMouseInElement = module.G;
			useVModel = module.H;
			useElementBounding = module.J;
			onClickOutside = module.K;
			ue$1 = module.L;
			se$1 = module.O;
		}, module => {
			shuffle = module.shuffle;
			get = module.get;
		}, module => {
			S_ = module.default;
		}, null, module => {
			m_ = module.default;
		}, null, null, null, null],
		execute: (function () {

			const F_={btn:{
			root:["btn btn-link btn-circle tooltip","text-base-content disabled:text-base-content/30","hover:text-base-content/80"],
			icon:["size-8","drop-shadow-xs/60"]},btnText:{
			root:["btn btn-link text-base rounded-full tooltip px-1.5 font-semibold","text-base-content disabled:text-base-content/30","hover:text-base-content/80","no-underline hover:no-underline!","text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]"]
			},menu:{root:"menu p-0 min-w-32 gap-1",a:"rounded-lg",active:"menu-active",icon:"size-6",label:"text-base-content",
			desc:"text-base-content/60"},
			text:"text-sm text-base-content text-shadow-xs/60 text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]",
			subtext:"text-base-content/60"},f_={btn:{root:[F_.btn.root,"tooltip-left"],icon:F_.btn.icon},btnText:{
			root:F_.btnText.root}},y_=["disabled"],B_=defineComponent({__name:"StarButton",props:{isMark:{type:[Boolean,null]},onToggleMark:{
			type:Function}},emits:["toggleMark"],setup(_,{emit:n}){const o=_,r=n,i={...f_},D=computed(()=>null!==o.isMark)
			;function handleToggleMark(){o.onToggleMark&&o.onToggleMark(),r("toggleMark");}return (_,e)=>(openBlock(),createElementBlock("button",{
			class:normalizeClass([i.btn.root]),disabled:!D.value,"data-tip":"收藏",onClick:handleToggleMark},[createVNode(unref(ct$1),{class:normalizeClass([i.btn.icon]),
			icon:_.isMark?unref(_t$1):unref(Et$1)},null,8,["class","icon"])],10,y_))}});var h_=(_=>(_.STOP="stop",_.REPEAT_ONE="repeat_one",
			_.AUTO_NEXT="auto_next",_))(h_||{});const g_={stop:"播放完停止",repeat_one:"单集循环",auto_next:"自动下一集"},U_={
			stop:"material-symbols:pause-rounded",repeat_one:"material-symbols:restart-alt-rounded",
			auto_next:"material-symbols:fast-forward-rounded"},b_={stop:"播放完成后暂停",repeat_one:"播放完成后重新播放当前视频",
			auto_next:"播放完成后自动播放下一集"}
			;var X_,k_,Y_,G_,H_,w_,x_,K_,W_,$_,Q_,q_,j_,z_,J_,Z_,_e,ee,te,Ae,ae,le,Ce,ne,oe,re,ie,De,Ee,se,Ve,ue,Ie,Oe,Te,Pe,ce,de,Me,ve,Re,Le,Ne,pe,Se,me,Fe,fe,ye,Be,he,ge,Ue,be,Xe,ke,Ye,Ge,He,we,xe,Ke,We,$e,Qe,qe,je,ze,Je,Ze,_t,et,tt,At,at,lt,Ct,nt,ot,rt,it,Dt,Et,st,Vt,ut,It,Ot,Tt,Pt,ct,dt,Mt,vt,Rt,Lt,Nt,pt,St=(_=>(_.Native="Native",
			_.AvPlayer="AvPlayer",_.Hls="HLS.js",_))(St||{});(k_=X_||(X_={}))[k_.AV_CODEC_ID_NONE=0]="AV_CODEC_ID_NONE",
			k_[k_.AV_CODEC_ID_MPEG1VIDEO=1]="AV_CODEC_ID_MPEG1VIDEO",k_[k_.AV_CODEC_ID_MPEG2VIDEO=2]="AV_CODEC_ID_MPEG2VIDEO",
			k_[k_.AV_CODEC_ID_H261=3]="AV_CODEC_ID_H261",k_[k_.AV_CODEC_ID_H263=4]="AV_CODEC_ID_H263",
			k_[k_.AV_CODEC_ID_RV10=5]="AV_CODEC_ID_RV10",k_[k_.AV_CODEC_ID_RV20=6]="AV_CODEC_ID_RV20",
			k_[k_.AV_CODEC_ID_MJPEG=7]="AV_CODEC_ID_MJPEG",k_[k_.AV_CODEC_ID_MJPEGB=8]="AV_CODEC_ID_MJPEGB",
			k_[k_.AV_CODEC_ID_LJPEG=9]="AV_CODEC_ID_LJPEG",k_[k_.AV_CODEC_ID_SP5X=10]="AV_CODEC_ID_SP5X",
			k_[k_.AV_CODEC_ID_JPEGLS=11]="AV_CODEC_ID_JPEGLS",k_[k_.AV_CODEC_ID_MPEG4=12]="AV_CODEC_ID_MPEG4",
			k_[k_.AV_CODEC_ID_RAWVIDEO=13]="AV_CODEC_ID_RAWVIDEO",k_[k_.AV_CODEC_ID_MSMPEG4V1=14]="AV_CODEC_ID_MSMPEG4V1",
			k_[k_.AV_CODEC_ID_MSMPEG4V2=15]="AV_CODEC_ID_MSMPEG4V2",k_[k_.AV_CODEC_ID_MSMPEG4V3=16]="AV_CODEC_ID_MSMPEG4V3",
			k_[k_.AV_CODEC_ID_WMV1=17]="AV_CODEC_ID_WMV1",k_[k_.AV_CODEC_ID_WMV2=18]="AV_CODEC_ID_WMV2",
			k_[k_.AV_CODEC_ID_H263P=19]="AV_CODEC_ID_H263P",k_[k_.AV_CODEC_ID_H263I=20]="AV_CODEC_ID_H263I",
			k_[k_.AV_CODEC_ID_FLV1=21]="AV_CODEC_ID_FLV1",k_[k_.AV_CODEC_ID_SVQ1=22]="AV_CODEC_ID_SVQ1",
			k_[k_.AV_CODEC_ID_SVQ3=23]="AV_CODEC_ID_SVQ3",k_[k_.AV_CODEC_ID_DVVIDEO=24]="AV_CODEC_ID_DVVIDEO",
			k_[k_.AV_CODEC_ID_HUFFYUV=25]="AV_CODEC_ID_HUFFYUV",k_[k_.AV_CODEC_ID_CYUV=26]="AV_CODEC_ID_CYUV",
			k_[k_.AV_CODEC_ID_H264=27]="AV_CODEC_ID_H264",k_[k_.AV_CODEC_ID_INDEO3=28]="AV_CODEC_ID_INDEO3",
			k_[k_.AV_CODEC_ID_VP3=29]="AV_CODEC_ID_VP3",k_[k_.AV_CODEC_ID_THEORA=30]="AV_CODEC_ID_THEORA",
			k_[k_.AV_CODEC_ID_ASV1=31]="AV_CODEC_ID_ASV1",k_[k_.AV_CODEC_ID_ASV2=32]="AV_CODEC_ID_ASV2",
			k_[k_.AV_CODEC_ID_FFV1=33]="AV_CODEC_ID_FFV1",k_[k_.AV_CODEC_ID_4XM=34]="AV_CODEC_ID_4XM",
			k_[k_.AV_CODEC_ID_VCR1=35]="AV_CODEC_ID_VCR1",k_[k_.AV_CODEC_ID_CLJR=36]="AV_CODEC_ID_CLJR",
			k_[k_.AV_CODEC_ID_MDEC=37]="AV_CODEC_ID_MDEC",k_[k_.AV_CODEC_ID_ROQ=38]="AV_CODEC_ID_ROQ",
			k_[k_.AV_CODEC_ID_INTERPLAY_VIDEO=39]="AV_CODEC_ID_INTERPLAY_VIDEO",k_[k_.AV_CODEC_ID_XAN_WC3=40]="AV_CODEC_ID_XAN_WC3",
			k_[k_.AV_CODEC_ID_XAN_WC4=41]="AV_CODEC_ID_XAN_WC4",k_[k_.AV_CODEC_ID_RPZA=42]="AV_CODEC_ID_RPZA",
			k_[k_.AV_CODEC_ID_CINEPAK=43]="AV_CODEC_ID_CINEPAK",k_[k_.AV_CODEC_ID_WS_VQA=44]="AV_CODEC_ID_WS_VQA",
			k_[k_.AV_CODEC_ID_MSRLE=45]="AV_CODEC_ID_MSRLE",k_[k_.AV_CODEC_ID_MSVIDEO1=46]="AV_CODEC_ID_MSVIDEO1",
			k_[k_.AV_CODEC_ID_IDCIN=47]="AV_CODEC_ID_IDCIN",k_[k_.AV_CODEC_ID_8BPS=48]="AV_CODEC_ID_8BPS",
			k_[k_.AV_CODEC_ID_SMC=49]="AV_CODEC_ID_SMC",k_[k_.AV_CODEC_ID_FLIC=50]="AV_CODEC_ID_FLIC",
			k_[k_.AV_CODEC_ID_TRUEMOTION1=51]="AV_CODEC_ID_TRUEMOTION1",k_[k_.AV_CODEC_ID_VMDVIDEO=52]="AV_CODEC_ID_VMDVIDEO",
			k_[k_.AV_CODEC_ID_MSZH=53]="AV_CODEC_ID_MSZH",k_[k_.AV_CODEC_ID_ZLIB=54]="AV_CODEC_ID_ZLIB",
			k_[k_.AV_CODEC_ID_QTRLE=55]="AV_CODEC_ID_QTRLE",k_[k_.AV_CODEC_ID_TSCC=56]="AV_CODEC_ID_TSCC",
			k_[k_.AV_CODEC_ID_ULTI=57]="AV_CODEC_ID_ULTI",k_[k_.AV_CODEC_ID_QDRAW=58]="AV_CODEC_ID_QDRAW",
			k_[k_.AV_CODEC_ID_VIXL=59]="AV_CODEC_ID_VIXL",k_[k_.AV_CODEC_ID_QPEG=60]="AV_CODEC_ID_QPEG",
			k_[k_.AV_CODEC_ID_PNG=61]="AV_CODEC_ID_PNG",k_[k_.AV_CODEC_ID_PPM=62]="AV_CODEC_ID_PPM",
			k_[k_.AV_CODEC_ID_PBM=63]="AV_CODEC_ID_PBM",k_[k_.AV_CODEC_ID_PGM=64]="AV_CODEC_ID_PGM",
			k_[k_.AV_CODEC_ID_PGMYUV=65]="AV_CODEC_ID_PGMYUV",k_[k_.AV_CODEC_ID_PAM=66]="AV_CODEC_ID_PAM",
			k_[k_.AV_CODEC_ID_FFVHUFF=67]="AV_CODEC_ID_FFVHUFF",k_[k_.AV_CODEC_ID_RV30=68]="AV_CODEC_ID_RV30",
			k_[k_.AV_CODEC_ID_RV40=69]="AV_CODEC_ID_RV40",k_[k_.AV_CODEC_ID_VC1=70]="AV_CODEC_ID_VC1",
			k_[k_.AV_CODEC_ID_WMV3=71]="AV_CODEC_ID_WMV3",k_[k_.AV_CODEC_ID_LOCO=72]="AV_CODEC_ID_LOCO",
			k_[k_.AV_CODEC_ID_WNV1=73]="AV_CODEC_ID_WNV1",k_[k_.AV_CODEC_ID_AASC=74]="AV_CODEC_ID_AASC",
			k_[k_.AV_CODEC_ID_INDEO2=75]="AV_CODEC_ID_INDEO2",k_[k_.AV_CODEC_ID_FRAPS=76]="AV_CODEC_ID_FRAPS",
			k_[k_.AV_CODEC_ID_TRUEMOTION2=77]="AV_CODEC_ID_TRUEMOTION2",k_[k_.AV_CODEC_ID_BMP=78]="AV_CODEC_ID_BMP",
			k_[k_.AV_CODEC_ID_CSCD=79]="AV_CODEC_ID_CSCD",k_[k_.AV_CODEC_ID_MMVIDEO=80]="AV_CODEC_ID_MMVIDEO",
			k_[k_.AV_CODEC_ID_ZMBV=81]="AV_CODEC_ID_ZMBV",k_[k_.AV_CODEC_ID_AVS=82]="AV_CODEC_ID_AVS",
			k_[k_.AV_CODEC_ID_SMACKVIDEO=83]="AV_CODEC_ID_SMACKVIDEO",k_[k_.AV_CODEC_ID_NUV=84]="AV_CODEC_ID_NUV",
			k_[k_.AV_CODEC_ID_KMVC=85]="AV_CODEC_ID_KMVC",k_[k_.AV_CODEC_ID_FLASHSV=86]="AV_CODEC_ID_FLASHSV",
			k_[k_.AV_CODEC_ID_CAVS=87]="AV_CODEC_ID_CAVS",k_[k_.AV_CODEC_ID_JPEG2000=88]="AV_CODEC_ID_JPEG2000",
			k_[k_.AV_CODEC_ID_VMNC=89]="AV_CODEC_ID_VMNC",k_[k_.AV_CODEC_ID_VP5=90]="AV_CODEC_ID_VP5",
			k_[k_.AV_CODEC_ID_VP6=91]="AV_CODEC_ID_VP6",k_[k_.AV_CODEC_ID_VP6F=92]="AV_CODEC_ID_VP6F",
			k_[k_.AV_CODEC_ID_TARGA=93]="AV_CODEC_ID_TARGA",k_[k_.AV_CODEC_ID_DSICINVIDEO=94]="AV_CODEC_ID_DSICINVIDEO",
			k_[k_.AV_CODEC_ID_TIERTEXSEQVIDEO=95]="AV_CODEC_ID_TIERTEXSEQVIDEO",k_[k_.AV_CODEC_ID_TIFF=96]="AV_CODEC_ID_TIFF",
			k_[k_.AV_CODEC_ID_GIF=97]="AV_CODEC_ID_GIF",k_[k_.AV_CODEC_ID_DXA=98]="AV_CODEC_ID_DXA",
			k_[k_.AV_CODEC_ID_DNXHD=99]="AV_CODEC_ID_DNXHD",k_[k_.AV_CODEC_ID_THP=100]="AV_CODEC_ID_THP",
			k_[k_.AV_CODEC_ID_SGI=101]="AV_CODEC_ID_SGI",k_[k_.AV_CODEC_ID_C93=102]="AV_CODEC_ID_C93",
			k_[k_.AV_CODEC_ID_BETHSOFTVID=103]="AV_CODEC_ID_BETHSOFTVID",k_[k_.AV_CODEC_ID_PTX=104]="AV_CODEC_ID_PTX",
			k_[k_.AV_CODEC_ID_TXD=105]="AV_CODEC_ID_TXD",k_[k_.AV_CODEC_ID_VP6A=106]="AV_CODEC_ID_VP6A",
			k_[k_.AV_CODEC_ID_AMV=107]="AV_CODEC_ID_AMV",k_[k_.AV_CODEC_ID_VB=108]="AV_CODEC_ID_VB",
			k_[k_.AV_CODEC_ID_PCX=109]="AV_CODEC_ID_PCX",k_[k_.AV_CODEC_ID_SUNRAST=110]="AV_CODEC_ID_SUNRAST",
			k_[k_.AV_CODEC_ID_INDEO4=111]="AV_CODEC_ID_INDEO4",k_[k_.AV_CODEC_ID_INDEO5=112]="AV_CODEC_ID_INDEO5",
			k_[k_.AV_CODEC_ID_MIMIC=113]="AV_CODEC_ID_MIMIC",k_[k_.AV_CODEC_ID_RL2=114]="AV_CODEC_ID_RL2",
			k_[k_.AV_CODEC_ID_ESCAPE124=115]="AV_CODEC_ID_ESCAPE124",k_[k_.AV_CODEC_ID_DIRAC=116]="AV_CODEC_ID_DIRAC",
			k_[k_.AV_CODEC_ID_BFI=117]="AV_CODEC_ID_BFI",k_[k_.AV_CODEC_ID_CMV=118]="AV_CODEC_ID_CMV",
			k_[k_.AV_CODEC_ID_MOTIONPIXELS=119]="AV_CODEC_ID_MOTIONPIXELS",k_[k_.AV_CODEC_ID_TGV=120]="AV_CODEC_ID_TGV",
			k_[k_.AV_CODEC_ID_TGQ=121]="AV_CODEC_ID_TGQ",k_[k_.AV_CODEC_ID_TQI=122]="AV_CODEC_ID_TQI",
			k_[k_.AV_CODEC_ID_AURA=123]="AV_CODEC_ID_AURA",k_[k_.AV_CODEC_ID_AURA2=124]="AV_CODEC_ID_AURA2",
			k_[k_.AV_CODEC_ID_V210X=125]="AV_CODEC_ID_V210X",k_[k_.AV_CODEC_ID_TMV=126]="AV_CODEC_ID_TMV",
			k_[k_.AV_CODEC_ID_V210=127]="AV_CODEC_ID_V210",k_[k_.AV_CODEC_ID_DPX=128]="AV_CODEC_ID_DPX",
			k_[k_.AV_CODEC_ID_MAD=129]="AV_CODEC_ID_MAD",k_[k_.AV_CODEC_ID_FRWU=130]="AV_CODEC_ID_FRWU",
			k_[k_.AV_CODEC_ID_FLASHSV2=131]="AV_CODEC_ID_FLASHSV2",k_[k_.AV_CODEC_ID_CDGRAPHICS=132]="AV_CODEC_ID_CDGRAPHICS",
			k_[k_.AV_CODEC_ID_R210=133]="AV_CODEC_ID_R210",k_[k_.AV_CODEC_ID_ANM=134]="AV_CODEC_ID_ANM",
			k_[k_.AV_CODEC_ID_BINKVIDEO=135]="AV_CODEC_ID_BINKVIDEO",k_[k_.AV_CODEC_ID_IFF_ILBM=136]="AV_CODEC_ID_IFF_ILBM",
			k_[k_.AV_CODEC_ID_IFF_BYTERUN1=136]="AV_CODEC_ID_IFF_BYTERUN1",k_[k_.AV_CODEC_ID_KGV1=137]="AV_CODEC_ID_KGV1",
			k_[k_.AV_CODEC_ID_YOP=138]="AV_CODEC_ID_YOP",k_[k_.AV_CODEC_ID_VP8=139]="AV_CODEC_ID_VP8",
			k_[k_.AV_CODEC_ID_PICTOR=140]="AV_CODEC_ID_PICTOR",k_[k_.AV_CODEC_ID_ANSI=141]="AV_CODEC_ID_ANSI",
			k_[k_.AV_CODEC_ID_A64_MULTI=142]="AV_CODEC_ID_A64_MULTI",k_[k_.AV_CODEC_ID_A64_MULTI5=143]="AV_CODEC_ID_A64_MULTI5",
			k_[k_.AV_CODEC_ID_R10K=144]="AV_CODEC_ID_R10K",k_[k_.AV_CODEC_ID_MXPEG=145]="AV_CODEC_ID_MXPEG",
			k_[k_.AV_CODEC_ID_LAGARITH=146]="AV_CODEC_ID_LAGARITH",k_[k_.AV_CODEC_ID_PRORES=147]="AV_CODEC_ID_PRORES",
			k_[k_.AV_CODEC_ID_JV=148]="AV_CODEC_ID_JV",k_[k_.AV_CODEC_ID_DFA=149]="AV_CODEC_ID_DFA",
			k_[k_.AV_CODEC_ID_WMV3IMAGE=150]="AV_CODEC_ID_WMV3IMAGE",k_[k_.AV_CODEC_ID_VC1IMAGE=151]="AV_CODEC_ID_VC1IMAGE",
			k_[k_.AV_CODEC_ID_UTVIDEO=152]="AV_CODEC_ID_UTVIDEO",k_[k_.AV_CODEC_ID_BMV_VIDEO=153]="AV_CODEC_ID_BMV_VIDEO",
			k_[k_.AV_CODEC_ID_VBLE=154]="AV_CODEC_ID_VBLE",k_[k_.AV_CODEC_ID_DXTORY=155]="AV_CODEC_ID_DXTORY",
			k_[k_.AV_CODEC_ID_V410=156]="AV_CODEC_ID_V410",k_[k_.AV_CODEC_ID_XWD=157]="AV_CODEC_ID_XWD",
			k_[k_.AV_CODEC_ID_CDXL=158]="AV_CODEC_ID_CDXL",k_[k_.AV_CODEC_ID_XBM=159]="AV_CODEC_ID_XBM",
			k_[k_.AV_CODEC_ID_ZEROCODEC=160]="AV_CODEC_ID_ZEROCODEC",k_[k_.AV_CODEC_ID_MSS1=161]="AV_CODEC_ID_MSS1",
			k_[k_.AV_CODEC_ID_MSA1=162]="AV_CODEC_ID_MSA1",k_[k_.AV_CODEC_ID_TSCC2=163]="AV_CODEC_ID_TSCC2",
			k_[k_.AV_CODEC_ID_MTS2=164]="AV_CODEC_ID_MTS2",k_[k_.AV_CODEC_ID_CLLC=165]="AV_CODEC_ID_CLLC",
			k_[k_.AV_CODEC_ID_MSS2=166]="AV_CODEC_ID_MSS2",k_[k_.AV_CODEC_ID_VP9=167]="AV_CODEC_ID_VP9",
			k_[k_.AV_CODEC_ID_AIC=168]="AV_CODEC_ID_AIC",k_[k_.AV_CODEC_ID_ESCAPE130=169]="AV_CODEC_ID_ESCAPE130",
			k_[k_.AV_CODEC_ID_G2M=170]="AV_CODEC_ID_G2M",k_[k_.AV_CODEC_ID_WEBP=171]="AV_CODEC_ID_WEBP",
			k_[k_.AV_CODEC_ID_HNM4_VIDEO=172]="AV_CODEC_ID_HNM4_VIDEO",k_[k_.AV_CODEC_ID_HEVC=173]="AV_CODEC_ID_HEVC",
			k_[k_.AV_CODEC_ID_H265=173]="AV_CODEC_ID_H265",k_[k_.AV_CODEC_ID_FIC=174]="AV_CODEC_ID_FIC",
			k_[k_.AV_CODEC_ID_ALIAS_PIX=175]="AV_CODEC_ID_ALIAS_PIX",k_[k_.AV_CODEC_ID_BRENDER_PIX=176]="AV_CODEC_ID_BRENDER_PIX",
			k_[k_.AV_CODEC_ID_PAF_VIDEO=177]="AV_CODEC_ID_PAF_VIDEO",k_[k_.AV_CODEC_ID_EXR=178]="AV_CODEC_ID_EXR",
			k_[k_.AV_CODEC_ID_VP7=179]="AV_CODEC_ID_VP7",k_[k_.AV_CODEC_ID_SANM=180]="AV_CODEC_ID_SANM",
			k_[k_.AV_CODEC_ID_SGIRLE=181]="AV_CODEC_ID_SGIRLE",k_[k_.AV_CODEC_ID_MVC1=182]="AV_CODEC_ID_MVC1",
			k_[k_.AV_CODEC_ID_MVC2=183]="AV_CODEC_ID_MVC2",k_[k_.AV_CODEC_ID_HQX=184]="AV_CODEC_ID_HQX",
			k_[k_.AV_CODEC_ID_TDSC=185]="AV_CODEC_ID_TDSC",k_[k_.AV_CODEC_ID_HQ_HQA=186]="AV_CODEC_ID_HQ_HQA",
			k_[k_.AV_CODEC_ID_HAP=187]="AV_CODEC_ID_HAP",k_[k_.AV_CODEC_ID_DDS=188]="AV_CODEC_ID_DDS",
			k_[k_.AV_CODEC_ID_DXV=189]="AV_CODEC_ID_DXV",k_[k_.AV_CODEC_ID_SCREENPRESSO=190]="AV_CODEC_ID_SCREENPRESSO",
			k_[k_.AV_CODEC_ID_RSCC=191]="AV_CODEC_ID_RSCC",k_[k_.AV_CODEC_ID_AVS2=192]="AV_CODEC_ID_AVS2",
			k_[k_.AV_CODEC_ID_PGX=193]="AV_CODEC_ID_PGX",k_[k_.AV_CODEC_ID_AVS3=194]="AV_CODEC_ID_AVS3",
			k_[k_.AV_CODEC_ID_MSP2=195]="AV_CODEC_ID_MSP2",k_[k_.AV_CODEC_ID_VVC=196]="AV_CODEC_ID_VVC",
			k_[k_.AV_CODEC_ID_H266=196]="AV_CODEC_ID_H266",k_[k_.AV_CODEC_ID_Y41P=197]="AV_CODEC_ID_Y41P",
			k_[k_.AV_CODEC_ID_AVRP=198]="AV_CODEC_ID_AVRP",k_[k_.AV_CODEC_ID_012V=199]="AV_CODEC_ID_012V",
			k_[k_.AV_CODEC_ID_AVUI=200]="AV_CODEC_ID_AVUI",k_[k_.AV_CODEC_ID_TARGA_Y216=201]="AV_CODEC_ID_TARGA_Y216",
			k_[k_.AV_CODEC_ID_V308=202]="AV_CODEC_ID_V308",k_[k_.AV_CODEC_ID_V408=203]="AV_CODEC_ID_V408",
			k_[k_.AV_CODEC_ID_YUV4=204]="AV_CODEC_ID_YUV4",k_[k_.AV_CODEC_ID_AVRN=205]="AV_CODEC_ID_AVRN",
			k_[k_.AV_CODEC_ID_CPIA=206]="AV_CODEC_ID_CPIA",k_[k_.AV_CODEC_ID_XFACE=207]="AV_CODEC_ID_XFACE",
			k_[k_.AV_CODEC_ID_SNOW=208]="AV_CODEC_ID_SNOW",k_[k_.AV_CODEC_ID_SMVJPEG=209]="AV_CODEC_ID_SMVJPEG",
			k_[k_.AV_CODEC_ID_APNG=210]="AV_CODEC_ID_APNG",k_[k_.AV_CODEC_ID_DAALA=211]="AV_CODEC_ID_DAALA",
			k_[k_.AV_CODEC_ID_CFHD=212]="AV_CODEC_ID_CFHD",k_[k_.AV_CODEC_ID_TRUEMOTION2RT=213]="AV_CODEC_ID_TRUEMOTION2RT",
			k_[k_.AV_CODEC_ID_M101=214]="AV_CODEC_ID_M101",k_[k_.AV_CODEC_ID_MAGICYUV=215]="AV_CODEC_ID_MAGICYUV",
			k_[k_.AV_CODEC_ID_SHEERVIDEO=216]="AV_CODEC_ID_SHEERVIDEO",k_[k_.AV_CODEC_ID_YLC=217]="AV_CODEC_ID_YLC",
			k_[k_.AV_CODEC_ID_PSD=218]="AV_CODEC_ID_PSD",k_[k_.AV_CODEC_ID_PIXLET=219]="AV_CODEC_ID_PIXLET",
			k_[k_.AV_CODEC_ID_SPEEDHQ=220]="AV_CODEC_ID_SPEEDHQ",k_[k_.AV_CODEC_ID_FMVC=221]="AV_CODEC_ID_FMVC",
			k_[k_.AV_CODEC_ID_SCPR=222]="AV_CODEC_ID_SCPR",k_[k_.AV_CODEC_ID_CLEARVIDEO=223]="AV_CODEC_ID_CLEARVIDEO",
			k_[k_.AV_CODEC_ID_XPM=224]="AV_CODEC_ID_XPM",k_[k_.AV_CODEC_ID_AV1=225]="AV_CODEC_ID_AV1",
			k_[k_.AV_CODEC_ID_BITPACKED=226]="AV_CODEC_ID_BITPACKED",k_[k_.AV_CODEC_ID_MSCC=227]="AV_CODEC_ID_MSCC",
			k_[k_.AV_CODEC_ID_SRGC=228]="AV_CODEC_ID_SRGC",k_[k_.AV_CODEC_ID_SVG=229]="AV_CODEC_ID_SVG",
			k_[k_.AV_CODEC_ID_GDV=230]="AV_CODEC_ID_GDV",k_[k_.AV_CODEC_ID_FITS=231]="AV_CODEC_ID_FITS",
			k_[k_.AV_CODEC_ID_IMM4=232]="AV_CODEC_ID_IMM4",k_[k_.AV_CODEC_ID_PROSUMER=233]="AV_CODEC_ID_PROSUMER",
			k_[k_.AV_CODEC_ID_MWSC=234]="AV_CODEC_ID_MWSC",k_[k_.AV_CODEC_ID_WCMV=235]="AV_CODEC_ID_WCMV",
			k_[k_.AV_CODEC_ID_RASC=236]="AV_CODEC_ID_RASC",k_[k_.AV_CODEC_ID_HYMT=237]="AV_CODEC_ID_HYMT",
			k_[k_.AV_CODEC_ID_ARBC=238]="AV_CODEC_ID_ARBC",k_[k_.AV_CODEC_ID_AGM=239]="AV_CODEC_ID_AGM",
			k_[k_.AV_CODEC_ID_LSCR=240]="AV_CODEC_ID_LSCR",k_[k_.AV_CODEC_ID_VP4=241]="AV_CODEC_ID_VP4",
			k_[k_.AV_CODEC_ID_IMM5=242]="AV_CODEC_ID_IMM5",k_[k_.AV_CODEC_ID_MVDV=243]="AV_CODEC_ID_MVDV",
			k_[k_.AV_CODEC_ID_MVHA=244]="AV_CODEC_ID_MVHA",k_[k_.AV_CODEC_ID_CDTOONS=245]="AV_CODEC_ID_CDTOONS",
			k_[k_.AV_CODEC_ID_MV30=246]="AV_CODEC_ID_MV30",k_[k_.AV_CODEC_ID_NOTCHLC=247]="AV_CODEC_ID_NOTCHLC",
			k_[k_.AV_CODEC_ID_PFM=248]="AV_CODEC_ID_PFM",k_[k_.AV_CODEC_ID_MOBICLIP=249]="AV_CODEC_ID_MOBICLIP",
			k_[k_.AV_CODEC_ID_PHOTOCD=250]="AV_CODEC_ID_PHOTOCD",k_[k_.AV_CODEC_ID_IPU=251]="AV_CODEC_ID_IPU",
			k_[k_.AV_CODEC_ID_ARGO=252]="AV_CODEC_ID_ARGO",k_[k_.AV_CODEC_ID_CRI=253]="AV_CODEC_ID_CRI",
			k_[k_.AV_CODEC_ID_SIMBIOSIS_IMX=254]="AV_CODEC_ID_SIMBIOSIS_IMX",
			k_[k_.AV_CODEC_ID_SGA_VIDEO=255]="AV_CODEC_ID_SGA_VIDEO",k_[k_.AV_CODEC_ID_GEM=256]="AV_CODEC_ID_GEM",
			k_[k_.AV_CODEC_ID_VBN=257]="AV_CODEC_ID_VBN",k_[k_.AV_CODEC_ID_JPEGXL=258]="AV_CODEC_ID_JPEGXL",
			k_[k_.AV_CODEC_ID_QOI=259]="AV_CODEC_ID_QOI",k_[k_.AV_CODEC_ID_PHM=260]="AV_CODEC_ID_PHM",
			k_[k_.AV_CODEC_ID_RADIANCE_HDR=261]="AV_CODEC_ID_RADIANCE_HDR",k_[k_.AV_CODEC_ID_WBMP=262]="AV_CODEC_ID_WBMP",
			k_[k_.AV_CODEC_ID_MEDIA100=263]="AV_CODEC_ID_MEDIA100",k_[k_.AV_CODEC_ID_VQC=264]="AV_CODEC_ID_VQC",
			k_[k_.AV_CODEC_ID_PDV=265]="AV_CODEC_ID_PDV",k_[k_.AV_CODEC_ID_EVC=266]="AV_CODEC_ID_EVC",
			k_[k_.AV_CODEC_ID_RTV1=267]="AV_CODEC_ID_RTV1",k_[k_.AV_CODEC_ID_VMIX=268]="AV_CODEC_ID_VMIX",
			k_[k_.AV_CODEC_ID_LEAD=269]="AV_CODEC_ID_LEAD",k_[k_.AV_CODEC_ID_FIRST_AUDIO=65536]="AV_CODEC_ID_FIRST_AUDIO",
			k_[k_.AV_CODEC_ID_PCM_S16LE=65536]="AV_CODEC_ID_PCM_S16LE",k_[k_.AV_CODEC_ID_PCM_S16BE=65537]="AV_CODEC_ID_PCM_S16BE",
			k_[k_.AV_CODEC_ID_PCM_U16LE=65538]="AV_CODEC_ID_PCM_U16LE",k_[k_.AV_CODEC_ID_PCM_U16BE=65539]="AV_CODEC_ID_PCM_U16BE",
			k_[k_.AV_CODEC_ID_PCM_S8=65540]="AV_CODEC_ID_PCM_S8",k_[k_.AV_CODEC_ID_PCM_U8=65541]="AV_CODEC_ID_PCM_U8",
			k_[k_.AV_CODEC_ID_PCM_MULAW=65542]="AV_CODEC_ID_PCM_MULAW",k_[k_.AV_CODEC_ID_PCM_ALAW=65543]="AV_CODEC_ID_PCM_ALAW",
			k_[k_.AV_CODEC_ID_PCM_S32LE=65544]="AV_CODEC_ID_PCM_S32LE",k_[k_.AV_CODEC_ID_PCM_S32BE=65545]="AV_CODEC_ID_PCM_S32BE",
			k_[k_.AV_CODEC_ID_PCM_U32LE=65546]="AV_CODEC_ID_PCM_U32LE",k_[k_.AV_CODEC_ID_PCM_U32BE=65547]="AV_CODEC_ID_PCM_U32BE",
			k_[k_.AV_CODEC_ID_PCM_S24LE=65548]="AV_CODEC_ID_PCM_S24LE",k_[k_.AV_CODEC_ID_PCM_S24BE=65549]="AV_CODEC_ID_PCM_S24BE",
			k_[k_.AV_CODEC_ID_PCM_U24LE=65550]="AV_CODEC_ID_PCM_U24LE",k_[k_.AV_CODEC_ID_PCM_U24BE=65551]="AV_CODEC_ID_PCM_U24BE",
			k_[k_.AV_CODEC_ID_PCM_S24DAUD=65552]="AV_CODEC_ID_PCM_S24DAUD",k_[k_.AV_CODEC_ID_PCM_ZORK=65553]="AV_CODEC_ID_PCM_ZORK",
			k_[k_.AV_CODEC_ID_PCM_S16LE_PLANAR=65554]="AV_CODEC_ID_PCM_S16LE_PLANAR",
			k_[k_.AV_CODEC_ID_PCM_DVD=65555]="AV_CODEC_ID_PCM_DVD",k_[k_.AV_CODEC_ID_PCM_F32BE=65556]="AV_CODEC_ID_PCM_F32BE",
			k_[k_.AV_CODEC_ID_PCM_F32LE=65557]="AV_CODEC_ID_PCM_F32LE",k_[k_.AV_CODEC_ID_PCM_F64BE=65558]="AV_CODEC_ID_PCM_F64BE",
			k_[k_.AV_CODEC_ID_PCM_F64LE=65559]="AV_CODEC_ID_PCM_F64LE",k_[k_.AV_CODEC_ID_PCM_BLURAY=65560]="AV_CODEC_ID_PCM_BLURAY",
			k_[k_.AV_CODEC_ID_PCM_LXF=65561]="AV_CODEC_ID_PCM_LXF",k_[k_.AV_CODEC_ID_S302M=65562]="AV_CODEC_ID_S302M",
			k_[k_.AV_CODEC_ID_PCM_S8_PLANAR=65563]="AV_CODEC_ID_PCM_S8_PLANAR",
			k_[k_.AV_CODEC_ID_PCM_S24LE_PLANAR=65564]="AV_CODEC_ID_PCM_S24LE_PLANAR",
			k_[k_.AV_CODEC_ID_PCM_S32LE_PLANAR=65565]="AV_CODEC_ID_PCM_S32LE_PLANAR",
			k_[k_.AV_CODEC_ID_PCM_S16BE_PLANAR=65566]="AV_CODEC_ID_PCM_S16BE_PLANAR",
			k_[k_.AV_CODEC_ID_PCM_S64LE=65567]="AV_CODEC_ID_PCM_S64LE",k_[k_.AV_CODEC_ID_PCM_S64BE=65568]="AV_CODEC_ID_PCM_S64BE",
			k_[k_.AV_CODEC_ID_PCM_F16LE=65569]="AV_CODEC_ID_PCM_F16LE",k_[k_.AV_CODEC_ID_PCM_F24LE=65570]="AV_CODEC_ID_PCM_F24LE",
			k_[k_.AV_CODEC_ID_PCM_VIDC=65571]="AV_CODEC_ID_PCM_VIDC",k_[k_.AV_CODEC_ID_PCM_SGA=65572]="AV_CODEC_ID_PCM_SGA",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_QT=69632]="AV_CODEC_ID_ADPCM_IMA_QT",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_WAV=69633]="AV_CODEC_ID_ADPCM_IMA_WAV",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_DK3=69634]="AV_CODEC_ID_ADPCM_IMA_DK3",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_DK4=69635]="AV_CODEC_ID_ADPCM_IMA_DK4",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_WS=69636]="AV_CODEC_ID_ADPCM_IMA_WS",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_SMJPEG=69637]="AV_CODEC_ID_ADPCM_IMA_SMJPEG",
			k_[k_.AV_CODEC_ID_ADPCM_MS=69638]="AV_CODEC_ID_ADPCM_MS",k_[k_.AV_CODEC_ID_ADPCM_4XM=69639]="AV_CODEC_ID_ADPCM_4XM",
			k_[k_.AV_CODEC_ID_ADPCM_XA=69640]="AV_CODEC_ID_ADPCM_XA",k_[k_.AV_CODEC_ID_ADPCM_ADX=69641]="AV_CODEC_ID_ADPCM_ADX",
			k_[k_.AV_CODEC_ID_ADPCM_EA=69642]="AV_CODEC_ID_ADPCM_EA",k_[k_.AV_CODEC_ID_ADPCM_G726=69643]="AV_CODEC_ID_ADPCM_G726",
			k_[k_.AV_CODEC_ID_ADPCM_CT=69644]="AV_CODEC_ID_ADPCM_CT",k_[k_.AV_CODEC_ID_ADPCM_SWF=69645]="AV_CODEC_ID_ADPCM_SWF",
			k_[k_.AV_CODEC_ID_ADPCM_YAMAHA=69646]="AV_CODEC_ID_ADPCM_YAMAHA",
			k_[k_.AV_CODEC_ID_ADPCM_SBPRO_4=69647]="AV_CODEC_ID_ADPCM_SBPRO_4",
			k_[k_.AV_CODEC_ID_ADPCM_SBPRO_3=69648]="AV_CODEC_ID_ADPCM_SBPRO_3",
			k_[k_.AV_CODEC_ID_ADPCM_SBPRO_2=69649]="AV_CODEC_ID_ADPCM_SBPRO_2",
			k_[k_.AV_CODEC_ID_ADPCM_THP=69650]="AV_CODEC_ID_ADPCM_THP",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_AMV=69651]="AV_CODEC_ID_ADPCM_IMA_AMV",
			k_[k_.AV_CODEC_ID_ADPCM_EA_R1=69652]="AV_CODEC_ID_ADPCM_EA_R1",
			k_[k_.AV_CODEC_ID_ADPCM_EA_R3=69653]="AV_CODEC_ID_ADPCM_EA_R3",
			k_[k_.AV_CODEC_ID_ADPCM_EA_R2=69654]="AV_CODEC_ID_ADPCM_EA_R2",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_EA_SEAD=69655]="AV_CODEC_ID_ADPCM_IMA_EA_SEAD",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_EA_EACS=69656]="AV_CODEC_ID_ADPCM_IMA_EA_EACS",
			k_[k_.AV_CODEC_ID_ADPCM_EA_XAS=69657]="AV_CODEC_ID_ADPCM_EA_XAS",
			k_[k_.AV_CODEC_ID_ADPCM_EA_MAXIS_XA=69658]="AV_CODEC_ID_ADPCM_EA_MAXIS_XA",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_ISS=69659]="AV_CODEC_ID_ADPCM_IMA_ISS",
			k_[k_.AV_CODEC_ID_ADPCM_G722=69660]="AV_CODEC_ID_ADPCM_G722",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_APC=69661]="AV_CODEC_ID_ADPCM_IMA_APC",
			k_[k_.AV_CODEC_ID_ADPCM_VIMA=69662]="AV_CODEC_ID_ADPCM_VIMA",k_[k_.AV_CODEC_ID_ADPCM_AFC=69663]="AV_CODEC_ID_ADPCM_AFC",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_OKI=69664]="AV_CODEC_ID_ADPCM_IMA_OKI",
			k_[k_.AV_CODEC_ID_ADPCM_DTK=69665]="AV_CODEC_ID_ADPCM_DTK",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_RAD=69666]="AV_CODEC_ID_ADPCM_IMA_RAD",
			k_[k_.AV_CODEC_ID_ADPCM_G726LE=69667]="AV_CODEC_ID_ADPCM_G726LE",
			k_[k_.AV_CODEC_ID_ADPCM_THP_LE=69668]="AV_CODEC_ID_ADPCM_THP_LE",
			k_[k_.AV_CODEC_ID_ADPCM_PSX=69669]="AV_CODEC_ID_ADPCM_PSX",k_[k_.AV_CODEC_ID_ADPCM_AICA=69670]="AV_CODEC_ID_ADPCM_AICA",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_DAT4=69671]="AV_CODEC_ID_ADPCM_IMA_DAT4",
			k_[k_.AV_CODEC_ID_ADPCM_MTAF=69672]="AV_CODEC_ID_ADPCM_MTAF",k_[k_.AV_CODEC_ID_ADPCM_AGM=69673]="AV_CODEC_ID_ADPCM_AGM",
			k_[k_.AV_CODEC_ID_ADPCM_ARGO=69674]="AV_CODEC_ID_ADPCM_ARGO",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_SSI=69675]="AV_CODEC_ID_ADPCM_IMA_SSI",
			k_[k_.AV_CODEC_ID_ADPCM_ZORK=69676]="AV_CODEC_ID_ADPCM_ZORK",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_APM=69677]="AV_CODEC_ID_ADPCM_IMA_APM",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_ALP=69678]="AV_CODEC_ID_ADPCM_IMA_ALP",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_MTF=69679]="AV_CODEC_ID_ADPCM_IMA_MTF",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_CUNNING=69680]="AV_CODEC_ID_ADPCM_IMA_CUNNING",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_MOFLEX=69681]="AV_CODEC_ID_ADPCM_IMA_MOFLEX",
			k_[k_.AV_CODEC_ID_ADPCM_IMA_ACORN=69682]="AV_CODEC_ID_ADPCM_IMA_ACORN",
			k_[k_.AV_CODEC_ID_ADPCM_XMD=69683]="AV_CODEC_ID_ADPCM_XMD",k_[k_.AV_CODEC_ID_AMR_NB=73728]="AV_CODEC_ID_AMR_NB",
			k_[k_.AV_CODEC_ID_AMR_WB=73729]="AV_CODEC_ID_AMR_WB",k_[k_.AV_CODEC_ID_RA_144=77824]="AV_CODEC_ID_RA_144",
			k_[k_.AV_CODEC_ID_RA_288=77825]="AV_CODEC_ID_RA_288",k_[k_.AV_CODEC_ID_ROQ_DPCM=81920]="AV_CODEC_ID_ROQ_DPCM",
			k_[k_.AV_CODEC_ID_INTERPLAY_DPCM=81921]="AV_CODEC_ID_INTERPLAY_DPCM",
			k_[k_.AV_CODEC_ID_XAN_DPCM=81922]="AV_CODEC_ID_XAN_DPCM",k_[k_.AV_CODEC_ID_SOL_DPCM=81923]="AV_CODEC_ID_SOL_DPCM",
			k_[k_.AV_CODEC_ID_SDX2_DPCM=81924]="AV_CODEC_ID_SDX2_DPCM",
			k_[k_.AV_CODEC_ID_GREMLIN_DPCM=81925]="AV_CODEC_ID_GREMLIN_DPCM",
			k_[k_.AV_CODEC_ID_DERF_DPCM=81926]="AV_CODEC_ID_DERF_DPCM",k_[k_.AV_CODEC_ID_WADY_DPCM=81927]="AV_CODEC_ID_WADY_DPCM",
			k_[k_.AV_CODEC_ID_CBD2_DPCM=81928]="AV_CODEC_ID_CBD2_DPCM",k_[k_.AV_CODEC_ID_MP2=86016]="AV_CODEC_ID_MP2",
			k_[k_.AV_CODEC_ID_MP3=86017]="AV_CODEC_ID_MP3",k_[k_.AV_CODEC_ID_AAC=86018]="AV_CODEC_ID_AAC",
			k_[k_.AV_CODEC_ID_AC3=86019]="AV_CODEC_ID_AC3",k_[k_.AV_CODEC_ID_DTS=86020]="AV_CODEC_ID_DTS",
			k_[k_.AV_CODEC_ID_VORBIS=86021]="AV_CODEC_ID_VORBIS",k_[k_.AV_CODEC_ID_DVAUDIO=86022]="AV_CODEC_ID_DVAUDIO",
			k_[k_.AV_CODEC_ID_WMAV1=86023]="AV_CODEC_ID_WMAV1",k_[k_.AV_CODEC_ID_WMAV2=86024]="AV_CODEC_ID_WMAV2",
			k_[k_.AV_CODEC_ID_MACE3=86025]="AV_CODEC_ID_MACE3",k_[k_.AV_CODEC_ID_MACE6=86026]="AV_CODEC_ID_MACE6",
			k_[k_.AV_CODEC_ID_VMDAUDIO=86027]="AV_CODEC_ID_VMDAUDIO",k_[k_.AV_CODEC_ID_FLAC=86028]="AV_CODEC_ID_FLAC",
			k_[k_.AV_CODEC_ID_MP3ADU=86029]="AV_CODEC_ID_MP3ADU",k_[k_.AV_CODEC_ID_MP3ON4=86030]="AV_CODEC_ID_MP3ON4",
			k_[k_.AV_CODEC_ID_SHORTEN=86031]="AV_CODEC_ID_SHORTEN",k_[k_.AV_CODEC_ID_ALAC=86032]="AV_CODEC_ID_ALAC",
			k_[k_.AV_CODEC_ID_WESTWOOD_SND1=86033]="AV_CODEC_ID_WESTWOOD_SND1",k_[k_.AV_CODEC_ID_GSM=86034]="AV_CODEC_ID_GSM",
			k_[k_.AV_CODEC_ID_QDM2=86035]="AV_CODEC_ID_QDM2",k_[k_.AV_CODEC_ID_COOK=86036]="AV_CODEC_ID_COOK",
			k_[k_.AV_CODEC_ID_TRUESPEECH=86037]="AV_CODEC_ID_TRUESPEECH",k_[k_.AV_CODEC_ID_TTA=86038]="AV_CODEC_ID_TTA",
			k_[k_.AV_CODEC_ID_SMACKAUDIO=86039]="AV_CODEC_ID_SMACKAUDIO",k_[k_.AV_CODEC_ID_QCELP=86040]="AV_CODEC_ID_QCELP",
			k_[k_.AV_CODEC_ID_WAVPACK=86041]="AV_CODEC_ID_WAVPACK",k_[k_.AV_CODEC_ID_DSICINAUDIO=86042]="AV_CODEC_ID_DSICINAUDIO",
			k_[k_.AV_CODEC_ID_IMC=86043]="AV_CODEC_ID_IMC",k_[k_.AV_CODEC_ID_MUSEPACK7=86044]="AV_CODEC_ID_MUSEPACK7",
			k_[k_.AV_CODEC_ID_MLP=86045]="AV_CODEC_ID_MLP",k_[k_.AV_CODEC_ID_GSM_MS=86046]="AV_CODEC_ID_GSM_MS",
			k_[k_.AV_CODEC_ID_ATRAC3=86047]="AV_CODEC_ID_ATRAC3",k_[k_.AV_CODEC_ID_APE=86048]="AV_CODEC_ID_APE",
			k_[k_.AV_CODEC_ID_NELLYMOSER=86049]="AV_CODEC_ID_NELLYMOSER",k_[k_.AV_CODEC_ID_MUSEPACK8=86050]="AV_CODEC_ID_MUSEPACK8",
			k_[k_.AV_CODEC_ID_SPEEX=86051]="AV_CODEC_ID_SPEEX",k_[k_.AV_CODEC_ID_WMAVOICE=86052]="AV_CODEC_ID_WMAVOICE",
			k_[k_.AV_CODEC_ID_WMAPRO=86053]="AV_CODEC_ID_WMAPRO",k_[k_.AV_CODEC_ID_WMALOSSLESS=86054]="AV_CODEC_ID_WMALOSSLESS",
			k_[k_.AV_CODEC_ID_ATRAC3P=86055]="AV_CODEC_ID_ATRAC3P",k_[k_.AV_CODEC_ID_EAC3=86056]="AV_CODEC_ID_EAC3",
			k_[k_.AV_CODEC_ID_SIPR=86057]="AV_CODEC_ID_SIPR",k_[k_.AV_CODEC_ID_MP1=86058]="AV_CODEC_ID_MP1",
			k_[k_.AV_CODEC_ID_TWINVQ=86059]="AV_CODEC_ID_TWINVQ",k_[k_.AV_CODEC_ID_TRUEHD=86060]="AV_CODEC_ID_TRUEHD",
			k_[k_.AV_CODEC_ID_MP4ALS=86061]="AV_CODEC_ID_MP4ALS",k_[k_.AV_CODEC_ID_ATRAC1=86062]="AV_CODEC_ID_ATRAC1",
			k_[k_.AV_CODEC_ID_BINKAUDIO_RDFT=86063]="AV_CODEC_ID_BINKAUDIO_RDFT",
			k_[k_.AV_CODEC_ID_BINKAUDIO_DCT=86064]="AV_CODEC_ID_BINKAUDIO_DCT",
			k_[k_.AV_CODEC_ID_AAC_LATM=86065]="AV_CODEC_ID_AAC_LATM",k_[k_.AV_CODEC_ID_QDMC=86066]="AV_CODEC_ID_QDMC",
			k_[k_.AV_CODEC_ID_CELT=86067]="AV_CODEC_ID_CELT",k_[k_.AV_CODEC_ID_G723_1=86068]="AV_CODEC_ID_G723_1",
			k_[k_.AV_CODEC_ID_G729=86069]="AV_CODEC_ID_G729",k_[k_.AV_CODEC_ID_8SVX_EXP=86070]="AV_CODEC_ID_8SVX_EXP",
			k_[k_.AV_CODEC_ID_8SVX_FIB=86071]="AV_CODEC_ID_8SVX_FIB",k_[k_.AV_CODEC_ID_BMV_AUDIO=86072]="AV_CODEC_ID_BMV_AUDIO",
			k_[k_.AV_CODEC_ID_RALF=86073]="AV_CODEC_ID_RALF",k_[k_.AV_CODEC_ID_IAC=86074]="AV_CODEC_ID_IAC",
			k_[k_.AV_CODEC_ID_ILBC=86075]="AV_CODEC_ID_ILBC",k_[k_.AV_CODEC_ID_OPUS=86076]="AV_CODEC_ID_OPUS",
			k_[k_.AV_CODEC_ID_COMFORT_NOISE=86077]="AV_CODEC_ID_COMFORT_NOISE",k_[k_.AV_CODEC_ID_TAK=86078]="AV_CODEC_ID_TAK",
			k_[k_.AV_CODEC_ID_METASOUND=86079]="AV_CODEC_ID_METASOUND",k_[k_.AV_CODEC_ID_PAF_AUDIO=86080]="AV_CODEC_ID_PAF_AUDIO",
			k_[k_.AV_CODEC_ID_ON2AVC=86081]="AV_CODEC_ID_ON2AVC",k_[k_.AV_CODEC_ID_DSS_SP=86082]="AV_CODEC_ID_DSS_SP",
			k_[k_.AV_CODEC_ID_CODEC2=86083]="AV_CODEC_ID_CODEC2",k_[k_.AV_CODEC_ID_FFWAVESYNTH=86084]="AV_CODEC_ID_FFWAVESYNTH",
			k_[k_.AV_CODEC_ID_SONIC=86085]="AV_CODEC_ID_SONIC",k_[k_.AV_CODEC_ID_SONIC_LS=86086]="AV_CODEC_ID_SONIC_LS",
			k_[k_.AV_CODEC_ID_EVRC=86087]="AV_CODEC_ID_EVRC",k_[k_.AV_CODEC_ID_SMV=86088]="AV_CODEC_ID_SMV",
			k_[k_.AV_CODEC_ID_DSD_LSBF=86089]="AV_CODEC_ID_DSD_LSBF",k_[k_.AV_CODEC_ID_DSD_MSBF=86090]="AV_CODEC_ID_DSD_MSBF",
			k_[k_.AV_CODEC_ID_DSD_LSBF_PLANAR=86091]="AV_CODEC_ID_DSD_LSBF_PLANAR",
			k_[k_.AV_CODEC_ID_DSD_MSBF_PLANAR=86092]="AV_CODEC_ID_DSD_MSBF_PLANAR",k_[k_.AV_CODEC_ID_4GV=86093]="AV_CODEC_ID_4GV",
			k_[k_.AV_CODEC_ID_INTERPLAY_ACM=86094]="AV_CODEC_ID_INTERPLAY_ACM",k_[k_.AV_CODEC_ID_XMA1=86095]="AV_CODEC_ID_XMA1",
			k_[k_.AV_CODEC_ID_XMA2=86096]="AV_CODEC_ID_XMA2",k_[k_.AV_CODEC_ID_DST=86097]="AV_CODEC_ID_DST",
			k_[k_.AV_CODEC_ID_ATRAC3AL=86098]="AV_CODEC_ID_ATRAC3AL",k_[k_.AV_CODEC_ID_ATRAC3PAL=86099]="AV_CODEC_ID_ATRAC3PAL",
			k_[k_.AV_CODEC_ID_DOLBY_E=86100]="AV_CODEC_ID_DOLBY_E",k_[k_.AV_CODEC_ID_APTX=86101]="AV_CODEC_ID_APTX",
			k_[k_.AV_CODEC_ID_APTX_HD=86102]="AV_CODEC_ID_APTX_HD",k_[k_.AV_CODEC_ID_SBC=86103]="AV_CODEC_ID_SBC",
			k_[k_.AV_CODEC_ID_ATRAC9=86104]="AV_CODEC_ID_ATRAC9",k_[k_.AV_CODEC_ID_HCOM=86105]="AV_CODEC_ID_HCOM",
			k_[k_.AV_CODEC_ID_ACELP_KELVIN=86106]="AV_CODEC_ID_ACELP_KELVIN",
			k_[k_.AV_CODEC_ID_MPEGH_3D_AUDIO=86107]="AV_CODEC_ID_MPEGH_3D_AUDIO",k_[k_.AV_CODEC_ID_SIREN=86108]="AV_CODEC_ID_SIREN",
			k_[k_.AV_CODEC_ID_HCA=86109]="AV_CODEC_ID_HCA",k_[k_.AV_CODEC_ID_FASTAUDIO=86110]="AV_CODEC_ID_FASTAUDIO",
			k_[k_.AV_CODEC_ID_MSNSIREN=86111]="AV_CODEC_ID_MSNSIREN",k_[k_.AV_CODEC_ID_DFPWM=86112]="AV_CODEC_ID_DFPWM",
			k_[k_.AV_CODEC_ID_BONK=86113]="AV_CODEC_ID_BONK",k_[k_.AV_CODEC_ID_MISC4=86114]="AV_CODEC_ID_MISC4",
			k_[k_.AV_CODEC_ID_APAC=86115]="AV_CODEC_ID_APAC",k_[k_.AV_CODEC_ID_FTR=86116]="AV_CODEC_ID_FTR",
			k_[k_.AV_CODEC_ID_WAVARC=86117]="AV_CODEC_ID_WAVARC",k_[k_.AV_CODEC_ID_RKA=86118]="AV_CODEC_ID_RKA",
			k_[k_.AV_CODEC_ID_AC4=86119]="AV_CODEC_ID_AC4",k_[k_.AV_CODEC_ID_OSQ=86120]="AV_CODEC_ID_OSQ",
			k_[k_.AV_CODEC_ID_QOA=86121]="AV_CODEC_ID_QOA",k_[k_.AV_CODEC_ID_FIRST_SUBTITLE=94208]="AV_CODEC_ID_FIRST_SUBTITLE",
			k_[k_.AV_CODEC_ID_DVD_SUBTITLE=94208]="AV_CODEC_ID_DVD_SUBTITLE",
			k_[k_.AV_CODEC_ID_DVB_SUBTITLE=94209]="AV_CODEC_ID_DVB_SUBTITLE",k_[k_.AV_CODEC_ID_TEXT=94210]="AV_CODEC_ID_TEXT",
			k_[k_.AV_CODEC_ID_XSUB=94211]="AV_CODEC_ID_XSUB",k_[k_.AV_CODEC_ID_SSA=94212]="AV_CODEC_ID_SSA",
			k_[k_.AV_CODEC_ID_MOV_TEXT=94213]="AV_CODEC_ID_MOV_TEXT",
			k_[k_.AV_CODEC_ID_HDMV_PGS_SUBTITLE=94214]="AV_CODEC_ID_HDMV_PGS_SUBTITLE",
			k_[k_.AV_CODEC_ID_DVB_TELETEXT=94215]="AV_CODEC_ID_DVB_TELETEXT",k_[k_.AV_CODEC_ID_SRT=94216]="AV_CODEC_ID_SRT",
			k_[k_.AV_CODEC_ID_MICRODVD=94217]="AV_CODEC_ID_MICRODVD",k_[k_.AV_CODEC_ID_EIA_608=94218]="AV_CODEC_ID_EIA_608",
			k_[k_.AV_CODEC_ID_JACOSUB=94219]="AV_CODEC_ID_JACOSUB",k_[k_.AV_CODEC_ID_SAMI=94220]="AV_CODEC_ID_SAMI",
			k_[k_.AV_CODEC_ID_REALTEXT=94221]="AV_CODEC_ID_REALTEXT",k_[k_.AV_CODEC_ID_STL=94222]="AV_CODEC_ID_STL",
			k_[k_.AV_CODEC_ID_SUBVIEWER1=94223]="AV_CODEC_ID_SUBVIEWER1",k_[k_.AV_CODEC_ID_SUBVIEWER=94224]="AV_CODEC_ID_SUBVIEWER",
			k_[k_.AV_CODEC_ID_SUBRIP=94225]="AV_CODEC_ID_SUBRIP",k_[k_.AV_CODEC_ID_WEBVTT=94226]="AV_CODEC_ID_WEBVTT",
			k_[k_.AV_CODEC_ID_MPL2=94227]="AV_CODEC_ID_MPL2",k_[k_.AV_CODEC_ID_VPLAYER=94228]="AV_CODEC_ID_VPLAYER",
			k_[k_.AV_CODEC_ID_PJS=94229]="AV_CODEC_ID_PJS",k_[k_.AV_CODEC_ID_ASS=94230]="AV_CODEC_ID_ASS",
			k_[k_.AV_CODEC_ID_HDMV_TEXT_SUBTITLE=94231]="AV_CODEC_ID_HDMV_TEXT_SUBTITLE",
			k_[k_.AV_CODEC_ID_TTML=94232]="AV_CODEC_ID_TTML",k_[k_.AV_CODEC_ID_ARIB_CAPTION=94233]="AV_CODEC_ID_ARIB_CAPTION",
			k_[k_.AV_CODEC_ID_FIRST_UNKNOWN=98304]="AV_CODEC_ID_FIRST_UNKNOWN",k_[k_.AV_CODEC_ID_TTF=98304]="AV_CODEC_ID_TTF",
			k_[k_.AV_CODEC_ID_SCTE_35=98305]="AV_CODEC_ID_SCTE_35",k_[k_.AV_CODEC_ID_EPG=98306]="AV_CODEC_ID_EPG",
			k_[k_.AV_CODEC_ID_BINTEXT=98307]="AV_CODEC_ID_BINTEXT",k_[k_.AV_CODEC_ID_XBIN=98308]="AV_CODEC_ID_XBIN",
			k_[k_.AV_CODEC_ID_IDF=98309]="AV_CODEC_ID_IDF",k_[k_.AV_CODEC_ID_OTF=98310]="AV_CODEC_ID_OTF",
			k_[k_.AV_CODEC_ID_SMPTE_KLV=98311]="AV_CODEC_ID_SMPTE_KLV",k_[k_.AV_CODEC_ID_DVD_NAV=98312]="AV_CODEC_ID_DVD_NAV",
			k_[k_.AV_CODEC_ID_TIMED_ID3=98313]="AV_CODEC_ID_TIMED_ID3",k_[k_.AV_CODEC_ID_BIN_DATA=98314]="AV_CODEC_ID_BIN_DATA",
			k_[k_.AV_CODEC_ID_SMPTE_2038=98315]="AV_CODEC_ID_SMPTE_2038",k_[k_.AV_CODEC_ID_PROBE=102400]="AV_CODEC_ID_PROBE",
			k_[k_.AV_CODEC_ID_MPEG2TS=131072]="AV_CODEC_ID_MPEG2TS",
			k_[k_.AV_CODEC_ID_MPEG4SYSTEMS=131073]="AV_CODEC_ID_MPEG4SYSTEMS",
			k_[k_.AV_CODEC_ID_FFMETADATA=135168]="AV_CODEC_ID_FFMETADATA",
			k_[k_.AV_CODEC_ID_WRAPPED_AVFRAME=135169]="AV_CODEC_ID_WRAPPED_AVFRAME",
			k_[k_.AV_CODEC_ID_VNULL=135170]="AV_CODEC_ID_VNULL",k_[k_.AV_CODEC_ID_ANULL=135171]="AV_CODEC_ID_ANULL",
			(G_=Y_||(Y_={}))[G_.AVMEDIA_TYPE_UNKNOWN=-1]="AVMEDIA_TYPE_UNKNOWN",G_[G_.AVMEDIA_TYPE_VIDEO=0]="AVMEDIA_TYPE_VIDEO",
			G_[G_.AVMEDIA_TYPE_AUDIO=1]="AVMEDIA_TYPE_AUDIO",G_[G_.AVMEDIA_TYPE_DATA=2]="AVMEDIA_TYPE_DATA",
			G_[G_.AVMEDIA_TYPE_SUBTITLE=3]="AVMEDIA_TYPE_SUBTITLE",G_[G_.AVMEDIA_TYPE_ATTACHMENT=4]="AVMEDIA_TYPE_ATTACHMENT",
			G_[G_.AVMEDIA_TYPE_NB=5]="AVMEDIA_TYPE_NB",(w_=H_||(H_={}))[w_.AV_PKT_DATA_UNKNOWN=-1]="AV_PKT_DATA_UNKNOWN",
			w_[w_.AV_PKT_DATA_PALETTE=0]="AV_PKT_DATA_PALETTE",w_[w_.AV_PKT_DATA_NEW_EXTRADATA=1]="AV_PKT_DATA_NEW_EXTRADATA",
			w_[w_.AV_PKT_DATA_PARAM_CHANGE=2]="AV_PKT_DATA_PARAM_CHANGE",
			w_[w_.AV_PKT_DATA_H263_MB_INFO=3]="AV_PKT_DATA_H263_MB_INFO",w_[w_.AV_PKT_DATA_REPLAYGAIN=4]="AV_PKT_DATA_REPLAYGAIN",
			w_[w_.AV_PKT_DATA_DISPLAYMATRIX=5]="AV_PKT_DATA_DISPLAYMATRIX",w_[w_.AV_PKT_DATA_STEREO3D=6]="AV_PKT_DATA_STEREO3D",
			w_[w_.AV_PKT_DATA_AUDIO_SERVICE_TYPE=7]="AV_PKT_DATA_AUDIO_SERVICE_TYPE",
			w_[w_.AV_PKT_DATA_QUALITY_STATS=8]="AV_PKT_DATA_QUALITY_STATS",
			w_[w_.AV_PKT_DATA_FALLBACK_TRACK=9]="AV_PKT_DATA_FALLBACK_TRACK",
			w_[w_.AV_PKT_DATA_CPB_PROPERTIES=10]="AV_PKT_DATA_CPB_PROPERTIES",
			w_[w_.AV_PKT_DATA_SKIP_SAMPLES=11]="AV_PKT_DATA_SKIP_SAMPLES",
			w_[w_.AV_PKT_DATA_JP_DUALMONO=12]="AV_PKT_DATA_JP_DUALMONO",
			w_[w_.AV_PKT_DATA_STRINGS_METADATA=13]="AV_PKT_DATA_STRINGS_METADATA",
			w_[w_.AV_PKT_DATA_SUBTITLE_POSITION=14]="AV_PKT_DATA_SUBTITLE_POSITION",
			w_[w_.AV_PKT_DATA_MATROSKA_BLOCKADDITIONAL=15]="AV_PKT_DATA_MATROSKA_BLOCKADDITIONAL",
			w_[w_.AV_PKT_DATA_WEBVTT_IDENTIFIER=16]="AV_PKT_DATA_WEBVTT_IDENTIFIER",
			w_[w_.AV_PKT_DATA_WEBVTT_SETTINGS=17]="AV_PKT_DATA_WEBVTT_SETTINGS",
			w_[w_.AV_PKT_DATA_METADATA_UPDATE=18]="AV_PKT_DATA_METADATA_UPDATE",
			w_[w_.AV_PKT_DATA_MPEGTS_STREAM_ID=19]="AV_PKT_DATA_MPEGTS_STREAM_ID",
			w_[w_.AV_PKT_DATA_MASTERING_DISPLAY_METADATA=20]="AV_PKT_DATA_MASTERING_DISPLAY_METADATA",
			w_[w_.AV_PKT_DATA_SPHERICAL=21]="AV_PKT_DATA_SPHERICAL",
			w_[w_.AV_PKT_DATA_CONTENT_LIGHT_LEVEL=22]="AV_PKT_DATA_CONTENT_LIGHT_LEVEL",
			w_[w_.AV_PKT_DATA_A53_CC=23]="AV_PKT_DATA_A53_CC",
			w_[w_.AV_PKT_DATA_ENCRYPTION_INIT_INFO=24]="AV_PKT_DATA_ENCRYPTION_INIT_INFO",
			w_[w_.AV_PKT_DATA_ENCRYPTION_INFO=25]="AV_PKT_DATA_ENCRYPTION_INFO",w_[w_.AV_PKT_DATA_AFD=26]="AV_PKT_DATA_AFD",
			w_[w_.AV_PKT_DATA_PRFT=27]="AV_PKT_DATA_PRFT",w_[w_.AV_PKT_DATA_ICC_PROFILE=28]="AV_PKT_DATA_ICC_PROFILE",
			w_[w_.AV_PKT_DATA_DOVI_CONF=29]="AV_PKT_DATA_DOVI_CONF",w_[w_.AV_PKT_DATA_S12M_TIMECODE=30]="AV_PKT_DATA_S12M_TIMECODE",
			w_[w_.AV_PKT_DATA_DYNAMIC_HDR10_PLUS=31]="AV_PKT_DATA_DYNAMIC_HDR10_PLUS",w_[w_.AV_PKT_DATA_NB=32]="AV_PKT_DATA_NB",
			(K_=x_||(x_={}))[K_.NONE=0]="NONE",K_[K_.DEFAULT=1]="DEFAULT",K_[K_.DUB=2]="DUB",K_[K_.ORIGINAL=4]="ORIGINAL",
			K_[K_.COMMENT=8]="COMMENT",K_[K_.LYRICS=16]="LYRICS",K_[K_.KARAOKE=32]="KARAOKE",K_[K_.FORCED=64]="FORCED",
			K_[K_.HEARING_IMPAIRED=128]="HEARING_IMPAIRED",K_[K_.VISUAL_IMPAIRED=256]="VISUAL_IMPAIRED",
			K_[K_.CLEAN_EFFECTS=512]="CLEAN_EFFECTS",K_[K_.ATTACHED_PIC=1024]="ATTACHED_PIC",
			K_[K_.TIMED_THUMBNAILS=2048]="TIMED_THUMBNAILS",K_[K_.CAPTIONS=65536]="CAPTIONS",
			K_[K_.DESCRIPTIONS=131072]="DESCRIPTIONS",K_[K_.METADATA=262144]="METADATA",K_[K_.DEPENDENT=524288]="DEPENDENT",
			K_[K_.STILL_IMAGE=1048576]="STILL_IMAGE",($_=W_||(W_={})).ARTIST="artist",$_.COMMENT="comment",$_.COPYRIGHT="copyright",
			$_.DATE="date",$_.GENRE="genre",$_.LANGUAGE="language",$_.LANGUAGE_STRING="languageString",$_.TITLE="title",
			$_.ALBUM="album",$_.TRACK="track",$_.ENCODER="encoder",$_.TIME_CODE="timecode",$_.VENDOR="vendor",
			$_.VENDOR_ID="vendorId",$_.POSTER="poster",$_.LYRICS="lyrics",$_.ALBUM_ARTIST="albumArtist",$_.DISC="disc",
			$_.PERFORMER="performer",$_.PUBLISHER="publisher",$_.COMPOSER="composer",$_.COMPILATION="compilation",
			$_.CREATION_TIME="creationTime",$_.MODIFICATION_TIME="modificationTime",$_.ALBUM_SORT="albumSort",
			$_.ARTIST_SORT="artistSort",$_.TITLE_SORT="titleSort",$_.GROUPING="grouping",$_.DESCRIPTION="description",
			$_.LICENSE="license",$_.ISRC="isrc",$_.MOOD="mood",$_.ELST="elst",$_.MATRIX="matrix",$_.STYLES="styles",$_.MIME="mime",
			$_.HANDLER_NAME="handlerName",(q_=Q_||(Q_={}))[q_.UNKNOWN=-1]="UNKNOWN",q_[q_.FLV=0]="FLV",q_[q_.MOV=1]="MOV",
			q_[q_.MP4=1]="MP4",q_[q_.M4A=1]="M4A",q_[q_.MPEGTS=2]="MPEGTS",q_[q_.MPEGPS=3]="MPEGPS",q_[q_.OGG=4]="OGG",
			q_[q_.IVF=5]="IVF",q_[q_.RTSP=6]="RTSP",q_[q_.RTMP=7]="RTMP",q_[q_.MATROSKA=8]="MATROSKA",q_[q_.WEBM=9]="WEBM",
			q_[q_.AVI=10]="AVI",q_[q_.H264=11]="H264",q_[q_.HEVC=12]="HEVC",q_[q_.VVC=13]="VVC",q_[q_.MP3=14]="MP3",
			q_[q_.AAC=15]="AAC",q_[q_.WAV=16]="WAV",q_[q_.FLAC=17]="FLAC",q_[q_.WEBVTT=18]="WEBVTT",q_[q_.SUBRIP=19]="SUBRIP",
			q_[q_.ASS=20]="ASS",q_[q_.TTML=21]="TTML",(z_=j_||(j_={}))[z_.NONE=0]="NONE",z_[z_.BACKWARD=1]="BACKWARD",
			z_[z_.BYTE=2]="BYTE",z_[z_.ANY=4]="ANY",z_[z_.FRAME=8]="FRAME",z_[z_.TIMESTAMP=16]="TIMESTAMP",
			(Z_=J_||(J_={}))[Z_.NONE=0]="NONE",Z_[Z_.SEEKABLE=1]="SEEKABLE",Z_[Z_.SLICE=2]="SLICE",Z_[Z_.NETWORK=4]="NETWORK",
			Z_[Z_.ABORT=8]="ABORT",(ee=_e||(_e={}))[ee.Fetch=0]="Fetch",ee[ee.File=1]="File",ee[ee.WEBSOCKET=2]="WEBSOCKET",
			ee[ee.WEBTRANSPORT=3]="WEBTRANSPORT",ee[ee.HLS=4]="HLS",ee[ee.DASH=5]="DASH",ee[ee.RTMP=6]="RTMP",
			(Ae=te||(te={}))[Ae.AV_SAMPLE_FMT_NONE=-1]="AV_SAMPLE_FMT_NONE",Ae[Ae.AV_SAMPLE_FMT_U8=0]="AV_SAMPLE_FMT_U8",
			Ae[Ae.AV_SAMPLE_FMT_S16=1]="AV_SAMPLE_FMT_S16",Ae[Ae.AV_SAMPLE_FMT_S32=2]="AV_SAMPLE_FMT_S32",
			Ae[Ae.AV_SAMPLE_FMT_FLT=3]="AV_SAMPLE_FMT_FLT",Ae[Ae.AV_SAMPLE_FMT_DBL=4]="AV_SAMPLE_FMT_DBL",
			Ae[Ae.AV_SAMPLE_FMT_U8P=5]="AV_SAMPLE_FMT_U8P",Ae[Ae.AV_SAMPLE_FMT_S16P=6]="AV_SAMPLE_FMT_S16P",
			Ae[Ae.AV_SAMPLE_FMT_S32P=7]="AV_SAMPLE_FMT_S32P",Ae[Ae.AV_SAMPLE_FMT_FLTP=8]="AV_SAMPLE_FMT_FLTP",
			Ae[Ae.AV_SAMPLE_FMT_DBLP=9]="AV_SAMPLE_FMT_DBLP",Ae[Ae.AV_SAMPLE_FMT_S64=10]="AV_SAMPLE_FMT_S64",
			Ae[Ae.AV_SAMPLE_FMT_S64P=11]="AV_SAMPLE_FMT_S64P",Ae[Ae.AV_SAMPLE_FMT_NB=12]="AV_SAMPLE_FMT_NB",
			(le=ae||(ae={}))[le.AV_AUDIO_SERVICE_TYPE_MAIN=0]="AV_AUDIO_SERVICE_TYPE_MAIN",
			le[le.AV_AUDIO_SERVICE_TYPE_EFFECTS=1]="AV_AUDIO_SERVICE_TYPE_EFFECTS",
			le[le.AV_AUDIO_SERVICE_TYPE_VISUALLY_IMPAIRED=2]="AV_AUDIO_SERVICE_TYPE_VISUALLY_IMPAIRED",
			le[le.AV_AUDIO_SERVICE_TYPE_HEARING_IMPAIRED=3]="AV_AUDIO_SERVICE_TYPE_HEARING_IMPAIRED",
			le[le.AV_AUDIO_SERVICE_TYPE_DIALOGUE=4]="AV_AUDIO_SERVICE_TYPE_DIALOGUE",
			le[le.AV_AUDIO_SERVICE_TYPE_COMMENTARY=5]="AV_AUDIO_SERVICE_TYPE_COMMENTARY",
			le[le.AV_AUDIO_SERVICE_TYPE_EMERGENCY=6]="AV_AUDIO_SERVICE_TYPE_EMERGENCY",
			le[le.AV_AUDIO_SERVICE_TYPE_VOICE_OVER=7]="AV_AUDIO_SERVICE_TYPE_VOICE_OVER",
			le[le.AV_AUDIO_SERVICE_TYPE_KARAOKE=8]="AV_AUDIO_SERVICE_TYPE_KARAOKE",
			le[le.AV_AUDIO_SERVICE_TYPE_NB=9]="AV_AUDIO_SERVICE_TYPE_NB",(ne=Ce||(Ce={}))[ne.AV_CHANNEL_NONE=-1]="AV_CHANNEL_NONE",
			ne[ne.AV_CHANNEL_FRONT_LEFT=0]="AV_CHANNEL_FRONT_LEFT",ne[ne.AV_CHANNEL_FRONT_RIGHT=1]="AV_CHANNEL_FRONT_RIGHT",
			ne[ne.AV_CHANNEL_FRONT_CENTER=2]="AV_CHANNEL_FRONT_CENTER",ne[ne.AV_CHANNEL_LOW_FREQUENCY=3]="AV_CHANNEL_LOW_FREQUENCY",
			ne[ne.AV_CHANNEL_BACK_LEFT=4]="AV_CHANNEL_BACK_LEFT",ne[ne.AV_CHANNEL_BACK_RIGHT=5]="AV_CHANNEL_BACK_RIGHT",
			ne[ne.AV_CHANNEL_FRONT_LEFT_OF_CENTER=6]="AV_CHANNEL_FRONT_LEFT_OF_CENTER",
			ne[ne.AV_CHANNEL_FRONT_RIGHT_OF_CENTER=7]="AV_CHANNEL_FRONT_RIGHT_OF_CENTER",
			ne[ne.AV_CHANNEL_BACK_CENTER=8]="AV_CHANNEL_BACK_CENTER",ne[ne.AV_CHANNEL_SIDE_LEFT=9]="AV_CHANNEL_SIDE_LEFT",
			ne[ne.AV_CHANNEL_SIDE_RIGHT=10]="AV_CHANNEL_SIDE_RIGHT",ne[ne.AV_CHANNEL_TOP_CENTER=11]="AV_CHANNEL_TOP_CENTER",
			ne[ne.AV_CHANNEL_TOP_FRONT_LEFT=12]="AV_CHANNEL_TOP_FRONT_LEFT",
			ne[ne.AV_CHANNEL_TOP_FRONT_CENTER=13]="AV_CHANNEL_TOP_FRONT_CENTER",
			ne[ne.AV_CHANNEL_TOP_FRONT_RIGHT=14]="AV_CHANNEL_TOP_FRONT_RIGHT",
			ne[ne.AV_CHANNEL_TOP_BACK_LEFT=15]="AV_CHANNEL_TOP_BACK_LEFT",
			ne[ne.AV_CHANNEL_TOP_BACK_CENTER=16]="AV_CHANNEL_TOP_BACK_CENTER",
			ne[ne.AV_CHANNEL_TOP_BACK_RIGHT=17]="AV_CHANNEL_TOP_BACK_RIGHT",
			ne[ne.AV_CHANNEL_STEREO_LEFT=29]="AV_CHANNEL_STEREO_LEFT",ne[ne.AV_CHANNEL_STEREO_RIGHT=30]="AV_CHANNEL_STEREO_RIGHT",
			ne[ne.AV_CHANNEL_WIDE_LEFT=31]="AV_CHANNEL_WIDE_LEFT",ne[ne.AV_CHANNEL_WIDE_RIGHT=32]="AV_CHANNEL_WIDE_RIGHT",
			ne[ne.AV_CHANNEL_SURROUND_DIRECT_LEFT=33]="AV_CHANNEL_SURROUND_DIRECT_LEFT",
			ne[ne.AV_CHANNEL_SURROUND_DIRECT_RIGHT=34]="AV_CHANNEL_SURROUND_DIRECT_RIGHT",
			ne[ne.AV_CHANNEL_LOW_FREQUENCY_2=35]="AV_CHANNEL_LOW_FREQUENCY_2",
			ne[ne.AV_CHANNEL_TOP_SIDE_LEFT=36]="AV_CHANNEL_TOP_SIDE_LEFT",
			ne[ne.AV_CHANNEL_TOP_SIDE_RIGHT=37]="AV_CHANNEL_TOP_SIDE_RIGHT",
			ne[ne.AV_CHANNEL_BOTTOM_FRONT_CENTER=38]="AV_CHANNEL_BOTTOM_FRONT_CENTER",
			ne[ne.AV_CHANNEL_BOTTOM_FRONT_LEFT=39]="AV_CHANNEL_BOTTOM_FRONT_LEFT",
			ne[ne.AV_CHANNEL_BOTTOM_FRONT_RIGHT=40]="AV_CHANNEL_BOTTOM_FRONT_RIGHT",
			ne[ne.AV_CHANNEL_UNUSED=512]="AV_CHANNEL_UNUSED",ne[ne.AV_CHANNEL_UNKNOWN=768]="AV_CHANNEL_UNKNOWN",
			ne[ne.AV_CHANNEL_AMBISONIC_BASE=1024]="AV_CHANNEL_AMBISONIC_BASE",
			ne[ne.AV_CHANNEL_AMBISONIC_END=2047]="AV_CHANNEL_AMBISONIC_END",
			(re=oe||(oe={}))[re.AV_CHANNEL_ORDER_UNSPEC=0]="AV_CHANNEL_ORDER_UNSPEC",
			re[re.AV_CHANNEL_ORDER_NATIVE=1]="AV_CHANNEL_ORDER_NATIVE",re[re.AV_CHANNEL_ORDER_CUSTOM=2]="AV_CHANNEL_ORDER_CUSTOM",
			re[re.AV_CHANNEL_ORDER_AMBISONIC=3]="AV_CHANNEL_ORDER_AMBISONIC",re[re.FF_CHANNEL_ORDER_NB=4]="FF_CHANNEL_ORDER_NB",
			(De=ie||(ie={}))[De.AV_CHANNEL_LAYOUT_FRONT_LEFT=1]="AV_CHANNEL_LAYOUT_FRONT_LEFT",
			De[De.AV_CHANNEL_LAYOUT_FRONT_RIGHT=2]="AV_CHANNEL_LAYOUT_FRONT_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_FRONT_CENTER=4]="AV_CHANNEL_LAYOUT_FRONT_CENTER",
			De[De.AV_CHANNEL_LAYOUT_LOW_FREQUENCY=8]="AV_CHANNEL_LAYOUT_LOW_FREQUENCY",
			De[De.AV_CHANNEL_LAYOUT_BACK_LEFT=16]="AV_CHANNEL_LAYOUT_BACK_LEFT",
			De[De.AV_CHANNEL_LAYOUT_BACK_RIGHT=32]="AV_CHANNEL_LAYOUT_BACK_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_FRONT_LEFT_OF_CENTER=64]="AV_CHANNEL_LAYOUT_FRONT_LEFT_OF_CENTER",
			De[De.AV_CHANNEL_LAYOUT_FRONT_RIGHT_OF_CENTER=128]="AV_CHANNEL_LAYOUT_FRONT_RIGHT_OF_CENTER",
			De[De.AV_CHANNEL_LAYOUT_BACK_CENTER=256]="AV_CHANNEL_LAYOUT_BACK_CENTER",
			De[De.AV_CHANNEL_LAYOUT_SIDE_LEFT=512]="AV_CHANNEL_LAYOUT_SIDE_LEFT",
			De[De.AV_CHANNEL_LAYOUT_SIDE_RIGHT=1024]="AV_CHANNEL_LAYOUT_SIDE_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_TOP_CENTER=2048]="AV_CHANNEL_LAYOUT_TOP_CENTER",
			De[De.AV_CHANNEL_LAYOUT_TOP_FRONT_LEFT=4096]="AV_CHANNEL_LAYOUT_TOP_FRONT_LEFT",
			De[De.AV_CHANNEL_LAYOUT_TOP_FRONT_CENTER=8192]="AV_CHANNEL_LAYOUT_TOP_FRONT_CENTER",
			De[De.AV_CHANNEL_LAYOUT_TOP_FRONT_RIGHT=16384]="AV_CHANNEL_LAYOUT_TOP_FRONT_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_TOP_BACK_LEFT=32768]="AV_CHANNEL_LAYOUT_TOP_BACK_LEFT",
			De[De.AV_CHANNEL_LAYOUT_TOP_BACK_CENTER=65536]="AV_CHANNEL_LAYOUT_TOP_BACK_CENTER",
			De[De.AV_CHANNEL_LAYOUT_TOP_BACK_RIGHT=131072]="AV_CHANNEL_LAYOUT_TOP_BACK_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_STEREO_LEFT=536870912]="AV_CHANNEL_LAYOUT_STEREO_LEFT",
			De[De.AV_CHANNEL_LAYOUT_STEREO_RIGHT=1073741824]="AV_CHANNEL_LAYOUT_STEREO_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_WIDE_LEFT=2147483648]="AV_CHANNEL_LAYOUT_WIDE_LEFT",
			De[De.AV_CHANNEL_LAYOUT_WIDE_RIGHT=4294967296]="AV_CHANNEL_LAYOUT_WIDE_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_SURROUND_DIRECT_LEFT=8589934592]="AV_CHANNEL_LAYOUT_SURROUND_DIRECT_LEFT",
			De[De.AV_CHANNEL_LAYOUT_SURROUND_DIRECT_RIGHT=17179869184]="AV_CHANNEL_LAYOUT_SURROUND_DIRECT_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_LOW_FREQUENCY_2=34359738368]="AV_CHANNEL_LAYOUT_LOW_FREQUENCY_2",
			De[De.AV_CHANNEL_LAYOUT_TOP_SIDE_LEFT=68719476736]="AV_CHANNEL_LAYOUT_TOP_SIDE_LEFT",
			De[De.AV_CHANNEL_LAYOUT_TOP_SIDE_RIGHT=137438953472]="AV_CHANNEL_LAYOUT_TOP_SIDE_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_BOTTOM_FRONT_CENTER=274877906944]="AV_CHANNEL_LAYOUT_BOTTOM_FRONT_CENTER",
			De[De.AV_CHANNEL_LAYOUT_BOTTOM_FRONT_LEFT=549755813888]="AV_CHANNEL_LAYOUT_BOTTOM_FRONT_LEFT",
			De[De.AV_CHANNEL_LAYOUT_BOTTOM_FRONT_RIGHT=1099511627776]="AV_CHANNEL_LAYOUT_BOTTOM_FRONT_RIGHT",
			De[De.AV_CHANNEL_LAYOUT_MONO=4]="AV_CHANNEL_LAYOUT_MONO",De[De.AV_CHANNEL_LAYOUT_STEREO=3]="AV_CHANNEL_LAYOUT_STEREO",
			De[De.AV_CHANNEL_LAYOUT_2POINT1=11]="AV_CHANNEL_LAYOUT_2POINT1",
			De[De.AV_CHANNEL_LAYOUT_2_1=259]="AV_CHANNEL_LAYOUT_2_1",
			De[De.AV_CHANNEL_LAYOUT_SURROUND=7]="AV_CHANNEL_LAYOUT_SURROUND",
			De[De.AV_CHANNEL_LAYOUT_3POINT1=15]="AV_CHANNEL_LAYOUT_3POINT1",
			De[De.AV_CHANNEL_LAYOUT_4POINT0=263]="AV_CHANNEL_LAYOUT_4POINT0",
			De[De.AV_CHANNEL_LAYOUT_4POINT1=271]="AV_CHANNEL_LAYOUT_4POINT1",
			De[De.AV_CHANNEL_LAYOUT_2_2=1539]="AV_CHANNEL_LAYOUT_2_2",De[De.AV_CHANNEL_LAYOUT_QUAD=51]="AV_CHANNEL_LAYOUT_QUAD",
			De[De.AV_CHANNEL_LAYOUT_5POINT0=1543]="AV_CHANNEL_LAYOUT_5POINT0",
			De[De.AV_CHANNEL_LAYOUT_5POINT1=1551]="AV_CHANNEL_LAYOUT_5POINT1",
			De[De.AV_CHANNEL_LAYOUT_5POINT0_BACK=55]="AV_CHANNEL_LAYOUT_5POINT0_BACK",
			De[De.AV_CHANNEL_LAYOUT_5POINT1_BACK=63]="AV_CHANNEL_LAYOUT_5POINT1_BACK",
			De[De.AV_CHANNEL_LAYOUT_6POINT0=1799]="AV_CHANNEL_LAYOUT_6POINT0",
			De[De.AV_CHANNEL_LAYOUT_6POINT0_FRONT=1731]="AV_CHANNEL_LAYOUT_6POINT0_FRONT",
			De[De.AV_CHANNEL_LAYOUT_HEXAGONAL=311]="AV_CHANNEL_LAYOUT_HEXAGONAL",
			De[De.AV_CHANNEL_LAYOUT_3POINT1POINT2=20495]="AV_CHANNEL_LAYOUT_3POINT1POINT2",
			De[De.AV_CHANNEL_LAYOUT_6POINT1=1807]="AV_CHANNEL_LAYOUT_6POINT1",
			De[De.AV_CHANNEL_LAYOUT_6POINT1_BACK=319]="AV_CHANNEL_LAYOUT_6POINT1_BACK",
			De[De.AV_CHANNEL_LAYOUT_6POINT1_FRONT=1739]="AV_CHANNEL_LAYOUT_6POINT1_FRONT",
			De[De.AV_CHANNEL_LAYOUT_7POINT0=1591]="AV_CHANNEL_LAYOUT_7POINT0",
			De[De.AV_CHANNEL_LAYOUT_7POINT0_FRONT=1735]="AV_CHANNEL_LAYOUT_7POINT0_FRONT",
			De[De.AV_CHANNEL_LAYOUT_7POINT1=1599]="AV_CHANNEL_LAYOUT_7POINT1",
			De[De.AV_CHANNEL_LAYOUT_7POINT1_WIDE=1743]="AV_CHANNEL_LAYOUT_7POINT1_WIDE",
			De[De.AV_CHANNEL_LAYOUT_7POINT1_WIDE_BACK=255]="AV_CHANNEL_LAYOUT_7POINT1_WIDE_BACK",
			De[De.AV_CHANNEL_LAYOUT_5POINT1POINT2_BACK=20543]="AV_CHANNEL_LAYOUT_5POINT1POINT2_BACK",
			De[De.AV_CHANNEL_LAYOUT_OCTAGONAL=1847]="AV_CHANNEL_LAYOUT_OCTAGONAL",
			De[De.AV_CHANNEL_LAYOUT_CUBE=184371]="AV_CHANNEL_LAYOUT_CUBE",
			De[De.AV_CHANNEL_LAYOUT_5POINT1POINT4_BACK=184383]="AV_CHANNEL_LAYOUT_5POINT1POINT4_BACK",
			De[De.AV_CHANNEL_LAYOUT_7POINT1POINT2=22079]="AV_CHANNEL_LAYOUT_7POINT1POINT2",
			De[De.AV_CHANNEL_LAYOUT_7POINT1POINT4_BACK=185919]="AV_CHANNEL_LAYOUT_7POINT1POINT4_BACK",
			De[De.AV_CHANNEL_LAYOUT_7POINT2POINT3=34359825983]="AV_CHANNEL_LAYOUT_7POINT2POINT3",
			De[De.AV_CHANNEL_LAYOUT_9POINT1POINT4_BACK=186111]="AV_CHANNEL_LAYOUT_9POINT1POINT4_BACK",
			De[De.AV_CHANNEL_LAYOUT_HEXADECAGONAL=6442710839]="AV_CHANNEL_LAYOUT_HEXADECAGONAL",
			De[De.AV_CHANNEL_LAYOUT_STEREO_DOWNMIX=1610612736]="AV_CHANNEL_LAYOUT_STEREO_DOWNMIX",
			De[De.AV_CHANNEL_LAYOUT_22POINT2=2164663779327]="AV_CHANNEL_LAYOUT_22POINT2",
			De[De.AV_CHANNEL_LAYOUT_7POINT1_TOP_BACK=20543]="AV_CHANNEL_LAYOUT_7POINT1_TOP_BACK"
			;(se=Ee||(Ee={}))[se.BIG_ENDIAN=1]="BIG_ENDIAN",se[se.PALETTE=2]="PALETTE",se[se.BIT_STREAM=4]="BIT_STREAM",
			se[se.PLANER=16]="PLANER",se[se.RGB=32]="RGB",se[se.ALPHA=128]="ALPHA",se[se.BAYER=256]="BAYER",
			se[se.FLOAT=512]="FLOAT",(ue=Ve||(Ve={}))[ue.AVCHROMA_LOC_UNSPECIFIED=0]="AVCHROMA_LOC_UNSPECIFIED",
			ue[ue.AVCHROMA_LOC_LEFT=1]="AVCHROMA_LOC_LEFT",ue[ue.AVCHROMA_LOC_CENTER=2]="AVCHROMA_LOC_CENTER",
			ue[ue.AVCHROMA_LOC_TOPLEFT=3]="AVCHROMA_LOC_TOPLEFT",ue[ue.AVCHROMA_LOC_TOP=4]="AVCHROMA_LOC_TOP",
			ue[ue.AVCHROMA_LOC_BOTTOMLEFT=5]="AVCHROMA_LOC_BOTTOMLEFT",ue[ue.AVCHROMA_LOC_BOTTOM=6]="AVCHROMA_LOC_BOTTOM",
			ue[ue.AVCHROMA_LOC_NB=7]="AVCHROMA_LOC_NB",(Oe=Ie||(Ie={}))[Oe.AVCOL_PRI_RESERVED0=0]="AVCOL_PRI_RESERVED0",
			Oe[Oe.AVCOL_PRI_BT709=1]="AVCOL_PRI_BT709",Oe[Oe.AVCOL_PRI_UNSPECIFIED=2]="AVCOL_PRI_UNSPECIFIED",
			Oe[Oe.AVCOL_PRI_RESERVED=3]="AVCOL_PRI_RESERVED",Oe[Oe.AVCOL_PRI_BT470M=4]="AVCOL_PRI_BT470M",
			Oe[Oe.AVCOL_PRI_BT470BG=5]="AVCOL_PRI_BT470BG",Oe[Oe.AVCOL_PRI_SMPTE170M=6]="AVCOL_PRI_SMPTE170M",
			Oe[Oe.AVCOL_PRI_SMPTE240M=7]="AVCOL_PRI_SMPTE240M",Oe[Oe.AVCOL_PRI_FILM=8]="AVCOL_PRI_FILM",
			Oe[Oe.AVCOL_PRI_BT2020=9]="AVCOL_PRI_BT2020",Oe[Oe.AVCOL_PRI_SMPTE428=10]="AVCOL_PRI_SMPTE428",
			Oe[Oe.AVCOL_PRI_SMPTEST428_1=10]="AVCOL_PRI_SMPTEST428_1",Oe[Oe.AVCOL_PRI_SMPTE431=11]="AVCOL_PRI_SMPTE431",
			Oe[Oe.AVCOL_PRI_SMPTE432=12]="AVCOL_PRI_SMPTE432",Oe[Oe.AVCOL_PRI_EBU3213=22]="AVCOL_PRI_EBU3213",
			Oe[Oe.AVCOL_PRI_JEDEC_P22=22]="AVCOL_PRI_JEDEC_P22",Oe[Oe.AVCOL_PRI_NB=23]="AVCOL_PRI_NB",
			(Pe=Te||(Te={}))[Pe.AVCOL_RANGE_UNSPECIFIED=0]="AVCOL_RANGE_UNSPECIFIED",Pe[Pe.AVCOL_RANGE_MPEG=1]="AVCOL_RANGE_MPEG",
			Pe[Pe.AVCOL_RANGE_JPEG=2]="AVCOL_RANGE_JPEG",Pe[Pe.AVCOL_RANGE_NB=3]="AVCOL_RANGE_NB",
			(de=ce||(ce={}))[de.AVCOL_SPC_RGB=0]="AVCOL_SPC_RGB",de[de.AVCOL_SPC_BT709=1]="AVCOL_SPC_BT709",
			de[de.AVCOL_SPC_UNSPECIFIED=2]="AVCOL_SPC_UNSPECIFIED",de[de.AVCOL_SPC_RESERVED=3]="AVCOL_SPC_RESERVED",
			de[de.AVCOL_SPC_FCC=4]="AVCOL_SPC_FCC",de[de.AVCOL_SPC_BT470BG=5]="AVCOL_SPC_BT470BG",
			de[de.AVCOL_SPC_SMPTE170M=6]="AVCOL_SPC_SMPTE170M",de[de.AVCOL_SPC_SMPTE240M=7]="AVCOL_SPC_SMPTE240M",
			de[de.AVCOL_SPC_YCGCO=8]="AVCOL_SPC_YCGCO",de[de.AVCOL_SPC_YCOCG=8]="AVCOL_SPC_YCOCG",
			de[de.AVCOL_SPC_BT2020_NCL=9]="AVCOL_SPC_BT2020_NCL",de[de.AVCOL_SPC_BT2020_CL=10]="AVCOL_SPC_BT2020_CL",
			de[de.AVCOL_SPC_SMPTE2085=11]="AVCOL_SPC_SMPTE2085",
			de[de.AVCOL_SPC_CHROMA_DERIVED_NCL=12]="AVCOL_SPC_CHROMA_DERIVED_NCL",
			de[de.AVCOL_SPC_CHROMA_DERIVED_CL=13]="AVCOL_SPC_CHROMA_DERIVED_CL",de[de.AVCOL_SPC_ICTCP=14]="AVCOL_SPC_ICTCP",
			de[de.AVCOL_SPC_NB=15]="AVCOL_SPC_NB",(ve=Me||(Me={}))[ve.AVCOL_TRC_RESERVED0=0]="AVCOL_TRC_RESERVED0",
			ve[ve.AVCOL_TRC_BT709=1]="AVCOL_TRC_BT709",ve[ve.AVCOL_TRC_UNSPECIFIED=2]="AVCOL_TRC_UNSPECIFIED",
			ve[ve.AVCOL_TRC_RESERVED=3]="AVCOL_TRC_RESERVED",ve[ve.AVCOL_TRC_GAMMA22=4]="AVCOL_TRC_GAMMA22",
			ve[ve.AVCOL_TRC_GAMMA28=5]="AVCOL_TRC_GAMMA28",ve[ve.AVCOL_TRC_SMPTE170M=6]="AVCOL_TRC_SMPTE170M",
			ve[ve.AVCOL_TRC_SMPTE240M=7]="AVCOL_TRC_SMPTE240M",ve[ve.AVCOL_TRC_LINEAR=8]="AVCOL_TRC_LINEAR",
			ve[ve.AVCOL_TRC_LOG=9]="AVCOL_TRC_LOG",ve[ve.AVCOL_TRC_LOG_SQRT=10]="AVCOL_TRC_LOG_SQRT",
			ve[ve.AVCOL_TRC_IEC61966_2_4=11]="AVCOL_TRC_IEC61966_2_4",ve[ve.AVCOL_TRC_BT1361_ECG=12]="AVCOL_TRC_BT1361_ECG",
			ve[ve.AVCOL_TRC_IEC61966_2_1=13]="AVCOL_TRC_IEC61966_2_1",ve[ve.AVCOL_TRC_BT2020_10=14]="AVCOL_TRC_BT2020_10",
			ve[ve.AVCOL_TRC_BT2020_12=15]="AVCOL_TRC_BT2020_12",ve[ve.AVCOL_TRC_SMPTE2084=16]="AVCOL_TRC_SMPTE2084",
			ve[ve.AVCOL_TRC_SMPTEST2084=16]="AVCOL_TRC_SMPTEST2084",ve[ve.AVCOL_TRC_SMPTE428=17]="AVCOL_TRC_SMPTE428",
			ve[ve.AVCOL_TRC_SMPTEST428_1=17]="AVCOL_TRC_SMPTEST428_1",ve[ve.AVCOL_TRC_ARIB_STD_B67=18]="AVCOL_TRC_ARIB_STD_B67",
			ve[ve.AVCOL_TRC_NB=19]="AVCOL_TRC_NB",(Le=Re||(Re={}))[Le.AV_FIELD_UNKNOWN=0]="AV_FIELD_UNKNOWN",
			Le[Le.AV_FIELD_PROGRESSIVE=1]="AV_FIELD_PROGRESSIVE",Le[Le.AV_FIELD_TT=2]="AV_FIELD_TT",
			Le[Le.AV_FIELD_BB=3]="AV_FIELD_BB",Le[Le.AV_FIELD_TB=4]="AV_FIELD_TB",Le[Le.AV_FIELD_BT=5]="AV_FIELD_BT",
			(pe=Ne||(Ne={}))[pe.AV_PIX_FMT_NONE=-1]="AV_PIX_FMT_NONE",pe[pe.AV_PIX_FMT_YUV420P=0]="AV_PIX_FMT_YUV420P",
			pe[pe.AV_PIX_FMT_YUYV422=1]="AV_PIX_FMT_YUYV422",pe[pe.AV_PIX_FMT_RGB24=2]="AV_PIX_FMT_RGB24",
			pe[pe.AV_PIX_FMT_BGR24=3]="AV_PIX_FMT_BGR24",pe[pe.AV_PIX_FMT_YUV422P=4]="AV_PIX_FMT_YUV422P",
			pe[pe.AV_PIX_FMT_YUV444P=5]="AV_PIX_FMT_YUV444P",pe[pe.AV_PIX_FMT_YUV410P=6]="AV_PIX_FMT_YUV410P",
			pe[pe.AV_PIX_FMT_YUV411P=7]="AV_PIX_FMT_YUV411P",pe[pe.AV_PIX_FMT_GRAY8=8]="AV_PIX_FMT_GRAY8",
			pe[pe.AV_PIX_FMT_MONOWHITE=9]="AV_PIX_FMT_MONOWHITE",pe[pe.AV_PIX_FMT_MONOBLACK=10]="AV_PIX_FMT_MONOBLACK",
			pe[pe.AV_PIX_FMT_PAL8=11]="AV_PIX_FMT_PAL8",pe[pe.AV_PIX_FMT_YUVJ420P=12]="AV_PIX_FMT_YUVJ420P",
			pe[pe.AV_PIX_FMT_YUVJ422P=13]="AV_PIX_FMT_YUVJ422P",pe[pe.AV_PIX_FMT_YUVJ444P=14]="AV_PIX_FMT_YUVJ444P",
			pe[pe.AV_PIX_FMT_UYVY422=15]="AV_PIX_FMT_UYVY422",pe[pe.AV_PIX_FMT_UYYVYY411=16]="AV_PIX_FMT_UYYVYY411",
			pe[pe.AV_PIX_FMT_BGR8=17]="AV_PIX_FMT_BGR8",pe[pe.AV_PIX_FMT_BGR4=18]="AV_PIX_FMT_BGR4",
			pe[pe.AV_PIX_FMT_BGR4_BYTE=19]="AV_PIX_FMT_BGR4_BYTE",pe[pe.AV_PIX_FMT_RGB8=20]="AV_PIX_FMT_RGB8",
			pe[pe.AV_PIX_FMT_RGB4=21]="AV_PIX_FMT_RGB4",pe[pe.AV_PIX_FMT_RGB4_BYTE=22]="AV_PIX_FMT_RGB4_BYTE",
			pe[pe.AV_PIX_FMT_NV12=23]="AV_PIX_FMT_NV12",pe[pe.AV_PIX_FMT_NV21=24]="AV_PIX_FMT_NV21",
			pe[pe.AV_PIX_FMT_ARGB=25]="AV_PIX_FMT_ARGB",pe[pe.AV_PIX_FMT_RGBA=26]="AV_PIX_FMT_RGBA",
			pe[pe.AV_PIX_FMT_ABGR=27]="AV_PIX_FMT_ABGR",pe[pe.AV_PIX_FMT_BGRA=28]="AV_PIX_FMT_BGRA",
			pe[pe.AV_PIX_FMT_GRAY16BE=29]="AV_PIX_FMT_GRAY16BE",pe[pe.AV_PIX_FMT_GRAY16LE=30]="AV_PIX_FMT_GRAY16LE",
			pe[pe.AV_PIX_FMT_YUV440P=31]="AV_PIX_FMT_YUV440P",pe[pe.AV_PIX_FMT_YUVJ440P=32]="AV_PIX_FMT_YUVJ440P",
			pe[pe.AV_PIX_FMT_YUVA420P=33]="AV_PIX_FMT_YUVA420P",pe[pe.AV_PIX_FMT_RGB48BE=34]="AV_PIX_FMT_RGB48BE",
			pe[pe.AV_PIX_FMT_RGB48LE=35]="AV_PIX_FMT_RGB48LE",pe[pe.AV_PIX_FMT_RGB565BE=36]="AV_PIX_FMT_RGB565BE",
			pe[pe.AV_PIX_FMT_RGB565LE=37]="AV_PIX_FMT_RGB565LE",pe[pe.AV_PIX_FMT_RGB555BE=38]="AV_PIX_FMT_RGB555BE",
			pe[pe.AV_PIX_FMT_RGB555LE=39]="AV_PIX_FMT_RGB555LE",pe[pe.AV_PIX_FMT_BGR565BE=40]="AV_PIX_FMT_BGR565BE",
			pe[pe.AV_PIX_FMT_BGR565LE=41]="AV_PIX_FMT_BGR565LE",pe[pe.AV_PIX_FMT_BGR555BE=42]="AV_PIX_FMT_BGR555BE",
			pe[pe.AV_PIX_FMT_BGR555LE=43]="AV_PIX_FMT_BGR555LE",pe[pe.AV_PIX_FMT_VAAPI=44]="AV_PIX_FMT_VAAPI",
			pe[pe.AV_PIX_FMT_YUV420P16LE=45]="AV_PIX_FMT_YUV420P16LE",pe[pe.AV_PIX_FMT_YUV420P16BE=46]="AV_PIX_FMT_YUV420P16BE",
			pe[pe.AV_PIX_FMT_YUV422P16LE=47]="AV_PIX_FMT_YUV422P16LE",pe[pe.AV_PIX_FMT_YUV422P16BE=48]="AV_PIX_FMT_YUV422P16BE",
			pe[pe.AV_PIX_FMT_YUV444P16LE=49]="AV_PIX_FMT_YUV444P16LE",pe[pe.AV_PIX_FMT_YUV444P16BE=50]="AV_PIX_FMT_YUV444P16BE",
			pe[pe.AV_PIX_FMT_DXVA2_VLD=51]="AV_PIX_FMT_DXVA2_VLD",pe[pe.AV_PIX_FMT_RGB444LE=52]="AV_PIX_FMT_RGB444LE",
			pe[pe.AV_PIX_FMT_RGB444BE=53]="AV_PIX_FMT_RGB444BE",pe[pe.AV_PIX_FMT_BGR444LE=54]="AV_PIX_FMT_BGR444LE",
			pe[pe.AV_PIX_FMT_BGR444BE=55]="AV_PIX_FMT_BGR444BE",pe[pe.AV_PIX_FMT_YA8=56]="AV_PIX_FMT_YA8",
			pe[pe.AV_PIX_FMT_Y400A=56]="AV_PIX_FMT_Y400A",pe[pe.AV_PIX_FMT_GRAY8A=56]="AV_PIX_FMT_GRAY8A",
			pe[pe.AV_PIX_FMT_BGR48BE=57]="AV_PIX_FMT_BGR48BE",pe[pe.AV_PIX_FMT_BGR48LE=58]="AV_PIX_FMT_BGR48LE",
			pe[pe.AV_PIX_FMT_YUV420P9BE=59]="AV_PIX_FMT_YUV420P9BE",pe[pe.AV_PIX_FMT_YUV420P9LE=60]="AV_PIX_FMT_YUV420P9LE",
			pe[pe.AV_PIX_FMT_YUV420P10BE=61]="AV_PIX_FMT_YUV420P10BE",pe[pe.AV_PIX_FMT_YUV420P10LE=62]="AV_PIX_FMT_YUV420P10LE",
			pe[pe.AV_PIX_FMT_YUV422P10BE=63]="AV_PIX_FMT_YUV422P10BE",pe[pe.AV_PIX_FMT_YUV422P10LE=64]="AV_PIX_FMT_YUV422P10LE",
			pe[pe.AV_PIX_FMT_YUV444P9BE=65]="AV_PIX_FMT_YUV444P9BE",pe[pe.AV_PIX_FMT_YUV444P9LE=66]="AV_PIX_FMT_YUV444P9LE",
			pe[pe.AV_PIX_FMT_YUV444P10BE=67]="AV_PIX_FMT_YUV444P10BE",pe[pe.AV_PIX_FMT_YUV444P10LE=68]="AV_PIX_FMT_YUV444P10LE",
			pe[pe.AV_PIX_FMT_YUV422P9BE=69]="AV_PIX_FMT_YUV422P9BE",pe[pe.AV_PIX_FMT_YUV422P9LE=70]="AV_PIX_FMT_YUV422P9LE",
			pe[pe.AV_PIX_FMT_GBRP=71]="AV_PIX_FMT_GBRP",pe[pe.AV_PIX_FMT_GBR24P=71]="AV_PIX_FMT_GBR24P",
			pe[pe.AV_PIX_FMT_GBRP9BE=72]="AV_PIX_FMT_GBRP9BE",pe[pe.AV_PIX_FMT_GBRP9LE=73]="AV_PIX_FMT_GBRP9LE",
			pe[pe.AV_PIX_FMT_GBRP10BE=74]="AV_PIX_FMT_GBRP10BE",pe[pe.AV_PIX_FMT_GBRP10LE=75]="AV_PIX_FMT_GBRP10LE",
			pe[pe.AV_PIX_FMT_GBRP16BE=76]="AV_PIX_FMT_GBRP16BE",pe[pe.AV_PIX_FMT_GBRP16LE=77]="AV_PIX_FMT_GBRP16LE",
			pe[pe.AV_PIX_FMT_YUVA422P=78]="AV_PIX_FMT_YUVA422P",pe[pe.AV_PIX_FMT_YUVA444P=79]="AV_PIX_FMT_YUVA444P",
			pe[pe.AV_PIX_FMT_YUVA420P9BE=80]="AV_PIX_FMT_YUVA420P9BE",pe[pe.AV_PIX_FMT_YUVA420P9LE=81]="AV_PIX_FMT_YUVA420P9LE",
			pe[pe.AV_PIX_FMT_YUVA422P9BE=82]="AV_PIX_FMT_YUVA422P9BE",pe[pe.AV_PIX_FMT_YUVA422P9LE=83]="AV_PIX_FMT_YUVA422P9LE",
			pe[pe.AV_PIX_FMT_YUVA444P9BE=84]="AV_PIX_FMT_YUVA444P9BE",pe[pe.AV_PIX_FMT_YUVA444P9LE=85]="AV_PIX_FMT_YUVA444P9LE",
			pe[pe.AV_PIX_FMT_YUVA420P10BE=86]="AV_PIX_FMT_YUVA420P10BE",pe[pe.AV_PIX_FMT_YUVA420P10LE=87]="AV_PIX_FMT_YUVA420P10LE",
			pe[pe.AV_PIX_FMT_YUVA422P10BE=88]="AV_PIX_FMT_YUVA422P10BE",pe[pe.AV_PIX_FMT_YUVA422P10LE=89]="AV_PIX_FMT_YUVA422P10LE",
			pe[pe.AV_PIX_FMT_YUVA444P10BE=90]="AV_PIX_FMT_YUVA444P10BE",pe[pe.AV_PIX_FMT_YUVA444P10LE=91]="AV_PIX_FMT_YUVA444P10LE",
			pe[pe.AV_PIX_FMT_YUVA420P16BE=92]="AV_PIX_FMT_YUVA420P16BE",pe[pe.AV_PIX_FMT_YUVA420P16LE=93]="AV_PIX_FMT_YUVA420P16LE",
			pe[pe.AV_PIX_FMT_YUVA422P16BE=94]="AV_PIX_FMT_YUVA422P16BE",pe[pe.AV_PIX_FMT_YUVA422P16LE=95]="AV_PIX_FMT_YUVA422P16LE",
			pe[pe.AV_PIX_FMT_YUVA444P16BE=96]="AV_PIX_FMT_YUVA444P16BE",pe[pe.AV_PIX_FMT_YUVA444P16LE=97]="AV_PIX_FMT_YUVA444P16LE",
			pe[pe.AV_PIX_FMT_VDPAU=98]="AV_PIX_FMT_VDPAU",pe[pe.AV_PIX_FMT_XYZ12LE=99]="AV_PIX_FMT_XYZ12LE",
			pe[pe.AV_PIX_FMT_XYZ12BE=100]="AV_PIX_FMT_XYZ12BE",pe[pe.AV_PIX_FMT_NV16=101]="AV_PIX_FMT_NV16",
			pe[pe.AV_PIX_FMT_NV20LE=102]="AV_PIX_FMT_NV20LE",pe[pe.AV_PIX_FMT_NV20BE=103]="AV_PIX_FMT_NV20BE",
			pe[pe.AV_PIX_FMT_RGBA64BE=104]="AV_PIX_FMT_RGBA64BE",pe[pe.AV_PIX_FMT_RGBA64LE=105]="AV_PIX_FMT_RGBA64LE",
			pe[pe.AV_PIX_FMT_BGRA64BE=106]="AV_PIX_FMT_BGRA64BE",pe[pe.AV_PIX_FMT_BGRA64LE=107]="AV_PIX_FMT_BGRA64LE",
			pe[pe.AV_PIX_FMT_YVYU422=108]="AV_PIX_FMT_YVYU422",pe[pe.AV_PIX_FMT_YA16BE=109]="AV_PIX_FMT_YA16BE",
			pe[pe.AV_PIX_FMT_YA16LE=110]="AV_PIX_FMT_YA16LE",pe[pe.AV_PIX_FMT_GBRAP=111]="AV_PIX_FMT_GBRAP",
			pe[pe.AV_PIX_FMT_GBRAP16BE=112]="AV_PIX_FMT_GBRAP16BE",pe[pe.AV_PIX_FMT_GBRAP16LE=113]="AV_PIX_FMT_GBRAP16LE",
			pe[pe.AV_PIX_FMT_QSV=114]="AV_PIX_FMT_QSV",pe[pe.AV_PIX_FMT_MMAL=115]="AV_PIX_FMT_MMAL",
			pe[pe.AV_PIX_FMT_D3D11VA_VLD=116]="AV_PIX_FMT_D3D11VA_VLD",pe[pe.AV_PIX_FMT_CUDA=117]="AV_PIX_FMT_CUDA",
			pe[pe.AV_PIX_FMT_0RGB=118]="AV_PIX_FMT_0RGB",pe[pe.AV_PIX_FMT_RGB0=119]="AV_PIX_FMT_RGB0",
			pe[pe.AV_PIX_FMT_0BGR=120]="AV_PIX_FMT_0BGR",pe[pe.AV_PIX_FMT_BGR0=121]="AV_PIX_FMT_BGR0",
			pe[pe.AV_PIX_FMT_YUV420P12BE=122]="AV_PIX_FMT_YUV420P12BE",pe[pe.AV_PIX_FMT_YUV420P12LE=123]="AV_PIX_FMT_YUV420P12LE",
			pe[pe.AV_PIX_FMT_YUV420P14BE=124]="AV_PIX_FMT_YUV420P14BE",pe[pe.AV_PIX_FMT_YUV420P14LE=125]="AV_PIX_FMT_YUV420P14LE",
			pe[pe.AV_PIX_FMT_YUV422P12BE=126]="AV_PIX_FMT_YUV422P12BE",pe[pe.AV_PIX_FMT_YUV422P12LE=127]="AV_PIX_FMT_YUV422P12LE",
			pe[pe.AV_PIX_FMT_YUV422P14BE=128]="AV_PIX_FMT_YUV422P14BE",pe[pe.AV_PIX_FMT_YUV422P14LE=129]="AV_PIX_FMT_YUV422P14LE",
			pe[pe.AV_PIX_FMT_YUV444P12BE=130]="AV_PIX_FMT_YUV444P12BE",pe[pe.AV_PIX_FMT_YUV444P12LE=131]="AV_PIX_FMT_YUV444P12LE",
			pe[pe.AV_PIX_FMT_YUV444P14BE=132]="AV_PIX_FMT_YUV444P14BE",pe[pe.AV_PIX_FMT_YUV444P14LE=133]="AV_PIX_FMT_YUV444P14LE",
			pe[pe.AV_PIX_FMT_GBRP12BE=134]="AV_PIX_FMT_GBRP12BE",pe[pe.AV_PIX_FMT_GBRP12LE=135]="AV_PIX_FMT_GBRP12LE",
			pe[pe.AV_PIX_FMT_GBRP14BE=136]="AV_PIX_FMT_GBRP14BE",pe[pe.AV_PIX_FMT_GBRP14LE=137]="AV_PIX_FMT_GBRP14LE",
			pe[pe.AV_PIX_FMT_YUVJ411P=138]="AV_PIX_FMT_YUVJ411P",pe[pe.AV_PIX_FMT_BAYER_BGGR8=139]="AV_PIX_FMT_BAYER_BGGR8",
			pe[pe.AV_PIX_FMT_BAYER_RGGB8=140]="AV_PIX_FMT_BAYER_RGGB8",pe[pe.AV_PIX_FMT_BAYER_GBRG8=141]="AV_PIX_FMT_BAYER_GBRG8",
			pe[pe.AV_PIX_FMT_BAYER_GRBG8=142]="AV_PIX_FMT_BAYER_GRBG8",
			pe[pe.AV_PIX_FMT_BAYER_BGGR16LE=143]="AV_PIX_FMT_BAYER_BGGR16LE",
			pe[pe.AV_PIX_FMT_BAYER_BGGR16BE=144]="AV_PIX_FMT_BAYER_BGGR16BE",
			pe[pe.AV_PIX_FMT_BAYER_RGGB16LE=145]="AV_PIX_FMT_BAYER_RGGB16LE",
			pe[pe.AV_PIX_FMT_BAYER_RGGB16BE=146]="AV_PIX_FMT_BAYER_RGGB16BE",
			pe[pe.AV_PIX_FMT_BAYER_GBRG16LE=147]="AV_PIX_FMT_BAYER_GBRG16LE",
			pe[pe.AV_PIX_FMT_BAYER_GBRG16BE=148]="AV_PIX_FMT_BAYER_GBRG16BE",
			pe[pe.AV_PIX_FMT_BAYER_GRBG16LE=149]="AV_PIX_FMT_BAYER_GRBG16LE",
			pe[pe.AV_PIX_FMT_BAYER_GRBG16BE=150]="AV_PIX_FMT_BAYER_GRBG16BE",
			pe[pe.AV_PIX_FMT_YUV440P10LE=151]="AV_PIX_FMT_YUV440P10LE",pe[pe.AV_PIX_FMT_YUV440P10BE=152]="AV_PIX_FMT_YUV440P10BE",
			pe[pe.AV_PIX_FMT_YUV440P12LE=153]="AV_PIX_FMT_YUV440P12LE",pe[pe.AV_PIX_FMT_YUV440P12BE=154]="AV_PIX_FMT_YUV440P12BE",
			pe[pe.AV_PIX_FMT_AYUV64LE=155]="AV_PIX_FMT_AYUV64LE",pe[pe.AV_PIX_FMT_AYUV64BE=156]="AV_PIX_FMT_AYUV64BE",
			pe[pe.AV_PIX_FMT_VIDEOTOOLBOX=157]="AV_PIX_FMT_VIDEOTOOLBOX",pe[pe.AV_PIX_FMT_P010LE=158]="AV_PIX_FMT_P010LE",
			pe[pe.AV_PIX_FMT_P010BE=159]="AV_PIX_FMT_P010BE",pe[pe.AV_PIX_FMT_GBRAP12BE=160]="AV_PIX_FMT_GBRAP12BE",
			pe[pe.AV_PIX_FMT_GBRAP12LE=161]="AV_PIX_FMT_GBRAP12LE",pe[pe.AV_PIX_FMT_GBRAP10BE=162]="AV_PIX_FMT_GBRAP10BE",
			pe[pe.AV_PIX_FMT_GBRAP10LE=163]="AV_PIX_FMT_GBRAP10LE",pe[pe.AV_PIX_FMT_MEDIACODEC=164]="AV_PIX_FMT_MEDIACODEC",
			pe[pe.AV_PIX_FMT_GRAY12BE=165]="AV_PIX_FMT_GRAY12BE",pe[pe.AV_PIX_FMT_GRAY12LE=166]="AV_PIX_FMT_GRAY12LE",
			pe[pe.AV_PIX_FMT_GRAY10BE=167]="AV_PIX_FMT_GRAY10BE",pe[pe.AV_PIX_FMT_GRAY10LE=168]="AV_PIX_FMT_GRAY10LE",
			pe[pe.AV_PIX_FMT_P016LE=169]="AV_PIX_FMT_P016LE",pe[pe.AV_PIX_FMT_P016BE=170]="AV_PIX_FMT_P016BE",
			pe[pe.AV_PIX_FMT_D3D11=171]="AV_PIX_FMT_D3D11",pe[pe.AV_PIX_FMT_GRAY9BE=172]="AV_PIX_FMT_GRAY9BE",
			pe[pe.AV_PIX_FMT_GRAY9LE=173]="AV_PIX_FMT_GRAY9LE",pe[pe.AV_PIX_FMT_GBRPF32BE=174]="AV_PIX_FMT_GBRPF32BE",
			pe[pe.AV_PIX_FMT_GBRPF32LE=175]="AV_PIX_FMT_GBRPF32LE",pe[pe.AV_PIX_FMT_GBRAPF32BE=176]="AV_PIX_FMT_GBRAPF32BE",
			pe[pe.AV_PIX_FMT_GBRAPF32LE=177]="AV_PIX_FMT_GBRAPF32LE",pe[pe.AV_PIX_FMT_DRM_PRIME=178]="AV_PIX_FMT_DRM_PRIME",
			pe[pe.AV_PIX_FMT_OPENCL=179]="AV_PIX_FMT_OPENCL",pe[pe.AV_PIX_FMT_GRAY14BE=180]="AV_PIX_FMT_GRAY14BE",
			pe[pe.AV_PIX_FMT_GRAY14LE=181]="AV_PIX_FMT_GRAY14LE",pe[pe.AV_PIX_FMT_GRAYF32BE=182]="AV_PIX_FMT_GRAYF32BE",
			pe[pe.AV_PIX_FMT_GRAYF32LE=183]="AV_PIX_FMT_GRAYF32LE",pe[pe.AV_PIX_FMT_YUVA422P12BE=184]="AV_PIX_FMT_YUVA422P12BE",
			pe[pe.AV_PIX_FMT_YUVA422P12LE=185]="AV_PIX_FMT_YUVA422P12LE",
			pe[pe.AV_PIX_FMT_YUVA444P12BE=186]="AV_PIX_FMT_YUVA444P12BE",
			pe[pe.AV_PIX_FMT_YUVA444P12LE=187]="AV_PIX_FMT_YUVA444P12LE",pe[pe.AV_PIX_FMT_NV24=188]="AV_PIX_FMT_NV24",
			pe[pe.AV_PIX_FMT_NV42=189]="AV_PIX_FMT_NV42",pe[pe.AV_PIX_FMT_VULKAN=190]="AV_PIX_FMT_VULKAN",
			pe[pe.AV_PIX_FMT_Y210BE=191]="AV_PIX_FMT_Y210BE",pe[pe.AV_PIX_FMT_Y210LE=192]="AV_PIX_FMT_Y210LE",
			pe[pe.AV_PIX_FMT_X2RGB10LE=193]="AV_PIX_FMT_X2RGB10LE",pe[pe.AV_PIX_FMT_X2RGB10BE=194]="AV_PIX_FMT_X2RGB10BE",
			pe[pe.AV_PIX_FMT_X2BGR10LE=195]="AV_PIX_FMT_X2BGR10LE",pe[pe.AV_PIX_FMT_X2BGR10BE=196]="AV_PIX_FMT_X2BGR10BE",
			pe[pe.AV_PIX_FMT_P210BE=197]="AV_PIX_FMT_P210BE",pe[pe.AV_PIX_FMT_P210LE=198]="AV_PIX_FMT_P210LE",
			pe[pe.AV_PIX_FMT_P410BE=199]="AV_PIX_FMT_P410BE",pe[pe.AV_PIX_FMT_P410LE=200]="AV_PIX_FMT_P410LE",
			pe[pe.AV_PIX_FMT_P216BE=201]="AV_PIX_FMT_P216BE",pe[pe.AV_PIX_FMT_P216LE=202]="AV_PIX_FMT_P216LE",
			pe[pe.AV_PIX_FMT_P416BE=203]="AV_PIX_FMT_P416BE",pe[pe.AV_PIX_FMT_P416LE=204]="AV_PIX_FMT_P416LE",
			pe[pe.AV_PIX_FMT_VUYA=205]="AV_PIX_FMT_VUYA",pe[pe.AV_PIX_FMT_RGBAF16BE=206]="AV_PIX_FMT_RGBAF16BE",
			pe[pe.AV_PIX_FMT_RGBAF16LE=207]="AV_PIX_FMT_RGBAF16LE",pe[pe.AV_PIX_FMT_VUYX=208]="AV_PIX_FMT_VUYX",
			pe[pe.AV_PIX_FMT_P012LE=209]="AV_PIX_FMT_P012LE",pe[pe.AV_PIX_FMT_P012BE=210]="AV_PIX_FMT_P012BE",
			pe[pe.AV_PIX_FMT_Y212BE=211]="AV_PIX_FMT_Y212BE",pe[pe.AV_PIX_FMT_Y212LE=212]="AV_PIX_FMT_Y212LE",
			pe[pe.AV_PIX_FMT_XV30BE=213]="AV_PIX_FMT_XV30BE",pe[pe.AV_PIX_FMT_XV30LE=214]="AV_PIX_FMT_XV30LE",
			pe[pe.AV_PIX_FMT_XV36BE=215]="AV_PIX_FMT_XV36BE",pe[pe.AV_PIX_FMT_XV36LE=216]="AV_PIX_FMT_XV36LE",
			pe[pe.AV_PIX_FMT_RGBF32BE=217]="AV_PIX_FMT_RGBF32BE",pe[pe.AV_PIX_FMT_RGBF32LE=218]="AV_PIX_FMT_RGBF32LE",
			pe[pe.AV_PIX_FMT_RGBAF32BE=219]="AV_PIX_FMT_RGBAF32BE",pe[pe.AV_PIX_FMT_RGBAF32LE=220]="AV_PIX_FMT_RGBAF32LE",
			pe[pe.AV_PIX_FMT_P212BE=221]="AV_PIX_FMT_P212BE",pe[pe.AV_PIX_FMT_P212LE=222]="AV_PIX_FMT_P212LE",
			pe[pe.AV_PIX_FMT_P412BE=223]="AV_PIX_FMT_P412BE",pe[pe.AV_PIX_FMT_P412LE=224]="AV_PIX_FMT_P412LE",
			pe[pe.AV_PIX_FMT_GBRAP14BE=225]="AV_PIX_FMT_GBRAP14BE",pe[pe.AV_PIX_FMT_GBRAP14LE=226]="AV_PIX_FMT_GBRAP14LE",
			pe[pe.AV_PIX_FMT_D3D12=227]="AV_PIX_FMT_D3D12",pe[pe.AV_PIX_FMT_NB=228]="AV_PIX_FMT_NB",
			(me=Se||(Se={}))[me.Main=0]="Main",me[me.High=1]="High",me[me.Professional=2]="Professional",
			(fe=Fe||(Fe={}))[fe.Profile0=0]="Profile0",fe[fe.Profile1=1]="Profile1",fe[fe.Profile2=2]="Profile2",
			fe[fe.Profile3=3]="Profile3",(Be=ye||(ye={}))[Be.kUnspecified=0]="kUnspecified",Be[Be.kSliceNonIDR=1]="kSliceNonIDR",
			Be[Be.kSliceDPA=2]="kSliceDPA",Be[Be.kSliceDPB=3]="kSliceDPB",Be[Be.kSliceDPC=4]="kSliceDPC",
			Be[Be.kSliceIDR=5]="kSliceIDR",Be[Be.kSliceSEI=6]="kSliceSEI",Be[Be.kSliceSPS=7]="kSliceSPS",
			Be[Be.kSlicePPS=8]="kSlicePPS",Be[Be.kSliceAUD=9]="kSliceAUD",Be[Be.kEndOfSequence=10]="kEndOfSequence",
			Be[Be.kEndOfStream=11]="kEndOfStream",Be[Be.kFiller=12]="kFiller",Be[Be.kSPSExt=13]="kSPSExt",
			Be[Be.kReserved0=14]="kReserved0",(ge=he||(he={}))[ge.kBaseline=66]="kBaseline",ge[ge.kMain=77]="kMain",
			ge[ge.kHigh=100]="kHigh",ge[ge.kConstrained=66]="kConstrained",ge[ge.kHigh10=110]="kHigh10",
			ge[ge.kHigh422=122]="kHigh422",ge[ge.kHigh444=244]="kHigh444",(be=Ue||(Ue={}))[be.kSliceNone=-1]="kSliceNone",
			be[be.kSliceP=0]="kSliceP",be[be.kSliceB=1]="kSliceB",be[be.kSliceI=2]="kSliceI",be[be.kSliceSP=5]="kSliceSP",
			be[be.kSliceSB=6]="kSliceSB",be[be.kSliceSI=7]="kSliceSI",(ke=Xe||(Xe={}))[ke.AVCC=1]="AVCC",ke[ke.ANNEXB=2]="ANNEXB",
			(Ge=Ye||(Ye={}))[Ge.kSliceTRAIL_N=0]="kSliceTRAIL_N",Ge[Ge.kSliceTRAIL_R=1]="kSliceTRAIL_R",
			Ge[Ge.kSliceTSA_N=2]="kSliceTSA_N",Ge[Ge.kSliceTSA_R=3]="kSliceTSA_R",Ge[Ge.kSliceSTSA_N=4]="kSliceSTSA_N",
			Ge[Ge.kSliceSTSA_R=5]="kSliceSTSA_R",Ge[Ge.kSliceRADL_N=6]="kSliceRADL_N",Ge[Ge.kSliceRADL_R=7]="kSliceRADL_R",
			Ge[Ge.kSliceRASL_N=8]="kSliceRASL_N",Ge[Ge.kSliceRASL_R=9]="kSliceRASL_R",Ge[Ge.kSliceBLA_W_LP=16]="kSliceBLA_W_LP",
			Ge[Ge.kSliceBLA_W_RADL=17]="kSliceBLA_W_RADL",Ge[Ge.kSliceBLA_N_LP=18]="kSliceBLA_N_LP",
			Ge[Ge.kSliceIDR_W_RADL=19]="kSliceIDR_W_RADL",Ge[Ge.kSliceIDR_N_LP=20]="kSliceIDR_N_LP",
			Ge[Ge.kSliceCRA_NUT=21]="kSliceCRA_NUT",Ge[Ge.kSliceVPS=32]="kSliceVPS",Ge[Ge.kSliceSPS=33]="kSliceSPS",
			Ge[Ge.kSlicePPS=34]="kSlicePPS",Ge[Ge.kSliceAUD=35]="kSliceAUD",Ge[Ge.kSliceEOS_NUT=36]="kSliceEOS_NUT",
			Ge[Ge.kSliceEOB_NUT=37]="kSliceEOB_NUT",
			Ge[Ge.kSliceFD_NUT=38]="kSliceFD_NUT",Ge[Ge.kSliceSEI_PREFIX=39]="kSliceSEI_PREFIX",
			Ge[Ge.kSliceSEI_SUFFIX=40]="kSliceSEI_SUFFIX",(we=He||(He={}))[we.Main=1]="Main",we[we.Main10=2]="Main10",
			we[we.MainStillPicture=3]="MainStillPicture",we[we.Main444=4]="Main444",(Ke=xe||(xe={}))[Ke.kSliceNone=-1]="kSliceNone",
			Ke[Ke.kSliceB=0]="kSliceB",Ke[Ke.kSliceP=1]="kSliceP",Ke[Ke.kSliceI=2]="kSliceI",
			($e=We||(We={}))[$e.kTRAIL_NUT=0]="kTRAIL_NUT",$e[$e.kSTSA_NUT=1]="kSTSA_NUT",$e[$e.kRADL_NUT=2]="kRADL_NUT",
			$e[$e.kRASL_NUT=3]="kRASL_NUT",$e[$e.kRSV_VCL_4=4]="kRSV_VCL_4",$e[$e.kRSV_VCL_5=5]="kRSV_VCL_5",
			$e[$e.kRSV_VCL_6=6]="kRSV_VCL_6",$e[$e.kIDR_W_RADL=7]="kIDR_W_RADL",$e[$e.kIDR_N_LP=8]="kIDR_N_LP",
			$e[$e.kCRA_NUT=9]="kCRA_NUT",$e[$e.kGDR_NUT=10]="kGDR_NUT",$e[$e.kRSV_IRAP_11=11]="kRSV_IRAP_11",
			$e[$e.kOPI_NUT=12]="kOPI_NUT",$e[$e.kDCI_NUT=13]="kDCI_NUT",$e[$e.kVPS_NUT=14]="kVPS_NUT",$e[$e.kSPS_NUT=15]="kSPS_NUT",
			$e[$e.kPPS_NUT=16]="kPPS_NUT",$e[$e.kPREFIX_APS_NUT=17]="kPREFIX_APS_NUT",$e[$e.kSUFFIX_APS_NUT=18]="kSUFFIX_APS_NUT",
			$e[$e.kPH_NUT=19]="kPH_NUT",$e[$e.kAUD_NUT=20]="kAUD_NUT",$e[$e.kEOS_NUT=21]="kEOS_NUT",$e[$e.kEOB_NUT=22]="kEOB_NUT",
			$e[$e.kPREFIX_SEI_NUT=23]="kPREFIX_SEI_NUT",$e[$e.kSUFFIX_SEI_NUT=24]="kSUFFIX_SEI_NUT",$e[$e.kFD_NUT=25]="kFD_NUT",
			$e[$e.kRSV_NVCL_26=26]="kRSV_NVCL_26",$e[$e.kRSV_NVCL_27=27]="kRSV_NVCL_27",$e[$e.kUNSPEC_28=28]="kUNSPEC_28",
			$e[$e.kUNSPEC_29=29]="kUNSPEC_29",$e[$e.kUNSPEC_30=30]="kUNSPEC_30",$e[$e.kUNSPEC_31=31]="kUNSPEC_31",
			(qe=Qe||(Qe={}))[qe.kSliceNone=-1]="kSliceNone",qe[qe.kSliceB=0]="kSliceB",qe[qe.kSliceP=1]="kSliceP",
			qe[qe.kSliceI=2]="kSliceI",(ze=je||(je={}))[ze.Layer1=32]="Layer1",ze[ze.Layer2=33]="Layer2",ze[ze.Layer3=34]="Layer3",
			(Ze=Je||(Je={}))[Ze.NONE=0]="NONE",Ze[Ze.READONLY=1]="READONLY",(et=_t||(_t={}))[et.MATCH_CASE=1]="MATCH_CASE",
			et[et.IGNORE_SUFFIX=2]="IGNORE_SUFFIX",et[et.DONT_OVERWRITE=16]="DONT_OVERWRITE",et[et.APPEND=32]="APPEND",
			et[et.MULTIKEY=64]="MULTIKEY",(At=tt||(tt={}))[At.AV_FRAME_FLAG_NONE=0]="AV_FRAME_FLAG_NONE",
			At[At.AV_FRAME_FLAG_CORRUPT=1]="AV_FRAME_FLAG_CORRUPT",At[At.AV_FRAME_FLAG_KEY=2]="AV_FRAME_FLAG_KEY",
			At[At.AV_FRAME_FLAG_DISCARD=4]="AV_FRAME_FLAG_DISCARD",At[At.AV_FRAME_FLAG_INTERLACED=8]="AV_FRAME_FLAG_INTERLACED",
			At[At.AV_FRAME_FLAG_TOP_FIELD_FIRST=16]="AV_FRAME_FLAG_TOP_FIELD_FIRST",(lt=at||(at={}))[lt.NONE=0]="NONE",
			lt[lt.INVALID_BITSTREAM=1]="INVALID_BITSTREAM",lt[lt.MISSING_REFERENCE=2]="MISSING_REFERENCE",
			lt[lt.CONCEALMENT_ACTIVE=4]="CONCEALMENT_ACTIVE",lt[lt.DECODE_SLICES=8]="DECODE_SLICES",
			(nt=Ct||(Ct={}))[nt.AV_PICTURE_TYPE_NONE=0]="AV_PICTURE_TYPE_NONE",nt[nt.AV_PICTURE_TYPE_I=1]="AV_PICTURE_TYPE_I",
			nt[nt.AV_PICTURE_TYPE_P=2]="AV_PICTURE_TYPE_P",nt[nt.AV_PICTURE_TYPE_B=3]="AV_PICTURE_TYPE_B",
			nt[nt.AV_PICTURE_TYPE_S=4]="AV_PICTURE_TYPE_S",nt[nt.AV_PICTURE_TYPE_SI=5]="AV_PICTURE_TYPE_SI",
			nt[nt.AV_PICTURE_TYPE_SP=6]="AV_PICTURE_TYPE_SP",nt[nt.AV_PICTURE_TYPE_BI=7]="AV_PICTURE_TYPE_BI",
			(rt=ot||(ot={}))[rt.AV_FRAME_DATA_PANSCAN=0]="AV_FRAME_DATA_PANSCAN",
			rt[rt.AV_FRAME_DATA_A53_CC=1]="AV_FRAME_DATA_A53_CC",rt[rt.AV_FRAME_DATA_STEREO3D=2]="AV_FRAME_DATA_STEREO3D",
			rt[rt.AV_FRAME_DATA_MATRIXENCODING=3]="AV_FRAME_DATA_MATRIXENCODING",
			rt[rt.AV_FRAME_DATA_DOWNMIX_INFO=4]="AV_FRAME_DATA_DOWNMIX_INFO",
			rt[rt.AV_FRAME_DATA_REPLAYGAIN=5]="AV_FRAME_DATA_REPLAYGAIN",
			rt[rt.AV_FRAME_DATA_DISPLAYMATRIX=6]="AV_FRAME_DATA_DISPLAYMATRIX",rt[rt.AV_FRAME_DATA_AFD=7]="AV_FRAME_DATA_AFD",
			rt[rt.AV_FRAME_DATA_MOTION_VECTORS=8]="AV_FRAME_DATA_MOTION_VECTORS",
			rt[rt.AV_FRAME_DATA_SKIP_SAMPLES=9]="AV_FRAME_DATA_SKIP_SAMPLES",
			rt[rt.AV_FRAME_DATA_AUDIO_SERVICE_TYPE=10]="AV_FRAME_DATA_AUDIO_SERVICE_TYPE",
			rt[rt.AV_FRAME_DATA_MASTERING_DISPLAY_METADATA=11]="AV_FRAME_DATA_MASTERING_DISPLAY_METADATA",
			rt[rt.AV_FRAME_DATA_GOP_TIMECODE=12]="AV_FRAME_DATA_GOP_TIMECODE",
			rt[rt.AV_FRAME_DATA_SPHERICAL=13]="AV_FRAME_DATA_SPHERICAL",
			rt[rt.AV_FRAME_DATA_CONTENT_LIGHT_LEVEL=14]="AV_FRAME_DATA_CONTENT_LIGHT_LEVEL",
			rt[rt.AV_FRAME_DATA_ICC_PROFILE=15]="AV_FRAME_DATA_ICC_PROFILE",
			rt[rt.AV_FRAME_DATA_S12M_TIMECODE=16]="AV_FRAME_DATA_S12M_TIMECODE",
			rt[rt.AV_FRAME_DATA_DYNAMIC_HDR_PLUS=17]="AV_FRAME_DATA_DYNAMIC_HDR_PLUS",
			rt[rt.AV_FRAME_DATA_REGIONS_OF_INTEREST=18]="AV_FRAME_DATA_REGIONS_OF_INTEREST",
			rt[rt.AV_FRAME_DATA_VIDEO_ENC_PARAMS=19]="AV_FRAME_DATA_VIDEO_ENC_PARAMS",
			rt[rt.AV_FRAME_DATA_SEI_UNREGISTERED=20]="AV_FRAME_DATA_SEI_UNREGISTERED",
			rt[rt.AV_FRAME_DATA_FILM_GRAIN_PARAMS=21]="AV_FRAME_DATA_FILM_GRAIN_PARAMS",
			rt[rt.AV_FRAME_DATA_DETECTION_BBOXES=22]="AV_FRAME_DATA_DETECTION_BBOXES",(Dt=it||(it={}))[Dt.AUDIO=0]="AUDIO",
			Dt[Dt.VIDEO=1]="VIDEO",(st=Et||(Et={}))[st.AV_PKT_FLAG_KEY=1]="AV_PKT_FLAG_KEY",
			st[st.AV_PKT_FLAG_CORRUPT=2]="AV_PKT_FLAG_CORRUPT",st[st.AV_PKT_FLAG_DISCARD=4]="AV_PKT_FLAG_DISCARD",
			st[st.AV_PKT_FLAG_TRUSTED=8]="AV_PKT_FLAG_TRUSTED",st[st.AV_PKT_FLAG_DISPOSABLE=16]="AV_PKT_FLAG_DISPOSABLE",
			st[st.AV_PKT_FLAG_END=32]="AV_PKT_FLAG_END",(ut=Vt||(Vt={}))[ut.SUBTITLE_NONE=0]="SUBTITLE_NONE",
			ut[ut.SUBTITLE_TEXT=1]="SUBTITLE_TEXT",ut[ut.SUBTITLE_WEBVTT=2]="SUBTITLE_WEBVTT",ut[ut.SUBTITLE_ASS=3]="SUBTITLE_ASS",
			(Ot=It||(It={}))[Ot.END=-1048576]="END",
			Ot[Ot.AGAIN=-1048575]="AGAIN",Ot[Ot.INVALID_OPERATION=-1048574]="INVALID_OPERATION",
			Ot[Ot.NETWORK_ERROR=-1048573]="NETWORK_ERROR",(Pt=Tt||(Tt={}))[Pt.FIT=0]="FIT",Pt[Pt.FILL=1]="FILL",
			(dt=ct||(ct={}))[dt.AVDISCARD_NONE=-16]="AVDISCARD_NONE",dt[dt.AVDISCARD_DEFAULT=0]="AVDISCARD_DEFAULT",
			dt[dt.AVDISCARD_NONREF=8]="AVDISCARD_NONREF",dt[dt.AVDISCARD_BIDIR=16]="AVDISCARD_BIDIR",
			dt[dt.AVDISCARD_NONINTRA=24]="AVDISCARD_NONINTRA",dt[dt.AVDISCARD_NONKEY=32]="AVDISCARD_NONKEY",
			dt[dt.AVDISCARD_ALL=48]="AVDISCARD_ALL",(vt=Mt||(Mt={}))[vt.STOPPED=0]="STOPPED",vt[vt.DESTROYING=1]="DESTROYING",
			vt[vt.DESTROYED=2]="DESTROYED",vt[vt.LOADING=3]="LOADING",vt[vt.LOADED=4]="LOADED",vt[vt.PLAYING=5]="PLAYING",
			vt[vt.PLAYED=6]="PLAYED",vt[vt.PAUSED=7]="PAUSED",vt[vt.SEEKING=8]="SEEKING",vt[vt.CHANGING=9]="CHANGING",
			(Lt=Rt||(Rt={}))[Lt.OPEN_FILE=0]="OPEN_FILE",Lt[Lt.ANALYZE_FILE=1]="ANALYZE_FILE",
			Lt[Lt.LOAD_AUDIO_DECODER=2]="LOAD_AUDIO_DECODER",Lt[Lt.LOAD_VIDEO_DECODER=3]="LOAD_VIDEO_DECODER",
			(pt=Nt||(Nt={}))[pt.IDLE=0]="IDLE",pt[pt.CONNECTING=1]="CONNECTING",pt[pt.BUFFERING=2]="BUFFERING",
			pt[pt.ERROR=3]="ERROR",pt[pt.COMPLETE=4]="COMPLETE"
			;var mt,Ft,ft,yt,Bt,ht,gt,Ut,bt,Xt,kt,Yt,Gt,Ht,wt,xt,Kt,Wt,$t,Qt,qt,jt,zt,Jt,Zt,_A,eA,tA,AA,aA,lA,CA,nA,oA,rA,iA,DA,EA,sA,VA,uA={
			exports:{}},IA={exports:{}};function requireIs$4(){if(Ft)return mt;Ft=1;return mt=function(_){return null!=_}}
			function requireIs$2(){if(ht)return Bt;ht=1;var _=function requireIs$3(){if(yt)return ft;yt=1;var _=requireIs$4(),e={
			object:true,function:true,undefined:true};return ft=function(t){return !!_(t)&&hasOwnProperty.call(e,typeof t)}}()
			;return Bt=function(e){if(!_(e))return  false;try{return !!e.constructor&&e.constructor.prototype===e}catch(t){return  false}}}
			function requireIs(){if(Xt)return bt;Xt=1;var _=function requireIs$1(){if(Ut)return gt;Ut=1;var _=requireIs$2()
			;return gt=function(e){if("function"!=typeof e)return  false;if(!hasOwnProperty.call(e,"length"))return  false;try{
			if("number"!=typeof e.length)return !1;if("function"!=typeof e.call)return !1;if("function"!=typeof e.apply)return !1
			}catch(t){return  false}return !_(e)}}(),e=/^\s*class[\s{/}]/,t=Function.prototype.toString;return bt=function(A){
			return !!_(A)&&!e.test(t.call(A))}}function requireIsValue(){if(Wt)return Kt;Wt=1;var _=function requireNoop(){
			return xt?wt:(xt=1,wt=function(){})}()();return Kt=function(e){return e!==_&&null!==e}}function requireKeys(){
			return jt?qt:(jt=1,qt=function requireIsImplemented$1(){return Ht?Gt:(Ht=1,Gt=function(){try{
			return Object.keys("primitive"),!0}catch(_){return  false}})}()()?Object.keys:function requireShim$2(){if(Qt)return $t;Qt=1
			;var _=requireIsValue(),e=Object.keys;return $t=function(t){return e(_(t)?Object(t):t)}}())}function requireShim$1(){
			if(_A)return Zt;_A=1;var _=requireKeys(),e=function requireValidValue(){if(Jt)return zt;Jt=1;var _=requireIsValue()
			;return zt=function(e){if(!_(e))throw new TypeError("Cannot use null or undefined");return e}}(),t=Math.max
			;return Zt=function(A,a){var l,C,n,o=t(arguments.length,2);for(A=Object(e(A)),n=function(_){try{A[_]=a[_];}catch(e){
			l||(l=e);}},C=1;C<o;++C)_(a=arguments[C]).forEach(n);if(void 0!==l)throw l;return A},Zt}function requireAssign(){
			return tA?eA:(tA=1,eA=function requireIsImplemented$2(){return Yt?kt:(Yt=1,kt=function(){var _,e=Object.assign
			;return "function"==typeof e&&(e(_={foo:"raz"},{bar:"dwa"},{trzy:"trzy"}),_.foo+_.bar+_.trzy==="razdwatrzy")})
			}()()?Object.assign:requireShim$1())}function requireContains(){return iA||(iA=1,rA=function requireIsImplemented(){
			if(CA)return lA;CA=1;var _="razdwatrzy";return lA=function(){
			return "function"==typeof _.contains&&true===_.contains("dwa")&&false===_.contains("foo")}
			}()()?String.prototype.contains:function requireShim(){if(oA)return nA;oA=1;var _=String.prototype.indexOf
			;return nA=function(e){return _.call(this,e,arguments[1])>-1},nA}()),rA}function requireD(){if(DA)return IA.exports;DA=1
			;var _=requireIs$4(),e=requireIs(),t=requireAssign(),A=function requireNormalizeOptions(){if(aA)return AA;aA=1
			;var _=requireIsValue(),e=Array.prototype.forEach,t=Object.create;return AA=function(A){var a=t(null)
			;return e.call(arguments,function(e){_(e)&&function(_,e){var t;for(t in _)e[t]=_[t];}(Object(e),a);}),a},AA
			}(),a=requireContains(),l=IA.exports=function(e,l){var C,n,o,r,i;return arguments.length<2||"string"!=typeof e?(r=l,l=e,
			e=null):r=arguments[2],_(e)?(C=a.call(e,"c"),n=a.call(e,"e"),o=a.call(e,"w")):(C=o=true,n=false),i={value:l,configurable:C,
			enumerable:n,writable:o},r?t(A(r),i):i};return l.gs=function(l,C,n){var o,r,i,D;return "string"!=typeof l?(i=n,n=C,C=l,
			l=null):i=arguments[3],_(C)?e(C)?_(n)?e(n)||(i=n,n=void 0):n=void 0:(i=C,C=n=void 0):C=void 0,_(l)?(o=a.call(l,"c"),
			r=a.call(l,"e")):(o=true,r=false),D={get:C,set:n,configurable:o,enumerable:r},i?t(A(i),D):D},IA.exports}
			const OA=getDefaultExportFromCjs(function requireEventEmitter(){return VA||(VA=1,module=uA,exports=uA.exports,n=requireD(),
			o=function requireValidCallable(){return sA?EA:(sA=1,EA=function(_){
			if("function"!=typeof _)throw new TypeError(_+" is not a function");return _})}(),r=Function.prototype.apply,
			i=Function.prototype.call,D=Object.create,E=Object.defineProperty,s=Object.defineProperties,
			V=Object.prototype.hasOwnProperty,u={configurable:true,enumerable:false,writable:true},e=function(e,A){var a,l;return o(A),
			l=this,_.call(this,e,a=function(){t.call(l,e,a),r.call(A,this,arguments);}),a.__eeOnceListener__=A,this},a={
			on:_=function(_,e){var t;return o(e),V.call(this,"__ee__")?t=this.__ee__:(t=u.value=D(null),E(this,"__ee__",u),
			u.value=null),t[_]?"object"==typeof t[_]?t[_].push(e):t[_]=[t[_],e]:t[_]=e,this},once:e,off:t=function(_,e){var t,A,a,l
			;if(o(e),!V.call(this,"__ee__"))return this;if(!(t=this.__ee__)[_])return this
			;if("object"==typeof(A=t[_]))for(l=0;a=A[l];++l)a!==e&&a.__eeOnceListener__!==e||(2===A.length?t[_]=A[l?0:1]:A.splice(l,1));else A!==e&&A.__eeOnceListener__!==e||delete t[_]
			;return this},emit:A=function(_){var e,t,A,a,l;if(V.call(this,"__ee__")&&(a=this.__ee__[_]))if("object"==typeof a){
			for(t=arguments.length,l=new Array(t-1),e=1;e<t;++e)l[e-1]=arguments[e];for(a=a.slice(),e=0;A=a[e];++e)r.call(A,this,l);
			}else switch(arguments.length){case 1:i.call(a,this);break;case 2:i.call(a,this,arguments[1]);break;case 3:
			i.call(a,this,arguments[1],arguments[2]);break;default:for(t=arguments.length,l=new Array(t-1),
			e=1;e<t;++e)l[e-1]=arguments[e];r.call(a,this,l);}}},l={on:n(_),once:n(e),off:n(t),emit:n(A)},C=s({},l),
			module.exports=exports=function(_){return null==_?D(C):s(Object(_),l)},exports.methods=a),uA.exports
			;var module,exports,_,e,t,A,a,l,C,n,o,r,i,D,E,s,V,u;}()),TA={dependencies:{"@cbingbing/demuxer":"^2.4.1",
			"@iconify/vue":"^5.0.0","@libmedia/avcodec":"^0.8.1","@libmedia/avformat":"^0.8.1","@libmedia/avnetwork":"^0.8.1",
			"@libmedia/avplayer":"^0.8.2","@libmedia/avutil":"^0.8.1","@libmedia/common":"^1.4.0",
			"@material-symbols/svg-400":"^0.28.2","@tailwindcss/vite":"^4.1.7","@types/event-emitter":"^0.3.5",
			"@types/eventemitter3":"^2.0.4","@vueuse/core":"^12.7.0","big-integer":"^1.6.52","blueimp-md5":"^2.19.0",
			dayjs:"^1.11.13","event-emitter":"^0.3.5",eventemitter3:"^5.0.1","glob-to-regexp":"^0.4.1","hls.js":"^1.5.20",
			"iconify-icon":"^3.0.0",localforage:"^1.10.0",lodash:"^4.17.21","m3u8-parser":"^7.2.0",photoswipe:"^5.4.4",
			tailwindcss:"^4.1.7",vue:"^3.5.13"}};function usePlayerCoreState(){
			const _=shallowRef(0),e=shallowRef(0),t=shallowRef(true),A=shallowRef(1),a=shallowRef(100),l=shallowRef(false),C=shallowRef(true),o=shallowRef(true),r=shallowRef(false),i=shallowRef(void 0),D=shallowRef(false),E=shallowRef(0),s=shallowRef(0),V=shallowRef(false)
			;return {currentTime:_,duration:e,paused:t,playbackRate:A,volume:a,muted:l,isLoading:C,loaded:D,autoPlay:o,canplay:r,
			loadError:i,videoWidth:E,videoHeight:s,isSuspended:V,reset:()=>{_.value=0,e.value=0,t.value=true,A.value=1,a.value=100,
			l.value=false,o.value=true,r.value=false,C.value=true,D.value=false,i.value=void 0,E.value=0,s.value=0,V.value=false;}}}
			const PA=`${ue$1}/gh/cbingb666/libmedia@latest/dist`,cA={isLive:false,enableHardware:true,enableWebCodecs:true,enableWebGPU:true,
			enableWorker:true,preLoadTime:60
			},dA=["audiocodec","videocodec","audioCurrentTime","videoCurrentTime","width","height","channels","sampleRate","bandwidth","audioBitrate","videoBitrate","audioPacketQueueLength","videoPacketQueueLength","videoEncodeFramerate","videoDecodeFramerate","videoRenderFramerate","keyFrameInterval","audioEncodeFramerate","audioDecodeFramerate","audioRenderFramerate","audioFrameDecodeIntervalMax","audioFrameRenderIntervalMax","videoFrameDecodeIntervalMax","videoFrameRenderIntervalMax","jitter","audioStutter","videoStutter"]
			;function getWasmUrl(..._){const[e,t,A]=_,a=`${PA}/decode`,l=`${PA}/resample`,C=`${PA}/stretchpitch`;switch(e){
			case "decoder":if(!t)return new Error("Missing codecId for decoder");if(t>=65536&&t<=65572)return `${a}/pcm-simd.wasm`
			;switch(t){case X_.AV_CODEC_ID_H264:return `${a}/h264-simd.wasm`;case X_.AV_CODEC_ID_HEVC:return `${a}/hevc-simd.wasm`
			;case X_.AV_CODEC_ID_MPEG4:return `${a}/mpeg4-simd.wasm`;case X_.AV_CODEC_ID_VVC:return `${a}/vvc-simd.wasm`
			;case X_.AV_CODEC_ID_AV1:return `${a}/av1-simd.wasm`;case X_.AV_CODEC_ID_VP8:return `${a}/vp8-simd.wasm`
			;case X_.AV_CODEC_ID_VP9:return `${a}/vp9-simd.wasm`;case X_.AV_CODEC_ID_THEORA:return `${a}/theora-simd.wasm`
			;case X_.AV_CODEC_ID_MPEG2VIDEO:return `${a}/mpeg2video-simd.wasm`;case X_.AV_CODEC_ID_AAC:return `${a}/aac-simd.wasm`
			;case X_.AV_CODEC_ID_MP3:return `${a}/mp3-simd.wasm`;case X_.AV_CODEC_ID_OPUS:return `${a}/opus-simd.wasm`
			;case X_.AV_CODEC_ID_FLAC:return `${a}/flac-simd.wasm`;case X_.AV_CODEC_ID_SPEEX:return `${a}/speex-simd.wasm`
			;case X_.AV_CODEC_ID_VORBIS:return `${a}/vorbis-simd.wasm`;case X_.AV_CODEC_ID_AC3:return `${a}/ac3-simd.wasm`
			;case X_.AV_CODEC_ID_EAC3:return `${a}/eac3-simd.wasm`;case X_.AV_CODEC_ID_DTS:return `${a}/dca-simd.wasm`;default:
			return new Error(`Unsupported decoder: ${e} ${t} ${A}`)}case "resampler":return `${l}/resample-simd.wasm`
			;case "stretchpitcher":return `${C}/stretchpitch-simd.wasm`;default:return new Error(`Unsupported wasm: ${e} ${t} ${A}`)}}
			function useAvPlayerCore(_){let t=false
			;const A=shallowRef(null),a=shallowRef(null),l=usePlayerCoreState(),C=ref(),D=shallowRef([]),E=ref([]),s=ref(null),V=ref(null),u=ref(null),I=computed(()=>E.value.filter(_=>"Audio"===_.mediaType)),O=computed(()=>E.value.filter(_=>"Video"===_.mediaType)),T=computed(()=>O.value.find(_=>_.id===V.value)),P=OA(),c=ref(true),d=ref(null),checkPlayer=()=>{
			if(!A.value)throw new Error("playerRef is not found");return A.value};watch(T,_=>{
			_&&(l.videoWidth.value=_.codecparProxy.width,l.videoHeight.value=_.codecparProxy.height);})
			;const{pause:M,resume:v}=useIntervalFn(()=>{var _;const e=dA,t=null==(_=A.value)?void 0:_.getStats()
			;t&&(C.value=Object.fromEntries(e.map(_=>[_,get(t,_)])));},1e3,{immediate:false}),R={init:async e=>{var C,n,o,r,i,E,s,V,u,I
			;try{const O=new(await async function loadESM({pkgName:_,version:e,path:t,varName:A}){
			e||(e=_ in TA.dependencies?TA.dependencies[_]:"latest")
			;const a=new Blob([`\n      import ${A} from "${ue$1}/npm/${_}@${e}/${t}";\n      window.${A} = ${A};\n  `],{
			type:"text/javascript"}),l=URL.createObjectURL(a);return new Promise((e,t)=>{const a=document.createElement("script")
			;a.type="module",a.src=l,a.onload=()=>{const checkModule=()=>{const _=se$1[A];_?(e(_),
			URL.revokeObjectURL(l)):setTimeout(checkModule,50);};checkModule();},a.onerror=e=>{URL.revokeObjectURL(l),
			t(new Error(`加载 ${_} 模块失败: ${e}`));},document.head.appendChild(a);})}({pkgName:"@libmedia/avplayer",
			path:"dist/esm/avplayer.js",varName:"AVPlayer"}))({...cA,..._.rootProps.avPlayerConfig,container:e,getWasm:(u=D.value,
			I=getWasmUrl,(..._)=>{const e=I(..._);return e instanceof Error?(u.push(_),""):e})});a.value=e,A.value=O,
			null==(C=A.value)||C.on("playing",()=>{l.paused.value=!1;}),null==(n=A.value)||n.on("paused",()=>{l.paused.value=!0;}),
			null==(o=A.value)||o.on("loaded",()=>{l.isLoading.value=!1,l.loaded.value=!0;}),null==(r=A.value)||r.on("error",_=>{}),
			null==(i=A.value)||i.on("seeking",()=>{l.isLoading.value=!0;}),null==(E=A.value)||E.on("seeked",()=>{l.isLoading.value=!1;
			}),null==(s=A.value)||s.on("timeout",()=>{}),null==(V=A.value)||V.on("time",_=>{t||(l.currentTime.value=Number(_)/1e3);});
			}catch(O){l.loadError.value=O;}},load:async(_,e)=>{d.value=e??null;const t=checkPlayer();await t.load(_,{http:{
			credentials:"include"}}).then(async()=>{E.value=await t.getStreams()
			;const _=E.value.find(_=>"Audio"===_.mediaType&&_.codecparProxy.chLayout.nbChannels<=8&&"eng"===_.metadata.language)
			;_&&(await t.selectAudio(_.id),s.value=_.id),v(),R.setVolume(l.volume.value),R.setMute(l.muted.value),
			R.setPlaybackRate(l.playbackRate.value),l.autoPlay.value?await R.play().then(async()=>{l.canplay.value=true,
			P.emit("canplay"),l.isSuspended.value=!l.muted.value&&t.isSuspended();}).catch(_=>{l.loadError.value=_;
			}):(l.canplay.value=true,P.emit("canplay"));}).catch(_=>{throw l.loadError.value=_,M(),_}),
			l.duration.value=Number(t.getDuration())/1e3;const{width:C,height:n}=useElementSize(a.value),o=useDebounceFn(()=>{
			A.value&&A.value.resize(C.value,n.value);},30);watch([C,n],o);},getRenderElement:()=>{var _,e
			;return (null==(_=a.value)?void 0:_.querySelector("canvas"))??(null==(e=a.value)?void 0:e.querySelector("video"))??null},
			play:()=>{const _=checkPlayer();return l.paused.value=false,_.play({subtitle:false}).then(async()=>{
			c.value&&(await R.seek(d.value??l.currentTime.value),c.value=false),V.value=_.getSelectedVideoStreamId(),
			u.value=_.getSelectedSubtitleStreamId();})},pause:()=>{const _=checkPlayer();return l.paused.value=true,_.pause()},
			togglePlay:()=>l.paused.value?R.play():R.pause(),setPlaybackRate:_=>{const e=checkPlayer();l.playbackRate.value=_,
			e.setPlaybackRate(Math.min(_,2));},setVolume:_=>{const e=checkPlayer();l.volume.value=_,e.setVolume(_/100*3);},
			setMute:_=>{const e=checkPlayer();l.muted.value=_,e.setVolume(_?0:100),_||R.resumeSuspended();},toggleMute:()=>{
			R.setMute(!l.muted.value);},resumeSuspended:async()=>{const _=checkPlayer();await _.resume(),l.isSuspended.value=false;},
			setAutoPlay:_=>{l.autoPlay.value=_;},seek:async _=>{t=true;const e=checkPlayer();l.currentTime.value=_,
			await e.seek(BigInt(Math.floor(1e3*_))),await nextTick(),t=false;},on:(_,e)=>{watch(A,t=>{if(t)switch(_){case "canplay":
			P.on("canplay",e);break;case "timeupdate":t.on("time",()=>{e(l.currentTime.value);});break;case "seeking":
			t.on("seeking",()=>{e(l.currentTime.value);});break;case "seeked":t.on("seeked",()=>{e(l.currentTime.value);});break
			;default:t.on(_,e);}},{once:true});},destroy:async()=>((()=>{var _,e
			;for(const[t,a]of Object.entries((null==(_=A.value)?void 0:_.listeners)??{}))for(const _ of a)null==(e=A.value)||e.off(t,_.fn);
			})(),M(),l.reset(),A.value&&(A.value.pause(),await A.value.destroy()),A.value=null,Promise.resolve())};return {...l,...R,
			stats:C,streams:E,audioStreams:I,videoStreams:O,audioStreamId:s,videoStreamId:V,subtitleStreamId:u,
			isSupportStream:_=>!D.value.find(([e,t])=>"decoder"===e&&t===_.codecparProxy.codecId),setAudioStream:async _=>{
			const e=checkPlayer();s.value=_,await e.selectAudio(_);},type:St.AvPlayer}}function useNativePlayerCore(_){
			const e=shallowRef(),t=usePlayerCoreState(),getVideoElementRef=()=>{if(!e.value)throw new Error("videoElementRef is not found")
			;return e.value},A={init:async _=>{const A=document.createElement("video");return _.appendChild(A),A.style.width="100%",
			A.style.height="100%",A.style.objectFit="contain",e.value=A,useEventListener(e,"play",()=>{t.paused.value=false;}),useEventListener(e,"pause",()=>{
			t.paused.value=true;}),useEventListener(e,"playing",()=>{t.paused.value=false;}),useEventListener(e,"ended",()=>{t.paused.value=true;}),useEventListener(e,"waiting",()=>{
			t.isLoading.value=true;}),useEventListener(e,"canplay",()=>{t.isLoading.value=false,t.canplay.value=true;}),useEventListener(e,"seeking",()=>{
			t.isLoading.value=true;}),useEventListener(e,"seeked",()=>{t.isLoading.value=false;}),useEventListener(e,"timeupdate",()=>{var _
			;t.currentTime.value=(null==(_=e.value)?void 0:_.currentTime)??0;}),Promise.resolve()},load:async(_,a)=>{
			const l=getVideoElementRef();return A.setVolume(t.volume.value),A.setMute(t.muted.value),
			A.setAutoPlay(t.autoPlay.value),l.currentTime=a??t.currentTime.value,l.src=_,A.setPlaybackRate(t.playbackRate.value),
			new Promise((_,a)=>{useEventListener(e,"loadedmetadata",()=>{t.duration.value=l.duration,t.videoWidth.value=l.videoWidth,
			t.videoHeight.value=l.videoHeight,_(),t.autoPlay.value&&A.play();}),useEventListener(e,"error",_=>{var e
			;if(_.target instanceof HTMLVideoElement){const A=new Error(null==(e=_.target.error)?void 0:e.message)
			;A.name="Media Error",t.loadError.value=A;}else t.loadError.value=new Error("Video element unknown error")
			;a(t.loadError.value);});})},getRenderElement:()=>getVideoElementRef(),play:()=>{const _=getVideoElementRef()
			;return _.play().then(()=>{t.paused.value=false;}).catch(e=>{if("NotAllowedError"===e.name&&null===_.error){
			t.isSuspended.value=true;return getVideoElementRef().muted=true,A.play()}if("AbortError"===e.name)throw e
			;throw t.loadError.value=e,e})},pause:()=>{const _=getVideoElementRef();return t.paused.value=true,_.pause(),
			Promise.resolve()},togglePlay:()=>t.paused.value?A.play():A.pause(),setPlaybackRate:_=>{const e=getVideoElementRef()
			;t.playbackRate.value=_,e.playbackRate=_;},setVolume:_=>{const e=getVideoElementRef();t.volume.value=_,e.volume=_/100;},
			setMute:_=>{const e=getVideoElementRef();t.muted.value=_,e.muted=_;},toggleMute:()=>{A.setMute(!t.muted.value),
			t.isSuspended.value&&(t.isSuspended.value=false);},resumeSuspended:async()=>{getVideoElementRef().muted=false,
			t.isSuspended.value=false;},setAutoPlay:_=>{const e=getVideoElementRef();t.autoPlay.value=_,e.autoplay=_;},
			seek:async _=>new Promise(e=>{const A=getVideoElementRef();A.currentTime=_,t.currentTime.value=_,
			A.src?useEventListener(A,"seeked",()=>{e();}):e();}),on:(_,t)=>{watch(e,e=>{if(e)switch(_){case "canplay":e.addEventListener("canplay",t)
			;break;case "timeupdate":e.addEventListener("timeupdate",()=>{t(e.currentTime);});break;case "seeking":
			e.addEventListener("seeking",()=>{t(e.currentTime);});break;case "seeked":e.addEventListener("seeked",()=>{
			t(e.currentTime);});break;default:e.addEventListener(_,t);}},{once:true});},destroy:()=>{const _=e.value;return _?(_.pause(),
			_.currentTime=0,_.src="",_.load(),_.remove(),t.reset(),e.value=void 0,Promise.resolve()):Promise.resolve()}};return {
			...t,...A,renderElementRef:e,type:St.Native}}const MA={autoStartLoad:true,maxBufferLength:1200,lowLatencyMode:true,
			startPosition:-1,debug:false};function useHlsPlayerCore(_){const e=shallowRef(null),t=useNativePlayerCore(),A={...t,
			init:async(A,a={})=>{await t.init(A),e.value=new S_({...MA,..._.rootProps.hlsConfig,...a});},load:_=>{
			const A=t.getRenderElement(),a=(()=>{if(!e.value)throw new Error("Hls is not initialized");return e.value})()
			;return a.loadSource(_),a.attachMedia(A),A.muted=t.muted.value,A.playbackRate=t.playbackRate.value,
			A.volume=t.volume.value/100,new Promise((_,e)=>{useEventListener(A,"loadedmetadata",()=>{t.duration.value=A.duration,_(),
			t.autoPlay.value&&t.play();}),useEventListener(A,"error",_=>{t.loadError.value=new Error("NotSupportedError"),e(t.loadError.value);});})},
			destroy:()=>(e.value&&(e.value.destroy(),e.value=null),t.destroy())};return {...t,...A,type:St.Hls}}
			function usePlayerCoreDecorator(_,e){const t=_(e),noop2=()=>{};t.on("canplay",e.rootProps.onCanplay??noop2),
			t.on("timeupdate",e.rootProps.onTimeupdate??noop2),t.on("seeking",e.rootProps.onSeeking??noop2),
			t.on("seeked",e.rootProps.onSeeked??noop2);const{handlePlayEnd:A}=function usePlayEndHandler(_){const getNextVideo=()=>{
			const e=_.rootProps.getCurrentPlaylist,t=_.rootProps.getCurrentPickCode;if(!e||!t)return null;const A=e(),a=t()
			;if(!(null==A?void 0:A.data)||0===A.data.length)return null;const l=A.data.findIndex(_=>_.pc===a);if(-1===l)return null
			;const C=l+1;return C>=A.data.length?null:A.data[C].pc};return {handlePlayEnd:async e=>{const t=_.playerCore.value
			;if(t)switch(e){case h_.STOP:break;case h_.REPEAT_ONE:try{await t.seek(0),await t.play();}catch(A){}break
			;case h_.AUTO_NEXT:{const e=getNextVideo();if(e){const t=_.rootProps.onChangeVideo;if(t)try{await t(e);}catch(A){
			}}break}}},getNextVideo:getNextVideo}}(e);t.on("ended",()=>{
			const _=e.rootProps.currentPlayMode??h_.STOP;A(_);})
			;const a=[syncRef(e.rootPropsVm.muted,t.muted),syncRef(e.rootPropsVm.playbackRate,t.playbackRate),syncRef(e.rootPropsVm.volume,t.volume),syncRef(e.rootPropsVm.autoPlay,t.autoPlay)]
			;return toReactive({...t,adjustVolume:_=>{const e=Math.min(Math.max(0,t.volume.value+_),100);t.setVolume(e);},skip:(_,e=false)=>{
			const A=e?_*t.duration.value:t.currentTime.value+_,a=Math.min(Math.max(0,A),t.duration.value);t.seek(a);},
			destroy:async()=>{a.forEach(_=>{_();}),await t.destroy();}})}function useControls(_){
			const t=shallowRef(null),A=shallowRef(true),a=shallowRef(0),l=computed(()=>a.value>0),C=shallowRef(false);let o=null,i=null;const E=computed(()=>{var _
			;return null==(_=t.value)?void 0:_.offsetHeight}),hide=()=>{A.value=false;},stopAutoHideTimer=()=>{o&&(clearTimeout(o),
			o=null);},handleAutoHide=()=>{l.value||hide();},startAutoHideTimer=()=>{l.value||(stopAutoHideTimer(),
			o=window.setTimeout(handleAutoHide,1e3));},addDisabledAutoHide=()=>{a.value++,1===a.value&&stopAutoHideTimer();
			},removeDisabledAutoHide=()=>{a.value=Math.max(0,a.value-1);},s=useThrottleFn(()=>{A.value=true,startAutoHideTimer();},200),V=useDebounceFn(()=>{
			C.value||(stopAutoHideTimer(),hide());},30);return watch([A,E],()=>{
			_.cssVar&&(A.value?_.cssVar.safeAreaBottom.value=`${E.value}px`:_.cssVar.safeAreaBottom.value="0px");}),
			useEventListener(_.refs.rootRef,"mousemove",s),useEventListener(_.refs.rootRef,"mouseleave",V),onUnmounted(()=>{stopAutoHideTimer();}),{visible:A,mainRef:t,
			disabledHideOnMouseLeave:C,disabledAutoHide:l,setDisabledAutoHide:_=>{_?addDisabledAutoHide():removeDisabledAutoHide();},
			setDisabledHideOnMouseLeave:_=>{C.value=_;},lockControlsWithTimeoutUnlock:(_=1e3)=>{i&&clearTimeout(i),C.value=true,
			stopAutoHideTimer(),i=window.setTimeout(()=>{C.value=false,startAutoHideTimer();},_);},
			addDisabledAutoHide:addDisabledAutoHide,removeDisabledAutoHide:removeDisabledAutoHide,
			startAutoHideTimer:startAutoHideTimer,stopAutoHideTimer:stopAutoHideTimer}}
			const vA="Shift",RA="Alt",LA="Control",NA="Meta",pA="ArrowLeft",SA="ArrowRight",mA={progress:{
			keys:["0","1","2","3","4","5","6","7","8","9"],name:"进度跳转",keydown:(_,e)=>{var t;const A=e.key,a=Number(A),l=a/10
			;null==(t=_.playerCore.value)||t.skip(l,true),_.hud&&_.hud.showProgressJump(a);}},fastBackward:{keys:[pA,"a","A"],
			name:"快退",allowRepeat:true,keydown:_=>{var e,t;null==(e=_.playerCore.value)||e.skip(-5),
			null==(t=_.hud)||t.showFastJumpHud(-1);}},fastForward:{keys:[SA,"d","D"],name:"快进",allowRepeat:true,keydown:async(_,e)=>{
			var t,A,a,l,C
			;if(e.repeat)return (null==(t=_.playbackRate)?void 0:t.fastForward.value)||null==(A=_.playbackRate)||A.startLongPressFastForward(),
			void(null==(a=_.hud)||a.showLongPressFastForward());null==(l=_.playerCore.value)||l.skip(5),
			null==(C=_.hud)||C.showFastJumpHud(1);},keyup:async _=>{var e,t,A
			;(null==(e=_.playbackRate)?void 0:e.fastForward.value)&&(null==(t=_.playbackRate)||t.stopLongPressFastForward(),
			null==(A=_.hud)||A.clear());}},playbackRateUp:{keys:["ArrowUp","w","W"],name:"播放速度增大",allowRepeat:true,keydown:async _=>{
			var e,t;null==(e=_.playbackRate)||e.up(),null==(t=_.hud)||t.showPlaybackRate();}},playbackRateDown:{
			keys:["ArrowDown","s","S"],name:"播放速度减小",allowRepeat:true,keydown:(_,e)=>{var t,A,a,l
			;e.repeat?(null==(t=_.playbackRate)||t.downWithLowerLimit(),
			null==(A=_.hud)||A.showPlaybackRate()):(null==(a=_.playbackRate)||a.down(),null==(l=_.hud)||l.showPlaybackRate());}},
			volumeUp:{keys:["="],name:"音量增大",allowRepeat:true,keydown:_=>{var e,t;null==(e=_.playerCore.value)||e.adjustVolume(5),
			null==(t=_.hud)||t.showVolume();}},volumeDown:{keys:["-"],name:"音量减小",allowRepeat:true,keydown:_=>{var e,t
			;null==(e=_.playerCore.value)||e.adjustVolume(-5),null==(t=_.hud)||t.showVolume();}},togglePlay:{keys:[" "],name:"播放/暂停",
			keydown:_=>{var e;null==(e=_.playerCore.value)||e.togglePlay();}},toggleMute:{keys:["m"],name:"切换静音",keydown:_=>{
			var e,t,A,a,l
			;if(null==(e=_.playerCore.value)?void 0:e.isSuspended)return null==(t=_.playerCore.value)||t.resumeSuspended(),
			void(null==(A=_.hud)||A.showResumeSuspended());null==(a=_.playerCore.value)||a.toggleMute(),
			null==(l=_.hud)||l.showMute();}},toggleFullscreen:{keys:["f","F"],name:"切换全屏",keydown:_=>{var e
			;null==(e=_.fullscreen)||e.toggleFullscreen();}},toggleShowSider:{keys:["b","B"],name:"切换播放列表",keydown:_=>{var e
			;null==(e=_.fullscreen)||e.toggleShowSider();}},rotateLeft:{keys:["[","l","L"],name:"向左旋转",keydown:_=>{var e
			;null==(e=_.transform)||e.left();}},rotateRight:{keys:["]","r","R"],name:"向右旋转",keydown:_=>{var e
			;null==(e=_.transform)||e.right();}},previousVideo:{keys:[pA],name:"上一集",keydown:_=>{const e=_.rootProps.onPreviousVideo
			;e&&e();}},nextVideo:{keys:[SA],name:"下一集",keydown:_=>{const e=_.rootProps.onNextVideo;e&&e();}},resetRotation:{
			keys:["\\"],name:"重置旋转",keydown:_=>{var e;null==(e=_.transform)||e.normal();}},toggleFlipX:{keys:["h","H"],name:"水平翻转",
			keydown:_=>{var e;null==(e=_.transform)||e.toggleFlipX();}},toggleFlipY:{keys:["j","J"],name:"垂直翻转",keydown:_=>{var e
			;null==(e=_.transform)||e.toggleFlipY();}}};function parseKeyConfig(_){return new Set(_.split("+").filter(_=>""!==_))}
			function isSame(_,e){return _.size===e.size&&Array.from(e).every(e=>_.has(e))}function matchKey(_){
			const e=function preseKeyEvent(_){
			const e=[_.altKey?RA:null,_.shiftKey?vA:null,_.ctrlKey?LA:null,_.metaKey?NA:null].filter(_=>!!_)
			;return new Set([...e,_.key])}(_);for(const t of Object.values(mA))for(const _ of t.keys){
			if(isSame(e,parseKeyConfig(_)))return {key:_,config:t}}return null}
			const FA="material-symbols:pause-rounded",fA="material-symbols:play-arrow-rounded",yA="gis:flip-h",BA="gis:flip-v"
			;function getVolumeIcon(_=0,e=false){
			return e?"material-symbols:volume-off-rounded":0===_?"material-symbols:volume-mute-rounded":_<50?"material-symbols:volume-down-rounded":"material-symbols:volume-up-rounded"
			}function fillZero(_){return _.toString().padStart(2,"0")}function formatTime(_){
			if(Number.isNaN(_)||void 0===_)return "--:--";const e=Math.floor(_/3600),t=Math.floor(_%3600/60),A=Math.floor(_%60)
			;return `${e>0?`${fillZero(e)}:`:""}${fillZero(t)}:${fillZero(A)}`}const hA=500,gA=1500;const UA={m3u8:"m3u8",mkv:"mkv",
			unknown:"unknown"};function useSources(_){
			const e=_.refs.playerElementRef,t=null==_?void 0:_.playerCore,A=_.rootProps.sources,a=ref(null),l=shallowRef(false),C=shallowRef(false),initializeVideo=async(l,C,n)=>{
			var o,r;if(!_.driver)throw new Error("videoDriver is not found");a.value=l;try{
			if(await(null==(o=_.driver)?void 0:o.switchDriver(C??(_=>"hls"===_.type?St.Hls:[UA.mkv].includes(_.extension)?St.AvPlayer:St.Native)(l))),
			!t.value)throw new Error("player is not found");if(!e.value)throw new Error("playerElementRef is not found")
			;await t.value.init(e.value),await t.value.load(l.url,n??0);}catch(i){
			if(i instanceof DOMException&&"AbortError"===i.name)return;if(i instanceof Error){
			const _=A.value.find(_=>"hls"===_.type)
			;return void(_&&(null==(r=null==t?void 0:t.value)?void 0:r.type)!==St.Hls&&await initializeVideo(_,void 0,n??0))}throw i
			}},i=useDebounceFn(async _=>{var e,A;if(!C.value){if(!a.value)throw new Error("当前没有视频源");C.value=true;try{
			const l=(null==(e=t.value)?void 0:e.currentTime)||0,C=(null==(A=t.value)?void 0:A.paused)??!0
			;t.value&&!t.value.paused&&await t.value.pause(),await initializeVideo(a.value,_),t.value&&(await t.value.seek(l),
			C||await t.value.play());}finally{C.value=false;}}},300);return watch(A,async()=>{var e;if(l.value=false,
			0===A.value.length)return void(await(null==(e=_.playerCore.value)?void 0:e.destroy()));const t=await(async()=>{
			if(0===A.value.length)return null;const e=_.rootProps.videoId;if(!e)return A.value[0];try{
			const _=await Pt$1.getPreference(e);if(!_)return A.value[0];const t=A.value.find(e=>e.quality===_.quality)
			;return t?(log(`使用画质偏好: ${_.quality}P`),t):(warn(`画质偏好 ${_.quality}P 不存在，使用默认最高画质`),A.value[0])}catch(t){
			return A.value[0]}})();t&&await initializeVideo(t,void 0,toValue(_.rootProps.lastTime));},{immediate:true,
			deep:true}),{list:A,current:a,changeQuality:async e=>{if(!t.value)throw new Error("player is not found")
			;const A=t.value.currentTime||0,a=_.rootProps.videoId;if(a)try{await Pt$1.setPreference(a,e.quality,e.displayQuality),
			log(`画质偏好已保存: ${e.quality}P`);}catch(l){}await initializeVideo(e),t.value.seek(A);},interruptSource:()=>{
			l.value=true,t.value&&t.value.destroy().catch(_=>error("销毁播放器失败:",_));},resumeSource:()=>{l.value=false,initializeVideo(a.value);},
			isInterrupt:l,isSwitching:C,switchPlayerCore:i}}function useTransform(_){
			const t=270,A=shallowRef(0),a=shallowRef(false),l=shallowRef(false),C=useElementSize(_.refs.playerElementRef),o=computed(()=>{var e,t
			;return function calculateScale(_,e,t,A,a){
			const l=_/e,C=a*Math.PI/180,n=Math.abs(Math.cos(C)),o=Math.abs(Math.sin(C)),r=t/(t*n+A*o),i=A/(t*o+A*n)
			;return l>1?Math.min(r,i):Math.max(r,i)
			}((null==(e=_.playerCore.value)?void 0:e.videoWidth)??16,(null==(t=_.playerCore.value)?void 0:t.videoHeight)??9,C.width.value,C.height.value,A.value)
			}),i=computed(()=>({
			transform:[`rotate(${A.value}deg)`,`scale(${o.value*(a.value?-1:1)}, ${o.value*(l.value?-1:1)})`,"translateZ(0)"].join(" ")
			})),D=computed(()=>-270===A.value),E=computed(()=>A.value===t);return watchEffect(()=>{_.rootProps.videoId&&(async()=>{
			const e=_.rootProps.videoId;if(e)try{const _=await Nt$1.getPreference(e);_&&(A.value=_.rotate,a.value=_.flipX,
			l.value=_.flipY);}catch(t){}})();}),watch([A,a,l],()=>{setTimeout(()=>{(async()=>{
			const e=_.rootProps.videoId;if(e)try{await Nt$1.setPreference(e,A.value,a.value,l.value),log("旋转翻转偏好已保存");}catch(t){
			}})();},100);}),{rotate:A,flipX:a,flipY:l,left:()=>{if(A.value<=-270)return;const _=A.value-90
			;A.value=Math.max(_,-270);},right:()=>{if(A.value>=t)return;const _=A.value+90;A.value=Math.min(_,t);},normal:()=>{
			A.value=0,a.value=false,l.value=false;},toggleFlipX:()=>{a.value=!a.value;},toggleFlipY:()=>{l.value=!l.value;},isLeftDisabled:D,
			isRightDisabled:E,transformStyle:i}}const bA=Symbol("XPlayer");function usePlayerProvide(_,t,A){const a={refs:{
			rootRef:_.rootRef,playerElementRef:_.playerElementRef},rootEmit:A,rootProps:t,rootPropsVm:useVModels(t,A),playerCore:ref()}
			;return a.driver=function useSwitchPlayerCore(_){let e=false;return {switchDriver:async t=>{if(!e){e=true;try{
			switch(_.playerCore.value&&(await _.playerCore.value.destroy(),_.playerCore.value=void 0),
			await new Promise(_=>setTimeout(_,0)),t){case St.Native:_.playerCore.value=usePlayerCoreDecorator(useNativePlayerCore,_)
			;break;case St.Hls:_.playerCore.value=usePlayerCoreDecorator(useHlsPlayerCore,_);break;case St.AvPlayer:
			_.playerCore.value=usePlayerCoreDecorator(useAvPlayerCore,_);break;default:
			throw new Error(`Unsupported video type: ${t}`)}}catch(A){throw A}finally{e=false;}}}}}(a),
			a.popupManager=function usePopupManager(_){
			const t=reactive(new Map),A=new Set,a=computed(()=>Array.from(t.values()).some(_=>_.visible&&_.allowPreventControlsClose))
			;return watch(a,e=>{
			e?(_.controls.addDisabledAutoHide(),_.controls.setDisabledHideOnMouseLeave(true)):(_.controls.removeDisabledAutoHide(),
			_.controls.setDisabledHideOnMouseLeave(false));}),{hasOpenPopup:a,disabledBubblingElements:A,registerPopup:(_,e)=>{
			t.set(_,e);},unregisterPopup:_=>{t.delete(_);},setPopupVisible:(_,e)=>{const A=t.get(_);A&&(A.visible=e);},
			addDisabledBubblingElement:_=>{A.add(_);},removeDisabledBubblingElement:_=>{A.delete(_);}}}(a),
			a.playbackRate=function usePlaybackRate(_){
			const t=shallowRef([.3,.5,.7,1,1.3,1.5,1.7,2,3,5,10,15]),A=_.rootPropsVm.playbackRate,a=computed(()=>t.value.findIndex(_=>_===A.value)??-1),l=shallowRef(false),set=e=>{
			var t;null==(t=_.playerCore.value)||t.setPlaybackRate(e);},setByIndex=_=>{if(_<0||_>=t.value.length)return
			;const e=t.value[_];set(e);},C=shallowRef(1);return {MIN_RATE:.3,MAX_RATE:15,NORMAL_RATE:1,current:A,rateOptions:t,fastForward:l,
			set:set,up:()=>{setByIndex(a.value+1);},down:()=>{setByIndex(a.value-1);},downWithLowerLimit:()=>{
			A.value<=1||setByIndex(a.value-1);},startLongPressFastForward:()=>{_.playerCore.value&&!l.value&&(l.value=true,set(15),
			C.value=A.value,_.playerCore.value.paused&&_.playerCore.value.play());},stopLongPressFastForward:()=>{
			_.playerCore.value&&(l.value=false,set(C.value));}}}(a),a.fullscreen=function useFullscreen(_){
			const e=_.rootPropsVm.showPlaylist,t=shallowRef(false),A=shallowRef(false),handleFullscreenChange=()=>{t.value=!!document.fullscreenElement;}
			;return useEventListener(document,"fullscreenchange",handleFullscreenChange),
			useEventListener(document,"webkitfullscreenchange",handleFullscreenChange),useEventListener(document,"mozfullscreenchange",handleFullscreenChange),
			useEventListener(document,"MSFullscreenChange",handleFullscreenChange),{showPlaylist:e,isFullscreen:t,toggleFullscreen:async()=>{
			_.controls.lockControlsWithTimeoutUnlock();try{document.fullscreenElement?(await document.exitFullscreen(),
			A.value&&(e.value=!0)):(window.scrollTo(0,0),await document.documentElement.requestFullscreen(),A.value=e.value,
			e.value&&(e.value=!1));}catch(t){}},toggleShowSider:async()=>{const _=!e.value;e.value=_;}}}(a),
			a.progressBar=function useProgressBar(_){const e=shallowRef(false),t=shallowRef(false);let A=null;return watch(e,(_,e)=>{_&&!e?A=setTimeout(()=>{
			t.value=true;},300):!_&&e&&(A&&(clearTimeout(A),A=null),t.value=false);}),{isDragging:e,isLongPressDragging:t,
			waitDragEnd:()=>new Promise(_=>{const t=watch(e,e=>{e||(_(true),t());});})}}(),a.controls=useControls(a),a.source=useSources(a),
			a.hotKey=function useHotKey(_){useEventListener("keydown",e=>{const t=matchKey(e);if(null==t?void 0:t.key){if(e.preventDefault(),
			e.repeat&&!t.config.allowRepeat)return;t.config.keydown(_,e,t);}}),useEventListener("keyup",e=>{var t,A;const a=matchKey(e)
			;(null==a?void 0:a.key)&&(e.preventDefault(),null==(A=(t=a.config).keyup)||A.call(t,_,e,a));});}(a),
			a.transform=useTransform(a),a.thumbnailSettings=function useThumbnailSettings(_){return {
			autoLoadThumbnails:_.rootPropsVm.autoLoadThumbnails,samplingInterval:_.rootPropsVm.thumbnailsSamplingInterval,
			toggleAutoLoad:()=>{_.rootPropsVm.autoLoadThumbnails.value=!_.rootPropsVm.autoLoadThumbnails.value;},
			setSamplingInterval:e=>{_.rootPropsVm.thumbnailsSamplingInterval.value=e;}}}(a),a.hud=function useHud(_){const t=shallowRef(null)
			;let A=null;const a=computed(()=>t.value?[t.value]:[]),show=_=>{const e=Date.now(),a=_.duration||gA;null!==A&&(clearTimeout(A),
			A=null),t.value={..._,timestamp:e},A=window.setTimeout(()=>{t.value=null,A=null;},a);
			},getCurrentProgressPercentage=()=>_.playerCore.value&&_.playerCore.value.duration>0?_.playerCore.value.currentTime/_.playerCore.value.duration*100:0
			;if(_.transform){const{rotate:e,flipX:t,flipY:A}=_.transform;watch(e,(_,e)=>{ void 0!==e&&show({title:"旋转",
			icon:"material-symbols:rotate-right-rounded",value:`${_}°`});}),watch(t,_=>{show({title:"水平翻转",icon:yA,value:_?"开启":"关闭",
			iconClass:_?"text-base-content":"text-base-content/70"});}),watch(A,_=>{show({title:"垂直翻转",icon:BA,value:_?"开启":"关闭",
			iconClass:_?"text-base-content":"text-base-content/70"});});}return onUnmounted(()=>{null!==A&&(clearTimeout(A),A=null);}),{
			messages:a,show:show,clear:()=>{null!==A&&(clearTimeout(A),A=null),t.value=null;},showProgressJump:e=>{var t
			;const A=e/10,a=A*((null==(t=_.playerCore.value)?void 0:t.duration)||0),l=`${Math.floor(a/60)}:${Math.floor(a%60).toString().padStart(2,"0")}`
			;show({title:0===e?"跳转到开头":`跳转到 ${e}0%`,icon:"material-symbols:location-on-rounded",value:l,progress:{max:100,min:0,
			value:100*A}});},showFastJumpHud:e=>{var t;const A=getCurrentProgressPercentage();show({title:1===e?"快进":"快退",
			value:formatTime((null==(t=_.playerCore.value)?void 0:t.currentTime)||0),
			icon:1===e?"material-symbols:fast-forward-rounded":"material-symbols:fast-rewind-rounded",progress:{max:100,min:0,
			value:A},duration:hA});},showMute:()=>{var e,t
			;const A=null==(e=_.playerCore.value)?void 0:e.muted,a=getVolumeIcon((null==(t=_.playerCore.value)?void 0:t.volume)??0,A??false)
			;show({icon:a,value:A?"静音":"取消静音"});},showPlaybackRate:()=>{var e
			;const t=null==(e=_.playerCore.value)?void 0:e.playbackRate;t&&show({title:"播放速度",icon:"material-symbols:timer-rounded",
			value:t});},showVolume:()=>{var e,t,A
			;const a=null==(e=_.playerCore.value)?void 0:e.volume,l=getVolumeIcon((null==(t=_.playerCore.value)?void 0:t.volume)??0,(null==(A=_.playerCore.value)?void 0:A.muted)??false)
			;show({title:"音量",icon:l,value:`${a}`,progress:{value:a,max:100,min:0}});},showLongPressFastForward:()=>{var e
			;const t=getCurrentProgressPercentage();show({title:"快速播放",icon:"material-symbols:rocket-launch-rounded",
			value:`${formatTime((null==(e=_.playerCore.value)?void 0:e.currentTime)||0)}`,progress:{max:100,min:0,value:t}});},
			showResumeSuspended:()=>{var e,t
			;const A=getVolumeIcon((null==(e=_.playerCore.value)?void 0:e.volume)??0,(null==(t=_.playerCore.value)?void 0:t.muted)??false)
			;show({icon:A,value:"音频已恢复"});}}}(a),a.cssVar=function useCssVar$1(_){const e={safeAreaBottom:"--x-player-safe-area-bottom"
			};return {safeAreaBottom:useCssVar(e.safeAreaBottom,_.refs.rootRef,{initialValue:"0px"}),keys:e}}(a),provide(bA,a),a}
			function usePlayerContext(){const _=inject(bA)
			;if(!_)throw new Error("usePlayerContext must be used within a VideoPlayer component");return _}
			const XA=Symbol("XPlayerPortal");const kA=new Set;const _export_sfc=(_,e)=>{const t=_.__vccOpts||_
			;for(const[A,a]of e)t[A]=a;return t},YA=_export_sfc(defineComponent({inheritAttrs:false,__name:"index",props:{visible:{type:Boolean},x:{
			default:0},y:{default:0},trigger:{},placement:{},offset:{},outsideStopPropagation:{type:Boolean,default:false},
			allowPreventControlsClose:{type:Boolean,default:true}},emits:["update:visible","after-leave"],setup(_,{emit:t}){
			const a=_,o=t,i="x-popup bg-base-100/90 rounded-2xl p-2 border border-neutral-950 relative overflow-hidden",{container:E}=function usePortal(){
			const _=inject(XA);if(!_)throw new Error("usePortal must be used within a XPlayer component");return _
			}(),{popupManager:s}=usePlayerContext(),V=useVModel(a,"visible",o),u=shallowRef(),p=shallowRef({x:0,y:0
			}),S=computed(()=>E.value||"body"),m=computed(()=>"string"==typeof S.value?document.querySelector(S.value)??void 0:S.value),F=computed(()=>({
			left:`${p.value.x}px`,top:`${p.value.y}px`,position:E.value?"absolute":"fixed"
			})),f=useElementBounding(m),y=`popup-${Math.random().toString(36).substr(2,9)}`;function updatePosition(){
			const _=function getPosition(_,e,t){if(!_)return {x:a.x,y:a.y};if(!e||!t)return {x:0,y:0}
			;const A=_.getBoundingClientRect(),l=e.getBoundingClientRect(),C=t.getBoundingClientRect(),n=A.left-C.left,o=A.width,r=A.top-C.top,i=A.bottom-C.top,D=C.height-i,E=r,s=a.offset??8
			;let V;V="top"===a.placement||"bottom"!==a.placement&&D<l.height&&E>=l.height?r-l.height-s:i+s;let u=n+o/2-l.width/2
			;return u=Math.max(16,u),u=Math.min(u,C.width-l.width-16),{x:u,y:V}}(a.trigger,u.value,m.value);p.value=_;}watch(V,_=>{
			null==s||s.setPopupVisible(y,_);}),onMounted(()=>{null==s||s.registerPopup(y,{visible:V.value,trigger:a.trigger,
			container:u.value,portalContainer:m.value,allowPreventControlsClose:a.allowPreventControlsClose});}),onUnmounted(()=>{
			null==s||s.unregisterPopup(y);});const onEnter=()=>{updatePosition();};watch(()=>f,()=>{V.value&&updatePosition();},{deep:true}),
			watch(()=>a.trigger,(_,e)=>{_&&!kA.has(_)&&kA.add(_),!_&&e&&kA.has(e)&&kA.delete(e);}),onClickOutside(u,_=>{
			V.value&&(a.trigger&&function isInContainsTrigger(_,e){return !!e&&e.contains(_.target)
			}(_,a.trigger)&&_.stopPropagation(),a.outsideStopPropagation&&_.stopPropagation(),
			(null==s?void 0:s.disabledBubblingElements.has(_.target))&&_.stopPropagation(),V.value=false);});const onAfterLeave=()=>{
			o("after-leave");};return (_,e)=>(openBlock(),createBlock(Teleport,{to:S.value,disabled:!S.value},[createVNode(Transition,{
			"enter-active-class":"transition-opacity duration-200","leave-active-class":"transition-opacity duration-200",
			"enter-from-class":"opacity-0","leave-to-class":"opacity-0",onEnter:onEnter,onAfterLeave:onAfterLeave},{
			default:withCtx(()=>[withDirectives(createElementVNode("div",mergeProps({ref_key:"popupRef",ref:u,class:i,style:F.value
			},_.$attrs),[renderSlot(_.$slots,"default",{},void 0,true)],16),[[vShow,unref(V)]])]),_:3})],8,["to","disabled"]))}
			}),[["__scopeId","data-v-935c5311"]]),GA=["value","min","max"],HA=defineComponent({__name:"index",setup(_){
			const l="left-4! top-4! shadow-xs/90",n="flex items-center gap-2 px-2",i="flex flex-col gap-1 flex-1 px-1",D="size-6",E="text-sm font-semibold",s="progress progress-primary h-1 w-35",V="text-sm font-semibold text-base-content/70",{hud:u}=usePlayerContext(),I=ref(false),O=ref(null),P=computed(()=>(null==u?void 0:u.messages.value[0])||null)
			;function onPopupAfterLeave(){O.value=null;}return watch(P,_=>{_?(O.value=_,I.value=true):I.value=false;}),(_,e)=>(openBlock(),createBlock(YA,{
			class:normalizeClass(l),visible:I.value,x:0,y:0,"allow-prevent-controls-close":false,onAfterLeave:onPopupAfterLeave},{
			default:withCtx(()=>[O.value?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(n)},[O.value.icon?(openBlock(),createBlock(unref(ct$1),{key:0,class:normalizeClass([D,O.value.iconClass]),
			icon:O.value.icon},null,8,["class","icon"])):createCommentVNode("",true),createElementVNode("div",{class:normalizeClass(i)},[O.value.title?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(E)
			},toDisplayString(O.value.title??""),3)):createCommentVNode("",true),O.value&&O.value.progress?(openBlock(),createElementBlock("progress",{key:1,class:normalizeClass(s),
			value:O.value.progress.value,min:O.value.progress.min,max:O.value.progress.max
			},null,10,GA)):createCommentVNode("",true),O.value.value?(openBlock(),createElementBlock("div",{key:2,class:normalizeClass(V)},toDisplayString(O.value.value),3)):createCommentVNode("",true)],2)],2)):createCommentVNode("",true)]),
			_:1},8,["class","visible"]))}}),wA=_export_sfc(defineComponent({__name:"index",setup(_){const e={
			container:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 drop-shadow-xl/30",
			animation:{wrapper:"inline-flex items-center justify-between gap-2.5",
			dot:["w-2.5 h-2.5 bg-white rounded-full","loading-dot-bounce"],dot1:"loading-dot-delay-1",dot2:"loading-dot-delay-2",
			dot3:"loading-dot-delay-3"},speed:"text-sm font-semibold text-base-content"},{playerCore:l}=usePlayerContext()
			;return (_,n)=>{var o,r,i;return openBlock(),createElementBlock("div",{class:normalizeClass(e.container)},[createElementVNode("div",{class:normalizeClass(e.animation.wrapper)},[createElementVNode("span",{
			class:normalizeClass([e.animation.dot,e.animation.dot1])},null,2),createElementVNode("span",{class:normalizeClass([e.animation.dot,e.animation.dot2])
			},null,2),createElementVNode("span",{class:normalizeClass([e.animation.dot,e.animation.dot3])
			},null,2)],2),(null==(o=unref(l))?void 0:o.type)===unref(St).AvPlayer&&((null==(r=unref(l).stats)?void 0:r.bandwidth)??0)>0?(openBlock(),
			createElementBlock("div",{key:0,class:normalizeClass(e.speed)
			},toDisplayString(Math.round(((null==(i=unref(l).stats)?void 0:i.bandwidth)??0)/1024/1024*100)/100)+" Mbps/s ",3)):createCommentVNode("",true)],2)}}
			}),[["__scopeId","data-v-c8313f62"]]),xA=defineComponent({__name:"index",setup(_){const o={
			container:["absolute inset-0 m-auto","flex items-center justify-center","size-20 bg-black/30 rounded-full drop-shadow-xs/60"],
			icon:"size-[61.8%]"
			},{playerCore:i}=usePlayerContext(),D=shallowRef(false),E=shallowRef(false),s=shallowRef(false),V=computed(()=>s.value?"animate-[fadeOut_350ms_linear_forwards]":"")
			;return watch(()=>{var _;return null==(_=i.value)?void 0:_.canplay},_=>{var e
			;_?(null==(e=null==i?void 0:i.value)?void 0:e.paused)&&function showPlayButton(){D.value=true,E.value=false,s.value=false;
			}():function hideButton(){D.value=false,s.value=false;}();}),watch(()=>{var _
			;return null==(_=null==i?void 0:i.value)?void 0:_.paused},_=>{var e
			;(null==(e=null==i?void 0:i.value)?void 0:e.canplay)&&function showAnimationButton(_){D.value=true,E.value=_,s.value=true,
			setTimeout(()=>{D.value=false,s.value=false;},300);}(!!_);}),(_,e)=>D.value?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass([o.container,V.value])
			},[createVNode(unref(ct$1),{icon:E.value?unref(FA):unref(fA),class:normalizeClass(o.icon)},null,8,["icon","class"])],2)):createCommentVNode("",true)}})
			;function useControlsMouseDetection(_){
			const{controls:e}=usePlayerContext(),{isOutside:t}=useMouseInElement(_),A=shallowRef(false),a=watchEffect(()=>t.value?(A.value&&(e.removeDisabledAutoHide(),
			A.value=false),()=>{}):(A.value||(e.addDisabledAutoHide(),A.value=true),()=>{A.value&&(e.removeDisabledAutoHide(),A.value=false);
			}));return onUnmounted(()=>{a(),A.value&&(e.removeDisabledAutoHide(),A.value=false);}),{isOutside:t}}
			const KA=["disabled"],WA=["disabled","onClick"],$A=defineComponent({__name:"AudioTrackButton",setup(_){const e={...F_
			},{playerCore:o}=usePlayerContext(),r=shallowRef(false),i=shallowRef();function toggleVisible(){r.value=!r.value;}return (_,n)=>{var D,E,s
			;return openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{ref_key:"buttonRef",ref:i,class:normalizeClass([e.btn.root]),
			disabled:!(null==(D=unref(o))?void 0:D.canplay)||(null==(E=unref(o))?void 0:E.type)!==unref(St).AvPlayer,"data-tip":"音频轨道",
			onClick:toggleVisible},[createVNode(unref(ct$1),{class:normalizeClass([e.btn.icon]),icon:unref("material-symbols:audio-file")
			},null,8,["class","icon"])],10,KA),(null==(s=unref(o))?void 0:s.type)===unref(St).AvPlayer?(openBlock(),createBlock(YA,{key:0,visible:r.value,
			"onUpdate:visible":n[0]||(n[0]=_=>r.value=_),trigger:i.value,placement:"top"},{default:withCtx(()=>[createElementVNode("ul",{
			class:normalizeClass([e.menu.root])},[(openBlock(true),createElementBlock(Fragment,null,renderList(unref(o).audioStreams,_=>(openBlock(),createElementBlock("li",{key:_.id},[createElementVNode("a",{class:normalizeClass([e.menu.a,{
			[e.menu.active]:unref(o).audioStreamId===_.id}]),disabled:!unref(o).isSupportStream(_),onClick:e=>unref(o).setAudioStream(_.id)
			},[createElementVNode("span",{class:normalizeClass([e.menu.label])},toDisplayString(_.id)+". "+toDisplayString(_.metadata.title??"Untitled"),3),createElementVNode("span",{class:normalizeClass([e.menu.desc])
			},toDisplayString(_.metadata.language),3)],10,WA)]))),128))],2)]),_:1},8,["visible","trigger"])):createCommentVNode("",true)],64)}}}),QA=defineComponent({
			__name:"FullscreenButton",setup(_){
			const{fullscreen:n}=usePlayerContext(),o=computed(()=>n.isFullscreen.value?"material-symbols:fullscreen-exit-rounded":"material-symbols:fullscreen-rounded")
			;return (_,e)=>(openBlock(),createElementBlock("button",{class:normalizeClass(["btn btn-ghost btn-circle tooltip",{"swap-active":!unref(n).isFullscreen.value}]),
			"data-tip":"全屏 (F)",onClick:e[0]||(e[0]=(..._)=>unref(n).toggleFullscreen&&unref(n).toggleFullscreen(..._))},[createVNode(unref(ct$1),{
			class:"size-7",icon:o.value},null,8,["icon"])],2))}}),qA=["disabled"],jA=["onClick"],zA=defineComponent({__name:"PlaybackRateButton",
			setup(_){const r={...F_
			},{playbackRate:i,playerCore:D}=usePlayerContext(),E=computed(()=>[...i.rateOptions.value].reverse()),s=shallowRef(false),V=ref(),u=computed(()=>1===i.current.value?"倍速":`${i.current.value}X`)
			;function toggleSpeedMenu(){s.value=!s.value;}return (_,e)=>{var n;return openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{ref_key:"buttonRef",
			ref:V,class:normalizeClass([r.btnText.root]),disabled:!(null==(n=unref(D))?void 0:n.canplay),"data-tip":"倍速 (ArrowUp/ArrowDown)",
			onClick:toggleSpeedMenu},toDisplayString(u.value),11,qA),createVNode(YA,{visible:s.value,"onUpdate:visible":e[0]||(e[0]=_=>s.value=_),
			trigger:V.value,placement:"top"},{default:withCtx(()=>[createElementVNode("ul",{class:normalizeClass([r.menu.root])},[(openBlock(true),createElementBlock(Fragment,null,renderList(E.value,_=>(openBlock(),
			createElementBlock("li",{key:_,onClick:e=>function handleSpeedChange(_){i.set(_),s.value=false;}(_)},[createElementVNode("a",{class:normalizeClass([r.menu.a,{
			[r.menu.active]:unref(i).current.value===_}])},toDisplayString(_),3)],8,jA))),128))],2)]),_:1},8,["visible","trigger"])],64)}}
			}),JA=["disabled"],ZA=defineComponent({__name:"PlayButton",setup(_){const e={btn:{...F_.btn,root:[F_.btn.root,"before:ml-8"]}
			},{playerCore:n}=usePlayerContext();return (_,o)=>{var r,i;return openBlock(),createElementBlock("button",{
			class:normalizeClass(["swap swap-rotate",[e.btn.root,{"swap-active":null==(r=unref(n))?void 0:r.paused}]]),
			disabled:!(null==(i=unref(n))?void 0:i.canplay),"data-tip":"播放/暂停 (Space)",onClick:o[0]||(o[0]=(..._)=>{var e,t
			;return (null==(e=unref(n))?void 0:e.togglePlay)&&(null==(t=unref(n))?void 0:t.togglePlay(..._))})},[createVNode(unref(ct$1),{icon:unref(FA),
			class:normalizeClass(["swap-off",[e.btn.icon]])},null,8,["icon","class"]),createVNode(unref(ct$1),{icon:unref(fA),class:normalizeClass(["swap-on",[e.btn.icon]])
			},null,8,["icon","class"])],10,JA)}}}),_a=["disabled"],ea=["onClick"],ta=defineComponent({__name:"PlayerCoreButton",setup(_){const e={
			...F_,btn:{...F_.btn,root:[F_.btn.root,"btn-"]}},{source:o,playerCore:r}=usePlayerContext(),i=shallowRef(false),D=shallowRef()
			;function toggleVisible(){i.value=!i.value;}return (_,n)=>{var E,s,V,u,I,O,T;return openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{
			ref_key:"buttonRef",ref:D,class:normalizeClass([e.btn.root]),"data-tip":"播放器核心",
			disabled:"hls"===(null==(V=null==(s=null==(E=unref(o))?void 0:E.current)?void 0:s.value)?void 0:V.type)||(null==(I=null==(u=unref(o))?void 0:u.isSwitching)?void 0:I.value),
			onClick:toggleVisible},[createVNode(unref(ct$1),{class:normalizeClass(["transition-transform",[e.btn.icon,{"rotate-90":i.value,
			"motion-safe:animate-spin":null==(T=null==(O=unref(o))?void 0:O.isSwitching)?void 0:T.value}]]),icon:unref("lucide:atom")
			},null,8,["class","icon"])],10,_a),createVNode(YA,{visible:i.value,"onUpdate:visible":n[0]||(n[0]=_=>i.value=_),trigger:D.value,
			placement:"top"},{default:withCtx(()=>[createElementVNode("ul",{class:normalizeClass([e.menu.root])},[(openBlock(true),createElementBlock(Fragment,null,renderList([unref(St).Native,unref(St).AvPlayer],_=>{
			var l;return openBlock(),createElementBlock("li",{key:_},[createElementVNode("a",{class:normalizeClass([e.menu.a,{[e.menu.active]:(null==(l=unref(r))?void 0:l.type)===_}]),
			onClick:e=>(unref(o).switchPlayerCore(_),i.value=false)},toDisplayString(_),11,ea)])}),128))],2)]),_:1},8,["visible","trigger"])],64)}}
			}),Aa=["data-tip"],aa=["onClick"],la={class:"flex flex-col"},Ca=defineComponent({__name:"PlayModeButton",setup(_){
			const o=usePlayerContext(),r=computed(()=>o.rootProps.currentPlayMode??h_.STOP),i=Object.values(h_),D=shallowRef(),E=shallowRef(false)
			;function toggleMenu(){E.value=!E.value;}const s={...F_};return (_,e)=>(openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{ref_key:"buttonRef",
			ref:D,class:normalizeClass([s.btn.root]),"data-tip":unref(g_)[r.value]||"播放模式",onClick:toggleMenu},[createVNode(unref(ct$1),{
			icon:unref(U_)[r.value]||"material-symbols:pause-rounded",class:normalizeClass(s.btn.icon)},null,8,["icon","class"])],10,Aa),createVNode(YA,{
			visible:E.value,"onUpdate:visible":e[0]||(e[0]=_=>E.value=_),trigger:D.value,placement:"top"},{default:withCtx(()=>[createElementVNode("ul",{
			class:normalizeClass(s.menu.root)},[(openBlock(true),createElementBlock(Fragment,null,renderList(unref(i),_=>(openBlock(),createElementBlock("li",{key:_,onClick:e=>function handleModeChange(_){
			const e=o.rootProps.setPlayMode;e?(e(_),E.value=false):error("设置播放模式回调函数未提供");}(_)},[createElementVNode("a",{
			class:normalizeClass([s.menu.a,r.value===_&&s.menu.active])},[createVNode(unref(ct$1),{icon:unref(U_)[_],class:normalizeClass(s.menu.icon)
			},null,8,["icon","class"]),createElementVNode("div",la,[createElementVNode("span",{class:normalizeClass(s.menu.label)},toDisplayString(unref(g_)[_]),3),createElementVNode("span",{class:normalizeClass(s.menu.desc)
			},toDisplayString(unref(b_)[_]),3)])],2)],8,aa))),128))],2)]),_:1},8,["visible","trigger"])],64))}});const na=["height"],oa={key:0},ra={
			key:1},ia=250,Da=defineComponent({__name:"index",props:{visible:{type:Boolean},position:{},time:{},progressBarWidth:{}},
			emits:["seek"],setup(_,{emit:i}){const s=_,V=i,u={root:["absolute top-0","[will-change:transform]"],image:{
			root:["relative flex items-center justify-center rounded-xl overflow-hidden mb-2","bg-black shadow-xs/30","cursor-pointer transition-all duration-550 ease-out","hover:scale-[1.02]"],
			pressing:"ring-4 ring-base-content/90",
			loading:"absolute loading loading-spinner size-12 m-auto rounded-full text-base-content/80",
			error:"absolute inset-0 flex items-center justify-center"},timeBox:{
			container:"text-sm py-0.5 text-neutral-300 subpixel-antialiased text-center select-none text-shadow-[0_0_1px_rgb(0_0_0_/0.5),0_0_2px_rgb(55_55_55_/0.7)]"
			}},{rootProps:I,source:O,progressBar:T}=usePlayerContext();const P=function ratioHeight(_,e,t){return _*t/e
			}(ia,16,9),R=ref(false),{onThumbnailRequest:L}=I,m=shallowRef(null),F=shallowRef({width:ia,height:P}),y=shallowRef(null),B=reactive({lastHoverTime:-1,
			lastRequestTime:-1,renderTime:-1,renderImage:void 0,error:void 0}),h=shallowRef(-1),g=computed(()=>s.visible&&h.value>-1),U=computed(()=>{var _
			;return null==(_=m.value)?void 0:_.getContext("2d")}),b=computed(()=>B.lastRequestTime>=0&&B.lastRequestTime===B.lastHoverTime)
			;async function updateThumbnail(_,e){y.value&&(clearTimeout(y.value),y.value=null),B.renderImage=void 0,
			e||(y.value=setTimeout(()=>{_===B.lastHoverTime&&updateThumbnail(_,true);},50));try{const t=await(null==L?void 0:L({
			type:"Cache",time:_,isLast:e}));if(t)return B.renderImage=t,B.renderTime=_,e&&(B.lastRequestTime=-1),
			void(B.error=void 0);B.lastRequestTime=_;const A=await(null==L?void 0:L({type:"Must",time:_,isLast:e}));if(!A)return
			;_===B.lastHoverTime&&e&&(B.lastRequestTime=-1,B.renderImage=A,B.renderTime=_,B.error=void 0);}catch(t){B.error=t;}}
			function handleThumbnailMouseUp(_){var e;(null==(e=B.renderImage)?void 0:e.frameTime)&&(_.stopPropagation(),
			V("seek",B.renderImage.frameTime));}return watch(()=>[s.position],async()=>{if(!s.visible)return void(h.value=-1)
			;if(s.progressBarWidth<0)return void(h.value=-1);const _=F.value.width,e=function boundary(_,e,t){return _<e?e:_>t?t:_
			}(-_/2+s.progressBarWidth*(s.position/100),0,s.progressBarWidth-_);h.value=e;}),watch(()=>[s.visible,s.time],async()=>{
			if(!L)return;if(!s.visible||!s.time)return B.lastHoverTime=-1,void(B.renderImage=void 0);const _=s.time
			;B.lastHoverTime=_,await updateThumbnail(_,false);}),watch(()=>[B.renderImage,B.error],()=>{
			B.error||m.value&&U.value&&requestAnimationFrame(()=>{if(!U.value)throw new Error("ctx not found")
			;if(U.value.clearRect(0,0,ia,P),B.renderImage&&B.renderTime===B.lastHoverTime){
			const _=B.renderImage.img.width,e=B.renderImage.img.height,{width:t,height:A}=getImageResize(_,e,ia,P),a=(ia-t)/2,l=(P-A)/2
			;U.value.fillStyle="#000",U.value.fillRect(0,0,ia,P),U.value.drawImage(B.renderImage.img,a,l,t,A);}});}),watch([O.list],()=>{
			B.lastHoverTime=-1,B.lastRequestTime=-1,B.renderTime=-1,B.renderImage=void 0,y.value&&(clearTimeout(y.value),
			y.value=null);}),onUnmounted(()=>{y.value&&(clearTimeout(y.value),y.value=null);}),(_,e)=>{var n,o;return withDirectives((openBlock(),createElementBlock("div",{
			class:normalizeClass(u.root),style:normalizeStyle({transform:`translateX(${h.value}px) translateY(-100%)`})},[createElementVNode("div",{class:normalizeClass([u.image.root,{
			[u.image.pressing]:unref(T).isDragging.value}]),style:normalizeStyle({width:`${F.value.width}px`,height:`${F.value.height}px`}),
			onMouseenter:e[0]||(e[0]=_=>R.value=true),onMouseleave:e[1]||(e[1]=_=>R.value=false),onMouseup:handleThumbnailMouseUp
			},[createElementVNode("canvas",{ref_key:"thumbnailCanvas",ref:m,width:ia,height:unref(P)},null,8,na),createVNode(Transition,{
			"enter-active-class":"transition-opacity duration-150 ease-out delay-60",
			"leave-active-class":"transition-opacity duration-150 ease-out delay-60","enter-from-class":"opacity-0",
			"leave-to-class":"opacity-0"},{default:withCtx(()=>[b.value?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(u.image.loading)},null,2)):createCommentVNode("",true)]),
			_:1}),B.error?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(u.image.error)},[createVNode(At$1,{message:B.error,size:"mini"
			},null,8,["message"])],2)):createCommentVNode("",true)],38),createElementVNode("div",{class:normalizeClass(u.timeBox.container)
			},[R.value&&(null==(n=B.renderImage)?void 0:n.frameTime)?(openBlock(),
			createElementBlock("span",oa," 跳至 "+toDisplayString(unref(formatTime)((null==(o=B.renderImage)?void 0:o.frameTime)||0))+" 预览时间 ",1)):(openBlock(),
			createElementBlock("span",ra,toDisplayString(unref(formatTime)(s.time)),1))],2)],6)),[[vShow,g.value]])}}}),Ea=defineComponent({__name:"ProgressBar",setup(_){const o={
			progressBar:{root:"relative",wrapper:"py-2 cursor-pointer relative",
			track:"h-1 bg-base-content/30 relative transition-[height] duration-100 ease-linear shadow-xl/60"},thumb:{
			current:"absolute h-full bg-primary transition-[width] duration-100 linear",dragging:"transition-none",
			hover:"absolute h-full bg-primary pointer-events-none"},handle:{container:"absolute h-full -translate-x-1/2",
			base:["absolute top-1/2 left-1/2 size-3.5","bg-primary rounded-full drop-shadow-xs/60","-translate-x-1/2 -translate-y-1/2 scale-0","transition-all duration-100 ease-linear pointer-events-none"],
			visible:"scale-100",dragging:"!scale-80 bg-base-content! duration-450 ring-4 ring-primary",
			original:"!bg-white/50 !scale-100"}},{progressBar:r,playerCore:i,controls:E}=usePlayerContext(),s=computed(()=>{var _,e
			;return ((null==(_=i.value)?void 0:_.currentTime)??0)/((null==(e=i.value)?void 0:e.duration)??1)*100}),V=computed(()=>{var _
			;return (null==(_=i.value)?void 0:_.duration)??0
			}),u=shallowRef(null),{width:I}=useElementSize(u),O=r.isDragging,T=shallowRef(false),P=computed(()=>T.value||O.value),c=shallowRef(0),d=shallowRef(0),R=shallowRef(0),L=shallowRef(0),S=shallowRef(false)
			;function calculatePosition(_,e){const t=e.getBoundingClientRect(),A=(_.clientX-t.left)/t.width
			;return Math.min(Math.max(A,0),1)}function handleBarWrapperMouseDown(_){if(!u.value)return;!function startDragging(_){
			E.addDisabledAutoHide(),E.setDisabledHideOnMouseLeave(true),O.value=true,d.value=s.value,c.value=100*_,R.value=_*V.value,
			document.addEventListener("mousemove",handleGlobalMouseMove),document.addEventListener("mouseup",handleGlobalMouseUp);
			}(calculatePosition(_,u.value));}function handleBarWrapperMouseEnter(){T.value=true,S.value||function showPreview(){
			S.value=true;}();}function handleBarWrapperMouseMove(_){if(!u.value)return;!function updatePreview(_){L.value=100*_,
			R.value=_*V.value;}(calculatePosition(_,u.value));}function handleBarWrapperMouseLeave(){T.value=false,hidePreview();}
			function handleGlobalMouseMove(_){if(!u.value)return;!function updateDragging(_){if(!O.value)return;c.value=100*_,
			R.value=_*V.value;}(calculatePosition(_,u.value));}function handleGlobalMouseUp(_){
			if(document.removeEventListener("mousemove",handleGlobalMouseMove),
			document.removeEventListener("mouseup",handleGlobalMouseUp),!u.value)return;!function stopDragging(_){var e;if(O.value){
			const t=_*V.value;null==(e=i.value)||e.seek(t),L.value=100*_,R.value=t;}O.value=false,E.removeDisabledAutoHide(),
			E.setDisabledHideOnMouseLeave(false);}(calculatePosition(_,u.value)),T.value||hidePreview();}function hidePreview(){
			O.value||(S.value=false,L.value=0,R.value=0);}function handleThumbnailSeek(_){var e;null==(e=i.value)||e.seek(_),O.value=false,
			hidePreview(),
			document.removeEventListener("mousemove",handleGlobalMouseMove),document.removeEventListener("mouseup",handleGlobalMouseUp);
			}return onUnmounted(()=>{
			document.removeEventListener("mousemove",handleGlobalMouseMove),document.removeEventListener("mouseup",handleGlobalMouseUp);
			}),(_,e)=>(openBlock(),createElementBlock("div",{class:normalizeClass(o.progressBar.root)},[createElementVNode("div",{ref_key:"progressBarWrapperRef",ref:u,
			class:normalizeClass(o.progressBar.wrapper),onMousedown:handleBarWrapperMouseDown,onMouseenter:handleBarWrapperMouseEnter,
			onMousemove:handleBarWrapperMouseMove,onMouseleave:handleBarWrapperMouseLeave},[createElementVNode("div",{class:normalizeClass([o.progressBar.track])
			},[createElementVNode("div",{class:normalizeClass(o.thumb.current),style:normalizeStyle({width:`${s.value}%`,opacity:unref(O)?0:1})
			},null,6),unref(O)&&!unref(r).isLongPressDragging.value?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass([o.thumb.current,o.thumb.dragging]),
			style:normalizeStyle({width:`${c.value}%`})},null,6)):createCommentVNode("",true),withDirectives(createElementVNode("div",{class:normalizeClass(o.thumb.hover),style:normalizeStyle({width:`${L.value}%`})
			},null,6),[[vShow,S.value&&!unref(O)]]),unref(O)?(openBlock(),createElementBlock("div",{key:1,class:normalizeClass(o.handle.container),style:normalizeStyle({left:`${d.value}%`})
			},[createElementVNode("div",{class:normalizeClass([o.handle.base,o.handle.original])},null,2)],6)):createCommentVNode("",true),createElementVNode("div",{class:normalizeClass(o.handle.container),
			style:normalizeStyle({left:`${unref(O)?c.value:s.value}%`})},[createElementVNode("div",{
			class:normalizeClass([o.handle.base,P.value&&o.handle.visible,unref(O)&&o.handle.dragging])},null,2)],6)],2)],34),createVNode(Da,{
			visible:S.value||unref(O),position:unref(O)?c.value:L.value,time:R.value,"progress-bar-width":unref(I),onSeek:handleThumbnailSeek
			},null,8,["visible","position","time","progress-bar-width"])],2))}}),sa=["onClick"],Va=defineComponent({__name:"QualityButton",
			setup(_){const o={...F_},{source:r}=usePlayerContext(),i=shallowRef(false),D=shallowRef(),E=computed(()=>{if(!r.current.value)return "自动"
			;const _=r.current.value.displayQuality||r.current.value.quality;return "number"==typeof _?`${_}P`:_})
			;function toggleMenu(){i.value=!i.value;}function getDisplayQuality(_){const e=_.displayQuality||_.quality
			;return "number"==typeof e?`${e}P`:e}return (_,e)=>(openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{ref_key:"buttonRef",ref:D,
			class:normalizeClass(o.btnText.root),"data-tip":"画质",onClick:toggleMenu},[createElementVNode("span",null,toDisplayString(E.value),1)],2),createVNode(YA,{visible:i.value,
			"onUpdate:visible":e[0]||(e[0]=_=>i.value=_),trigger:D.value,placement:"top"},{default:withCtx(()=>[createElementVNode("ul",{
			class:normalizeClass(o.menu.root)},[(openBlock(true),createElementBlock(Fragment,null,renderList(unref(r).list.value,_=>{var e;return openBlock(),createElementBlock("li",{key:_.quality},[createElementVNode("a",{
			class:normalizeClass([o.menu.a,{[o.menu.active]:_.quality===(null==(e=unref(r).current.value)?void 0:e.quality)}]),
			onClick:e=>async function handleQualityChange(_){i.value=false,await r.changeQuality(_);}(_)
			},toDisplayString(getDisplayQuality(_)),11,sa)])}),128))],2)]),_:1},8,["visible","trigger"])],64))}}),ua={
			class:"card card-sm bg-neutral-800"},Ia={class:"card-body"},Oa={class:"fieldset"},Ta={class:"flex gap-2"
			},Pa=["onClick"],ca={class:"fieldset"},da=["checked"],Ma=defineComponent({__name:"ThumbnailSettings",setup(_){
			const{thumbnailSettings:e}=usePlayerContext(),l=[30,60,120]
			;return (_,n)=>(openBlock(),createElementBlock("div",ua,[createElementVNode("div",Ia,[n[3]||(n[3]=createElementVNode("h3",{class:"card-title flex justify-between"
			},[createTextVNode(" 预览图 "),createElementVNode("span",{class:"text-xs font-normal text-base-content/50 text-center"
			},"刷新后生效")],-1)),createElementVNode("div",null,[createElementVNode("fieldset",Oa,[n[1]||(n[1]=createElementVNode("legend",{class:"fieldset-legend"
			}," 采样间隔 (S) ",-1)),createElementVNode("div",Ta,[(openBlock(),createElementBlock(Fragment,null,renderList(l,_=>createElementVNode("button",{key:_,class:normalizeClass(["btn btn-sm bg-soft flex-1",{
			"btn-primary":unref(e).samplingInterval.value===_}]),onClick:t=>unref(e).setSamplingInterval(_)
			},toDisplayString(_),11,Pa)),64))])]),createElementVNode("fieldset",ca,[n[2]||(n[2]=createElementVNode("legend",{class:"fieldset-legend"}," 自动缓冲 ",-1)),createElementVNode("input",{
			type:"checkbox",checked:unref(e).autoLoadThumbnails.value,class:"toggle toggle-sm toggle-primary",
			onChange:n[0]||(n[0]=(..._)=>unref(e).toggleAutoLoad&&unref(e).toggleAutoLoad(..._))},null,40,da)])])])]))}}),va={
			class:"card card-sm bg-neutral-800"},Ra={class:"card-body"},La={class:"fieldset"},Na={class:"fieldset-legend w-full"
			},pa={class:"badge badge-sm"},Sa={class:"flex gap-2"},ma=["disabled"],Fa=["disabled"],fa={class:"fieldset"},ya={
			class:"flex gap-2"},Ba={class:"transform rotate-90"},ha=defineComponent({__name:"TransformSettings",setup(_){
			const{transform:e}=usePlayerContext();return (_,n)=>(openBlock(),createElementBlock("div",va,[createElementVNode("div",Ra,[n[9]||(n[9]=createElementVNode("h3",{class:"card-title"
			}," 旋转与翻转 ",-1)),createElementVNode("div",null,[createElementVNode("fieldset",La,[createElementVNode("legend",Na,[n[5]||(n[5]=createTextVNode(" 旋转 ",-1)),createElementVNode("span",pa,toDisplayString(unref(e).rotate.value)+"°",1)]),createElementVNode("div",Sa,[createElementVNode("button",{
			class:"btn btn-sm join-item flex-1",disabled:-270===unref(e).rotate.value,
			onClick:n[0]||(n[0]=(..._)=>unref(e).left&&unref(e).left(..._))},[createVNode(unref(ct$1),{icon:unref("material-symbols:rotate-left-rounded"),
			class:"size-4"},null,8,["icon"])],8,ma),createElementVNode("button",{class:"btn btn-sm join-item flex-1",
			onClick:n[1]||(n[1]=(..._)=>unref(e).normal&&unref(e).normal(..._))},[createVNode(unref(ct$1),{icon:unref("material-symbols:block"),class:"size-4"
			},null,8,["icon"])]),createElementVNode("button",{class:"btn btn-sm join-item flex-1",disabled:270===unref(e).rotate.value,
			onClick:n[2]||(n[2]=(..._)=>unref(e).right&&unref(e).right(..._))},[createVNode(unref(ct$1),{icon:unref("material-symbols:rotate-right-rounded"),
			class:"size-4"},null,8,["icon"])],8,Fa)])]),createElementVNode("fieldset",fa,[n[8]||(n[8]=createElementVNode("legend",{class:"fieldset-legend"
			}," 翻转 ",-1)),createElementVNode("div",ya,[createElementVNode("button",{class:normalizeClass(["btn btn-sm flex-1",{"btn-primary":unref(e).flipX.value}]),
			onClick:n[3]||(n[3]=(..._)=>unref(e).toggleFlipX&&unref(e).toggleFlipX(..._))},[createElementVNode("div",Ba,[createVNode(unref(ct$1),{icon:unref(yA),class:"size-4"
			},null,8,["icon"])]),n[6]||(n[6]=createTextVNode(" 水平 ",-1))],2),createElementVNode("button",{class:normalizeClass(["btn btn-sm flex-1",{
			"btn-primary":unref(e).flipY.value}]),onClick:n[4]||(n[4]=(..._)=>unref(e).toggleFlipY&&unref(e).toggleFlipY(..._))},[createVNode(unref(ct$1),{
			icon:unref(BA),class:"size-4"},null,8,["icon"]),n[7]||(n[7]=createTextVNode(" 垂直 ",-1))],2)])])])])]))}}),ga=defineComponent({__name:"SettingsButton",
			setup(_){const e={...F_,panel:{root:"grid grid-cols-2 gap-3 p-1 w-full max-w-xl"},popup:"select-none"},o=shallowRef(),r=shallowRef(false)
			;function toggleMenu(){r.value=!r.value;}return (_,n)=>(openBlock(),createElementBlock(Fragment,null,[createElementVNode("button",{ref_key:"buttonRef",ref:o,
			class:normalizeClass([e.btn.root]),"data-tip":"设置",onClick:toggleMenu},[createVNode(unref(ct$1),{class:normalizeClass(["transition-transform",[e.btn.icon,{
			"rotate-90":r.value}]]),icon:unref("material-symbols:settings-rounded")},null,8,["class","icon"])],2),createVNode(YA,{visible:r.value,
			"onUpdate:visible":n[0]||(n[0]=_=>r.value=_),trigger:o.value,placement:"top",class:normalizeClass([e.popup])},{
			default:withCtx(()=>[createElementVNode("div",{class:normalizeClass([e.panel.root])},[createVNode(Ma),createVNode(ha)],2)]),_:1},8,["visible","trigger","class"])],64))}
			}),Ua=defineComponent({__name:"TimeDisplay",setup(_){const{playerCore:e}=usePlayerContext(),l={
			root:[F_.text,"flex items-center gap-1.5 select-none"],separator:F_.subtext};return (_,n)=>{var o,r,i,D;return openBlock(),
			createElementBlock("div",{class:normalizeClass([[l.root,{"opacity-0":!(null==(o=unref(e))?void 0:o.canplay),"opacity-100":null==(r=unref(e))?void 0:r.canplay
			}],"transition-opacity duration-200"])
			},[createElementVNode("span",null,toDisplayString(unref(formatTime)(null==(i=unref(e))?void 0:i.currentTime)),1),createElementVNode("span",{class:normalizeClass(l.separator)
			},"/",2),createElementVNode("span",null,toDisplayString(unref(formatTime)(null==(D=unref(e))?void 0:D.duration)),1)],2)}}
			}),ba=["disabled"],Xa=["value","disabled"],ka=defineComponent({__name:"VolumeControl",setup(_){
			const{playerCore:n,hud:o}=usePlayerContext(),r=computed(()=>{var _;return {root:"flex items-center gap-2 mr-2",btn:F_.btn,
			range:["range range-2xs w-24 range-primary"],tooltip:["tooltip tooltip-top",{
			"tooltip-open":null==(_=null==n?void 0:n.value)?void 0:_.isSuspended}],tooltipContent:"tooltip-content py-2 px-4",
			resumeBtn:"cursor-pointer pointer-events-auto"}}),i=computed(()=>{var _,e
			;return getVolumeIcon((null==(_=n.value)?void 0:_.volume)??0,(null==(e=n.value)?void 0:e.muted)??false)})
			;function handleVolumeChange(_){var e;const t=Number(_.target.value);null==(e=n.value)||e.setVolume(t);}return (_,e)=>{
			var D,E,s,V,u,I,O;return openBlock(),createElementBlock("div",{class:normalizeClass([r.value.tooltip])},[(null==(D=unref(n))?void 0:D.isSuspended)?(openBlock(),createElementBlock("div",{
			key:0,class:normalizeClass([r.value.tooltipContent])},[createElementVNode("button",{class:normalizeClass([r.value.resumeBtn]),onClick:e[0]||(e[0]=()=>{var _,e
			;null==(_=unref(n))||_.resumeSuspended(),null==(e=unref(o))||e.showResumeSuspended();})}," 点击恢复音频 ",2)],2)):createCommentVNode("",true),createElementVNode("div",{
			class:normalizeClass([r.value.root])},[createElementVNode("button",{class:normalizeClass(["swap swap-rotate",[r.value.btn.root,{
			"swap-active":null==(E=unref(n))?void 0:E.muted}]]),"data-tip":"静音 (M)",
			disabled:!(null==(s=unref(n))?void 0:s.canplay)||(null==(V=unref(n))?void 0:V.isSuspended),onClick:e[1]||(e[1]=(..._)=>{var e,t
			;return (null==(e=unref(n))?void 0:e.toggleMute)&&(null==(t=unref(n))?void 0:t.toggleMute(..._))})},[createVNode(unref(ct$1),{
			class:normalizeClass(["swap-off",[r.value.btn.icon]]),icon:i.value},null,8,["class","icon"]),createVNode(unref(ct$1),{
			class:normalizeClass(["swap-on",[r.value.btn.icon]]),icon:i.value},null,8,["class","icon"])],10,ba),createElementVNode("input",{type:"range",
			class:normalizeClass([r.value.range]),min:"0",max:"100",value:(null==(u=unref(n))?void 0:u.volume)??0,
			disabled:!(null==(I=unref(n))?void 0:I.canplay)||(null==(O=unref(n))?void 0:O.isSuspended),onInput:handleVolumeChange
			},null,42,Xa)],2)],2)}}}),Ya=defineComponent({__name:"ControlBar",setup(_){const o={controlBar:{main:"relative pointer-events-auto",
			bg:["absolute inset-0 top-[-30px] pointer-events-none","bg-linear-to-t from-black/50 from-10% to-transparent"],
			mainContent:"relative px-5 py-3",bar:"flex justify-between items-center",
			trivialize:"opacity-0 transition-all duration-200 ease-out",left:"flex items-center gap-2",
			right:"flex items-center gap-2"}},{controls:r,playerCore:i,progressBar:D}=usePlayerContext(),E=shallowRef(null)
			;useControlsMouseDetection(E);const s=computed(()=>r.visible.value),V=computed(()=>{var _;return null==(_=i.value)?void 0:_.canplay})
			;return (_,e)=>(openBlock(),createBlock(Transition,{"enter-active-class":"transition-all duration-200 ease-out",
			"leave-active-class":"transition-all duration-200 ease-out","enter-from-class":"opacity-0",
			"enter-to-class":"opacity-100","leave-from-class":"opacity-100","leave-to-class":"opacity-0"},{default:withCtx(()=>{var _
			;return [s.value?(openBlock(),createElementBlock("div",{key:0,ref_key:"controlBarRef",ref:E,class:normalizeClass(o.controlBar.main)},[createElementVNode("div",{
			class:normalizeClass([o.controlBar.bg])},null,2),createElementVNode("div",{ref:unref(r).mainRef,class:normalizeClass([o.controlBar.mainContent])},[createVNode(Ea,{class:normalizeClass({
			"opacity-0 pointer-events-none":!V.value,"opacity-100 pointer-events-auto":V.value})},null,8,["class"]),createElementVNode("div",{
			class:normalizeClass([o.controlBar.bar,{[o.controlBar.trivialize]:null==(_=unref(D))?void 0:_.isLongPressDragging.value}])},[createElementVNode("div",{
			class:normalizeClass(o.controlBar.left)},[createVNode(ZA),createVNode(ka),createVNode(Ua)],2),createElementVNode("div",{class:normalizeClass(o.controlBar.right)
			},[createVNode(Va),createVNode(zA),createVNode($A),createVNode(Ca),createVNode(ta),createVNode(ga),createVNode(QA)],2)],2)],2)],2)):createCommentVNode("",true)]}),_:1}))}}),Ga=defineComponent({__name:"ControlHeader",props:{
			title:{}},setup(_){const l=_,{controls:C,progressBar:o}=usePlayerContext(),r="relative",i={
			root:"relative flex justify-between items-center p-7",left:"flex-1 font-bold"
			},D="absolute inset-0 bottom-[-50px] bg-linear-to-b from-black/30 to-transparent pointer-events-none",E=shallowRef(null)
			;useControlsMouseDetection(E);const s=computed(()=>C.visible.value&&!o.isLongPressDragging.value);return (_,e)=>(openBlock(),createBlock(Transition,{
			"enter-active-class":"transition-all duration-200 ease-out","leave-active-class":"transition-all duration-200 ease-out",
			"enter-from-class":"opacity-0","enter-to-class":"opacity-100","leave-from-class":"opacity-100",
			"leave-to-class":"opacity-0"},{default:withCtx(()=>[s.value?(openBlock(),createElementBlock("div",{key:0,ref_key:"controlHeaderRef",ref:E,class:normalizeClass([r])
			},[createElementVNode("div",{class:normalizeClass([D])},null,2),createElementVNode("div",{class:normalizeClass([i.root])},[renderSlot(_.$slots,"left"),createElementVNode("div",{class:normalizeClass([i.left])
			},toDisplayString(l.title),3)],2)],2)):createCommentVNode("",true)]),_:3}))}}),Ha=defineComponent({__name:"ControlMask",setup(_){
			const e="relative flex-1",{fullscreen:l,playerCore:C,popupManager:o}=usePlayerContext(),r=shallowRef();function handleClick(){
			var _;null==(_=C.value)||_.togglePlay();}function handleDoubleClick(){l.toggleFullscreen();}return onMounted(()=>{
			null==o||o.addDisabledBubblingElement(r.value);}),onUnmounted(()=>{null==o||o.removeDisabledBubblingElement(r.value);}),(_,l)=>(openBlock(),
			createElementBlock("div",{ref_key:"maskRef",ref:r,class:normalizeClass(e),onClick:withModifiers(handleClick,["self"]),onDblclick:withModifiers(handleDoubleClick,["self"])
			},[renderSlot(_.$slots,"default")],34))}}),wa=defineComponent({__name:"ControlsRight",setup(_){
			const l=["absolute inset-y-0 right-0 flex flex-col justify-end items-center gap-2 px-7 pb-2"],{progressBar:C,controls:o}=usePlayerContext(),r=shallowRef(null)
			;useControlsMouseDetection(r);const i=computed(()=>o.visible.value&&!C.isLongPressDragging.value);return (_,e)=>(openBlock(),createBlock(Transition,{
			"enter-active-class":"transition-all duration-200 ease-out","leave-active-class":"transition-all duration-200 ease-out",
			"enter-from-class":"opacity-0","enter-to-class":"opacity-100","leave-from-class":"opacity-100",
			"leave-to-class":"opacity-0"},{default:withCtx(()=>[i.value?(openBlock(),createElementBlock("div",{key:0,ref_key:"controlRightRef",ref:r,class:normalizeClass(l)
			},[renderSlot(_.$slots,"default")],2)):createCommentVNode("",true)]),_:3}))}}),xa=defineComponent({__name:"index",setup(_){
			const e="absolute inset-0 flex flex-col";return (_,l)=>(openBlock(),createElementBlock("div",{class:normalizeClass(e)},[renderSlot(_.$slots,"default")],2))}}),Ka=defineComponent({
			__name:"index",props:{sources:{},videoId:{default:void 0},showPlaylist:{type:Boolean},volume:{},muted:{type:Boolean},
			playbackRate:{},lastTime:{},autoLoadThumbnails:{type:Boolean},autoPlay:{type:Boolean},disabledHDR:{type:Boolean},
			thumbnailsSamplingInterval:{},hlsConfig:{default:()=>({})},avPlayerConfig:{default:()=>({})},onThumbnailRequest:{
			type:Function,default:void 0},onCanplay:{},onTimeupdate:{},onSeeking:{},onSeeked:{},onIdled:{},getCurrentPlaylist:{},
			getCurrentPickCode:{},onChangeVideo:{},onPreviousVideo:{},onNextVideo:{},currentPlayMode:{},setPlayMode:{}},
			emits:["update:showPlaylist","update:volume","update:muted","update:playbackRate","update:autoLoadThumbnails","update:autoPlay","update:disabledHDR","update:thumbnailsSamplingInterval"],
			setup(_,{expose:e,emit:i}){var D,E
			;const s=_,I=i,O="relative bg-black",P="w-100vw h-100vh",c="flex items-center justify-center w-full h-full",M="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",R="absolute inset-0 flex justify-center items-center bg-black/90 z-2",N="btn",S=shallowRef(null),m=shallowRef(null),F=function usePortalProvider(){
			const _={container:ref()};return provide(XA,_),_}();watchEffect(()=>{F.container.value=S.value??void 0;});const y=usePlayerProvide({
			rootRef:S,playerElementRef:m},s,I),{fullscreen:B,source:h,transform:g,playerCore:U,controls:b}=y
			;return watch(()=>b.visible.value,_=>{S.value&&(S.value.style.cursor=_?"auto":"none");},{immediate:true}),e({
			togglePlay:null==(D=U.value)?void 0:D.togglePlay,interruptSource:h.interruptSource,
			seekTo:null==(E=U.value)?void 0:E.seek}),(_,e)=>{var n,o,r;return openBlock(),createElementBlock("div",{ref_key:"rootRef",ref:S,class:normalizeClass([O,{
			[P]:unref(B).isFullscreen}])},[createElementVNode("div",{ref_key:"playerElementRef",ref:m,class:normalizeClass(c),style:normalizeStyle([unref(g).transformStyle.value])
			},null,6),createVNode(xA),(null==(n=unref(U))?void 0:n.loadError)?(openBlock(),createBlock(At$1,{key:0,class:normalizeClass(M),
			message:null==(o=unref(U))?void 0:o.loadError},null,8,["class","message"])):(null==(r=unref(U))?void 0:r.isLoading)?(openBlock(),createBlock(wA,{
			key:1})):createCommentVNode("",true),createVNode(xa,null,{default:withCtx(()=>[createVNode(Ga,null,{left:withCtx(()=>[renderSlot(_.$slots,"headerLeft")]),_:3}),createVNode(Ha,null,{
			default:withCtx(()=>[createVNode(wa,null,{default:withCtx(()=>[renderSlot(_.$slots,"controlsRight")]),_:3})]),_:3}),createVNode(Ya)]),_:3
			}),createVNode(HA),unref(h).isInterrupt.value?(openBlock(),createElementBlock("div",{key:2,class:normalizeClass(R)},[createElementVNode("button",{class:normalizeClass(N),
			onClick:e[0]||(e[0]=(..._)=>unref(h).resumeSource&&unref(h).resumeSource(..._))}," 恢复播放 ",2)],2)):createCommentVNode("",true)],2)}}});var Wa,$a={
			exports:{}};const Qa=getDefaultExportFromCjs(function requireDuration(){
			return Wa?$a.exports:(Wa=1,$a.exports=(C=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,
			r=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,
			i={years:n=31536e6,months:o=2628e6,days:l=864e5,hours:a=36e5,minutes:A=6e4,seconds:t=1e3,milliseconds:1,weeks:6048e5},
			D=function(_){return _ instanceof T},E=function(_,e,t){return new T(_,t,e.$l)},s=function(_){return e.p(_)+"s"},
			V=function(_){return _<0},u=function(_){return V(_)?Math.ceil(_):Math.floor(_)},I=function(_){return Math.abs(_)},
			O=function(_,e){return _?V(_)?{negative:true,format:""+I(_)+e}:{negative:false,format:""+_+e}:{negative:false,format:""}},
			T=function(){function l2(_,e,t){var A=this;if(this.$d={},this.$l=t,void 0===_&&(this.$ms=0,
			this.parseFromMilliseconds()),e)return E(_*i[s(e)],this);if("number"==typeof _)return this.$ms=_,
			this.parseFromMilliseconds(),this;if("object"==typeof _)return Object.keys(_).forEach(function(e){A.$d[s(e)]=_[e];}),
			this.calMilliseconds(),this;if("string"==typeof _){var a=_.match(r);if(a){var l=a.slice(2).map(function(_){
			return null!=_?Number(_):0});return this.$d.years=l[0],this.$d.months=l[1],this.$d.weeks=l[2],this.$d.days=l[3],
			this.$d.hours=l[4],this.$d.minutes=l[5],this.$d.seconds=l[6],this.calMilliseconds(),this}}return this}var V=l2.prototype
			;return V.calMilliseconds=function(){var _=this;this.$ms=Object.keys(this.$d).reduce(function(e,t){
			return e+(_.$d[t]||0)*i[t]},0);},V.parseFromMilliseconds=function(){var _=this.$ms;this.$d.years=u(_/n),_%=n,
			this.$d.months=u(_/o),_%=o,this.$d.days=u(_/l),_%=l,this.$d.hours=u(_/a),_%=a,this.$d.minutes=u(_/A),_%=A,
			this.$d.seconds=u(_/t),_%=t,this.$d.milliseconds=_;},V.toISOString=function(){
			var _=O(this.$d.years,"Y"),e=O(this.$d.months,"M"),t=+this.$d.days||0;this.$d.weeks&&(t+=7*this.$d.weeks)
			;var A=O(t,"D"),a=O(this.$d.hours,"H"),l=O(this.$d.minutes,"M"),C=this.$d.seconds||0
			;this.$d.milliseconds&&(C+=this.$d.milliseconds/1e3,C=Math.round(1e3*C)/1e3)
			;var n=O(C,"S"),o=_.negative||e.negative||A.negative||a.negative||l.negative||n.negative,r=a.format||l.format||n.format?"T":"",i=(o?"-":"")+"P"+_.format+e.format+A.format+r+a.format+l.format+n.format
			;return "P"===i||"-P"===i?"P0D":i},V.toJSON=function(){return this.toISOString()},V.format=function(_){
			var t=_||"YYYY-MM-DDTHH:mm:ss",A={Y:this.$d.years,YY:e.s(this.$d.years,2,"0"),YYYY:e.s(this.$d.years,4,"0"),
			M:this.$d.months,MM:e.s(this.$d.months,2,"0"),D:this.$d.days,DD:e.s(this.$d.days,2,"0"),H:this.$d.hours,
			HH:e.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:e.s(this.$d.minutes,2,"0"),s:this.$d.seconds,
			ss:e.s(this.$d.seconds,2,"0"),SSS:e.s(this.$d.milliseconds,3,"0")};return t.replace(C,function(_,e){
			return e||String(A[_])})},V.as=function(_){return this.$ms/i[s(_)]},V.get=function(_){var e=this.$ms,t=s(_)
			;return "milliseconds"===t?e%=1e3:e="weeks"===t?u(e/i[t]):this.$d[t],e||0},V.add=function(_,e,t){var A
			;return A=e?_*i[s(e)]:D(_)?_.$ms:E(_,this).$ms,E(this.$ms+A*(t?-1:1),this)},V.subtract=function(_,e){
			return this.add(_,e,true)},V.locale=function(_){var e=this.clone();return e.$l=_,e},V.clone=function(){
			return E(this.$ms,this)},V.humanize=function(e){return _().add(this.$ms,"ms").locale(this.$l).fromNow(!e)},
			V.valueOf=function(){return this.asMilliseconds()},V.milliseconds=function(){return this.get("milliseconds")},
			V.asMilliseconds=function(){return this.as("milliseconds")},V.seconds=function(){return this.get("seconds")},
			V.asSeconds=function(){return this.as("seconds")},V.minutes=function(){return this.get("minutes")},
			V.asMinutes=function(){return this.as("minutes")},V.hours=function(){return this.get("hours")},V.asHours=function(){
			return this.as("hours")},V.days=function(){return this.get("days")},V.asDays=function(){return this.as("days")},
			V.weeks=function(){return this.get("weeks")},V.asWeeks=function(){return this.as("weeks")},V.months=function(){
			return this.get("months")},V.asMonths=function(){return this.as("months")},V.years=function(){return this.get("years")},
			V.asYears=function(){return this.as("years")},l2}(),P=function(_,e,t){
			return _.add(e.years()*t,"y").add(e.months()*t,"M").add(e.days()*t,"d").add(e.hours()*t,"h").add(e.minutes()*t,"m").add(e.seconds()*t,"s").add(e.milliseconds()*t,"ms")
			},function(t,A,a){_=a,e=a().$utils(),a.duration=function(_,e){var t=a.locale();return E(_,{$l:t},e)},a.isDuration=D
			;var l=A.prototype.add,C=A.prototype.subtract;A.prototype.add=function(_,e){return D(_)?P(this,_,1):l.bind(this)(_,e)},
			A.prototype.subtract=function(_,e){return D(_)?P(this,_,-1):C.bind(this)(_,e)};}))
			;var _,e,t,A,a,l,C,n,o,r,i,D,E,s,V,u,I,O,T,P;}());function formatFileSize(_){if(!_)return "未知"
			;const e=["B","KB","MB","GB","TB"];let t=_,A=0;for(;t>=1024&&A<e.length-1;)t/=1024,A++;return `${t.toFixed(2)} ${e[A]}`}
			m_.extend(Qa);const qa=["onClick"],ja=defineComponent({__name:"index",props:{fileInfo:{},playlist:{}},setup(_){const l=_,n={
			main:"flex items-center gap-4 w-full mx-2",error:"text-red-400",loading:"flex items-center"},o={
			container:"flex flex-col flex-1",file:"flex flex-wrap items-center gap-2",
			name:"font-bold text-base-content text-xl text-shadow-xs/60 line-clamp-2",
			size:"text-base-content/70 font-semibold text-shadow-xs/60 whitespace-nowrap flex-shrink-0",path:{
			container:["breadcrumbs text-sm text-base-content/80"]}},r=computed(()=>{var _
			;return (null==(_=l.playlist.state)?void 0:_.path)?l.playlist.state.path.filter(_=>0!==Number(_.cid)):[]});return (_,e)=>{
			var l,i,D;return _.fileInfo.error?(openBlock(),createElementBlock("div",{key:0,class:normalizeClass(n.error)
			},[e[0]||(e[0]=createElementVNode("div",null,"❌ 获取文件信息失败",-1)),createElementVNode("div",null,toDisplayString(_.fileInfo.error),1)],2)):_.fileInfo.isLoading||!_.fileInfo.isLoading&&!_.fileInfo.isReady?(openBlock(),
			createElementBlock("div",{key:1,class:normalizeClass(n.loading)},[...e[1]||(e[1]=[createElementVNode("div",{class:"skeleton w-80 h-7 rounded-lg"},null,-1)])],2)):(openBlock(),
			createElementBlock("div",{key:2,class:normalizeClass(n.main)},[createElementVNode("div",{class:normalizeClass(o.container)},[createElementVNode("div",{class:normalizeClass(o.file)},[createElementVNode("span",{class:normalizeClass(o.name)
			},toDisplayString(null==(i=null==(l=_.fileInfo.state)?void 0:l.file_name)?void 0:i.toUpperCase()),3),createElementVNode("span",{class:normalizeClass(o.size)
			},toDisplayString(unref(formatFileSize)(Number(null==(D=_.fileInfo.state)?void 0:D.file_size))),3)],2),createElementVNode("div",{class:normalizeClass(o.path.container)
			},[createElementVNode("ul",null,[(openBlock(true),createElementBlock(Fragment,null,renderList(r.value,_=>(openBlock(),createElementBlock("li",{key:_.cid,onClick:e=>function handleOpenFolder(_){
			window.open(`https://115.com/?cid=${_}&offset=0&mode=wangpan`,"_blank");}(_.cid)
			},[createElementVNode("a",null,toDisplayString(_.name),1)],8,qa))),128))])],2)],2)],2))}}}),za=["src"],Ja=["title"],Za=defineComponent({__name:"item",props:{item:{},
			active:{type:Boolean}},emits:["play"],setup(_,{emit:l}){const o=_,r=l,i={item:{
			base:["flex cursor-pointer break-words hover:bg-base-content/5","rounded-lg","transition-colors duration-200"],
			active:"bg-primary/10 hover:bg-primary/15"},cover:{
			container:["relative flex items-center justify-center flex-shrink-0","overflow-hidden rounded-lg","w-50 h-28 aspect-video","before:content-[''] before:absolute before:inset-0 before:bg-black before:rounded-lg"],
			skeleton:"relative skeleton w-full h-full rounded-lg",imageError:"relative!",
			image:"relative block w-full h-full object-contain"},duration:{
			container:["absolute bottom-1.5 right-1.5 rounded-lg","px-1.5 py-1","backdrop-blur-xs","text-xs bg-base-100/60 text-base-content/80"]
			},progress:{container:"absolute bottom-0 right-0 w-full h-1",
			bar:"absolute top-0 left-0 w-0 h-full bg-primary opacity-80"},info:{
			container:"flex flex-col justify-between gap-1 p-2.5 px-4",
			title:"text-sm font-medium break-all leading-6 text-base-content line-clamp-3",titleActive:"text-primary",
			size:"text-xs text-base-content/60"}},D=shallowRef(),E=computed(()=>({pickCode:o.item.pc,sha1:o.item.sha,coverNum:1,
			duration:o.item.play_long})),s={elementRef:D},{videoCover:V}=useSmartVideoCover(E,s),u=computed(()=>o.item.current_time/o.item.play_long)
			;return (_,e)=>{var l;return openBlock(),createElementBlock("div",{ref_key:"rootRef",ref:D,class:normalizeClass([i.item.base,{[i.item.active]:o.active}]),
			onClick:e[0]||(e[0]=e=>function handlePlay(_){r("play",_);}(_.item))},[createElementVNode("div",{class:normalizeClass(i.cover.container)
			},[unref(V).error?(openBlock(),createBlock(At$1,{key:0,class:normalizeClass(i.cover.imageError),message:unref(V).error,size:"mini"
			},null,8,["class","message"])):unref(V).isLoading?(openBlock(),createElementBlock("div",{key:1,class:normalizeClass(i.cover.skeleton)},null,2)):unref(V).isReady?(openBlock(),
			createElementBlock("img",{key:2,src:null==(l=unref(V).state[0])?void 0:l.img,class:normalizeClass(i.cover.image)},null,10,za)):(openBlock(),createElementBlock("div",{key:3,
			class:normalizeClass(i.cover.skeleton)},null,2)),createElementVNode("div",{class:normalizeClass(i.duration.container)
			},toDisplayString(unref(formatTime)(_.item.play_long)),3),_.item.current_time>0?(openBlock(),createElementBlock("div",{key:4,class:normalizeClass(i.progress.container)
			},[createElementVNode("div",{class:normalizeClass(i.progress.bar),style:normalizeStyle({width:100*u.value+"%"})},null,6)],2)):createCommentVNode("",true)],2),createElementVNode("div",{
			class:normalizeClass(i.info.container)},[createElementVNode("div",{class:normalizeClass([i.info.title,{[i.info.titleActive]:o.active}]),title:_.item.n
			},toDisplayString(_.item.n),11,Ja),createElementVNode("div",{class:normalizeClass(i.info.size)},toDisplayString(unref(formatFileSize)(_.item.s)),3)],2)],2)}}}),_l=defineComponent({__name:"index",
			props:{playlist:{},pickCode:{}},emits:["play","close"],setup(_,{emit:e}){const D=_,E=e,s={playlist:{
			container:["relative flex flex-col text-white box-border h-full","bg-base-100","border-l border-base-300/15","[--app-playlist-space:calc(var(--spacing)*4)]","[--app-playlist-header-height:calc(var(--spacing)*16)]"],
			header:{
			root:["absolute inset-x-0 top-0 z-1","flex items-center justify-between flex-shrink-0","h-(--app-playlist-header-height)","px-(--app-playlist-space) py-4","text-base-content","bg-base-100/60","backdrop-blur-2xl backdrop-saturate-200 backdrop-brightness-50"],
			title:"flex items-center text-xl gap-2.5",count:"text-xs text-base-content/50",close:"btn btn-ghost btn-circle",
			closeIcon:"size-8"},
			content:["flex flex-col gap-5 flex-1","overflow-y-auto","px-(--app-playlist-space) pb-5 pt-[calc(var(--app-playlist-header-height)+var(--spacing)*5)]","[&::-webkit-scrollbar-track]:mt-(--app-playlist-header-height)"],
			divider:"divider w-1/3 mx-auto text-base-content/30"}},V=ref(null),u=useTemplateRef("playlistItemRefs"),I=shallowRef(false);function handlePlay(_){
			_.pc!==D.pickCode&&E("play",_);}
			return watch([()=>D.playlist.state,()=>D.pickCode],()=>async function scrollToActiveItem(_=true){if(I.value)return
			;if(await nextTick(),!u.value)return;I.value=true;const e=u.value.find(_=>_.$props.active);if(!e||!V.value)return
			;const t=e.$el,A=V.value,a=t.offsetTop,l=t.offsetHeight,C=A.clientHeight,n=A.scrollTop;if(a>=n&&a+l<=n+C&&!_)return
			;const o=a-(C-l)/2;A.scrollTo({top:Math.max(0,o),behavior:_?"smooth":"instant"});}(false),{immediate:true}),(_,e)=>{var n,o,r
			;return openBlock(),createElementBlock("div",{class:normalizeClass(s.playlist.container)},[createElementVNode("div",{class:normalizeClass(s.playlist.header.root)},[createElementVNode("div",{
			class:normalizeClass(s.playlist.header.title)},[createVNode(unref(ct$1),{icon:unref(Ct$1),class:"size-8"
			},null,8,["icon"]),e[1]||(e[1]=createTextVNode(" 播放列表 ",-1)),(null==(o=null==(n=_.playlist.state)?void 0:n.data)?void 0:o.length)&&_.playlist.state.data.length>0?(openBlock(),
			createElementBlock("span",{key:0,class:normalizeClass(s.playlist.header.count)},"("+toDisplayString(_.playlist.state.data.length)+")",3)):createCommentVNode("",true)],2),createElementVNode("button",{
			class:normalizeClass(s.playlist.header.close)},[createVNode(unref(ct$1),{icon:unref(St$1),class:normalizeClass(s.playlist.header.closeIcon),
			onClick:e[0]||(e[0]=_=>E("close"))},null,8,["icon","class"])],2)],2),_.playlist.error?(openBlock(),createElementBlock("div",{key:0,
			class:normalizeClass(s.playlist.content)},[createVNode(At$1,{message:_.playlist.error
			},null,8,["message"])],2)):_.playlist.isLoading||!_.playlist.isLoading&&!_.playlist.isReady?(openBlock(),createElementBlock("div",{key:1,
			class:normalizeClass(s.playlist.content)},[...e[2]||(e[2]=[createElementVNode("div",{class:"skeleton h-24 w-full rounded-lg"},null,-1)])],2)):(openBlock(),
			createElementBlock("div",{key:2,ref_key:"playlistRef",ref:V,class:normalizeClass(["custom-scrollbar",[s.playlist.content]])},[(openBlock(true),
			createElementBlock(Fragment,null,renderList((null==(r=_.playlist.state)?void 0:r.data)||[],e=>(openBlock(),createBlock(Za,{ref_for:true,ref_key:"playlistItemRefs",ref:u,
			key:e.pc,item:e,active:e.pc===_.pickCode,onPlay:handlePlay},null,8,["item","active"]))),128)),createElementVNode("div",{
			class:normalizeClass(s.playlist.divider)}," 没有更多了 ",2)],2))],2)}}});var el=(_=>(_.Mark="1",_.Unmark="0",_))(el||{})
			;const tl=320,Al=320,al={buffer:{name:"buffer",priority:2,maxConcurrent:4}},ll={maxConcurrent:4,maxQueueLength:1e3,
			laneConfig:al};function useThumbnails(_){let e;const t=new Scheduler(ll),A=shallowRef(false),a=shallowRef(false),l=shallowRef(30),C=new Map,o=shallowRef({error:void 0
			}),seekThumbnail=async(_,t)=>{const A=await e.seek(t,true);if(A)try{
			const e=getImageResize(A.videoFrame.displayWidth,A.videoFrame.displayHeight,tl,Al),a={img:await createImageBitmap(A.videoFrame,{
			resizeQuality:"pixelated",resizeWidth:e.width,resizeHeight:e.height}),seekTime:_,seekBlurTime:t,frameTime:A.frameTime,
			consumedTime:A.consumedTime};return C.set(t,a),a}finally{A.videoFrame.close();}},clear=()=>{e.destroy(),t.clear(),
			C.forEach(_=>{var e;null==(e=null==_?void 0:_.img)||e.close();}),C.clear(),A.value=false,a.value=false;};return tryOnUnmounted(()=>{clear();
			}),{isInited:A,isAutoBufferExecuted:a,initialize:async(_,t)=>{try{A.value=!1;const a=(_=>{let e=null
			;return _.forEach(_=>{"hls"===_.type&&(!e||_.quality<e.quality)&&(e=_);}),e})(_)
			;if(!a)throw pe$1.CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING;e=new M3U8ClipperNew({url:a.url}),await e.open(),l.value=t??30,A.value=!0;
			}catch(a){o.value.error=a;}},autoBuffer:async()=>{if(o.value.error)throw o.value.error
			;if(false===_.value.autoLoadThumbnails)return;if(a.value)return;a.value=true;const A=shuffle(function intervalArray(_,e,t){
			const A=e-_,a=[];for(let l=0;l<A;l+=t)a.push(l);return a}(0,e.hlsIo.duration,l.value).filter(_=>!C.has(_)))
			;for(const _ of A)t.add(async()=>{const t=blurTime(_,l.value,e.hlsIo.duration);return C.has(t)?null:await seekThumbnail(_,t)
			},{id:_.toString(),lane:al.buffer.name,priority:1,immediate:true,action:"unshift"}).catch(_=>{
			if(_ instanceof SchedulerError.QueueCleared)throw _});},onThumbnailRequest:async({time:_,isLast:t})=>{
			if(o.value.error)throw o.value.error;if(!A||Number.isNaN(_))return;const a=blurTime(_,l.value,e.hlsIo.duration),n=C.get(a)
			;return n||(t?await seekThumbnail(_,a):void 0)},clear:clear}}function useVideoSource(){const _=ref([]);return {list:_,
			fetch:async e=>{const[t,A]=await Promise.allSettled([Ee$1.getFileDownloadUrl(e),Ee$1.getM3u8(e)])
			;if("fulfilled"===t.status){if(t.value.url.auth_cookie)try{await setVideoCookie({name:t.value.url.auth_cookie.name,
			value:t.value.url.auth_cookie.value,path:"/",domain:".115cdn.net",secure:!0,
			expirationDate:Number(t.value.url.auth_cookie.expire),sameSite:"no_restriction"});}catch(a){
			throw a}const e=function getFileExtensionByUrl(_){
			return new URL(_).pathname.split(".").pop()}(t.value.url.url)??UA.unknown;_.value.unshift({name:"Ultra",
			url:t.value.url.url,type:"auto",extension:e,quality:99999,displayQuality:"Ultra"});}
			"fulfilled"===A.status?_.value.push(...A.value.map(_=>({name:`${_.quality}P`,url:_.url,type:"hls",extension:UA.m3u8,
			quality:_.quality,displayQuality:ge$1[_.quality]}))):error("获取m3u8失败:",A.reason);},clear:()=>{_.value=[];}}}const Cl=exports("default", defineComponent({
			__name:"index",setup(_){const s={container:{
			main:["flex flex-col items-center","min-h-screen gap-5","bg-base-100 text-gray-100","[--app-playlist-width:min(400px,30vw)]"],
			pageMain:["relative w-full h-screen overflow-hidden"],pageFlow:"flex flex-col gap-8 px-6 xl:px-36 py-8 w-full"},player:{
			container:"relative w-full h-screen flex items-center justify-center transition-all duration-200 ease-in-out transform-gpu",
			containerFold:"w-[calc(100%-var(--app-playlist-width))]!",video:"absolute m-auto w-full h-full overflow-hidden"},
			playlist:{container:"fixed top-0 right-0 h-screen z-50 w-(--app-playlist-width)! bg-base-200",content:"h-full"},
			controls:{btn:f_.btn}},V=ref(),u=function usePreferences(){return useStorage("x-player-preferences",{volume:100,muted:true,
			playbackRate:1,showPlaylist:false,autoLoadThumbnails:true,disabledHDR:false,thumbnailsSamplingInterval:60,autoPlay:true,
			playMode:h_.STOP},void 0,{listenToStorageChanges:false})}(),I=function useParamsVideoPage(){
			const _=ref(),e=ref(),getParams=()=>{const t=new URLSearchParams(window.location.search);_.value=t.get("pick_code")??void 0,
			e.value=t.get("cid")??void 0;};return getParams(),{pickCode:_,cid:e,getParams:getParams}
			}(),T=useVideoSource(),P=useThumbnails(u),c=function useFileInfo(){const _=useAsyncState(async _=>await Ee$1.webApiGetFilesVideo({
			pickcode:_,share_id:"0",local:"1"}),{},{immediate:false});return reactive(_)}(),M=function usePlaylist(){
			const _=useAsyncState(async _=>await Ee$1.getPlaylist(_),null,{immediate:false}),updateItem=(e,t)=>{
			if(!_.state.value||!_.state.value.data)return;const A=_.state.value.data.findIndex(_=>_.pc===e)
			;-1!==A&&(_.state.value.data[A]={..._.state.value.data[A],...t});};return reactive({..._,updateItemTime:(_,e)=>{updateItem(_,{
			current_time:e});},updateItemMark:(_,e)=>{updateItem(_,{m:e?1:0});}})}(),R=function useHistory(){
			const _=shallowRef(false),e=shallowRef(""),t=shallowRef(0),postHistory=async t=>{_.value&&e.value&&Ee$1.webApiPostWebApiFilesHistory({op:"update",
			pick_code:e.value,share_id:"0",category:"1",definition:"0",time:t});},A=useThrottleFn(async _=>{await postHistory(_);
			},5e3),a=useDebounceFn(async _=>{await postHistory(_);},2e3);return onUnmounted(()=>{_.value=false;}),{isinit:_,lastTime:t,handleTimeupdate:A,
			handleSeek:a,fetch:async A=>{e.value=A;try{const _=await Ee$1.webApiGetWebApiFilesHistory({fetch:"one",pick_code:e.value,
			share_id:"0",category:"1"});Number.isNaN(_.data.time)||(t.value=Number(_.data.time??0));}finally{_.value=true;}},clear:()=>{
			_.value=false,e.value="",t.value=0;}}}(),L=function useMark(_){const e=shallowRef(null);return watch(()=>_.state.is_mark,_=>{
			e.value=void 0!==_?_===el.Mark:null;}),{toggleMark:async()=>{(await Ee$1.webApiPostFilesStar({file_id:_.state.file_id,
			star:e.value?el.Unmark:el.Mark})).state&&(e.value=!e.value);},isMark:e}}(c),N=shallowRef(false),S=computed(()=>{var _,e;return {
			width:Number(null==(_=c.state)?void 0:_.width)??1920,height:Number(null==(e=c.state)?void 0:e.height)??1080}
			}),m=computed(()=>S.value.width/S.value.height),F=computed(()=>m.value<1?"1/1":m.value>1.78?"16/10":`${S.value.width} / ${S.value.height}`)
			;async function handleChangeVideo(_){try{if(N.value=!0,!I.cid.value)throw new Error("cid is required");goToPlayer({
			cid:I.cid.value,pickCode:_.pc}),I.getParams(),T.clear(),P.clear(),R.clear(),await nextTick(),await loadData(!1);}finally{
			N.value=false;}}function handleStartAutoBuffer(){P.autoBuffer();}function handleTimeupdate(_){
			if(!N.value&&R.isinit.value&&!(_<=0)){if(R.handleTimeupdate(_),!I.pickCode.value)throw new Error("pickCode is required")
			;M.updateItemTime(I.pickCode.value,_);}}function handleClosePlaylist(){u.value.showPlaylist=false;}function togglePlaylist(){
			u.value.showPlaylist=!u.value.showPlaylist;}function getCurrentPlaylist(){return M.state}function getCurrentPickCode(){
			return I.pickCode.value||null}async function onChangeVideo(_){const e=M.state
			;if(!(null==e?void 0:e.data))return void 0;const t=e.data.find(e=>e.pc===_)
			;t?await handleChangeVideo(t):error(`找不到播放项: ${_}`);}function setPlayMode(_){u.value.playMode=_;}
			async function loadData(_=true){if(!I.pickCode.value)throw new Error("pickCode is required")
			;if(!I.cid.value)throw new Error("cid is required");try{await R.fetch(I.pickCode.value);}catch(e){}
			T.fetch(I.pickCode.value).then(()=>{P.initialize(T.list.value,u.value.thumbnailsSamplingInterval);}),
			c.execute(0,I.pickCode.value).then(()=>{useTitle(c.state.file_name||"");}),_&&M.execute(0,I.cid.value);}onMounted(async()=>{
			await loadData();});const y=computed(()=>{var _;if(!(null==(_=M.state)?void 0:_.data)||!c.state.pick_code)return  false
			;return M.state.data.findIndex(_=>_.pc===c.state.pick_code)>0}),B=computed(()=>{var _
			;if(!(null==(_=M.state)?void 0:_.data)||!c.state.pick_code)return  false
			;const e=M.state.data.findIndex(_=>_.pc===c.state.pick_code);return e>=0&&e<M.state.data.length-1})
			;async function goToPreviousVideo(){var _;try{
			if(!(null==(_=M.state)?void 0:_.data)||!c.state.pick_code)return void warn("播放列表或当前视频信息不存在")
			;const e=M.state.data.findIndex(_=>_.pc===c.state.pick_code);if(e>0){const _=M.state.data[e-1];await onChangeVideo(_.pc);
			}}catch(e){}}async function goToNextVideo(){var _;try{
			if(!(null==(_=M.state)?void 0:_.data)||!c.state.pick_code)return void warn("播放列表或当前视频信息不存在")
			;const e=M.state.data.findIndex(_=>_.pc===c.state.pick_code);if(e>=0&&e<M.state.data.length-1){const _=M.state.data[e+1]
			;await onChangeVideo(_.pc);}}catch(e){}}return (_,e)=>(openBlock(),createElementBlock("div",{class:normalizeClass(s.container.main)},[createElementVNode("div",{
			class:normalizeClass(s.container.pageMain)},[createElementVNode("div",{class:normalizeClass([s.player.container,unref(u).showPlaylist&&s.player.containerFold])
			},[createVNode(Ka,{ref_key:"xplayerRef",ref:V,"show-playlist":unref(u).showPlaylist,
			"onUpdate:showPlaylist":e[0]||(e[0]=_=>unref(u).showPlaylist=_),volume:unref(u).volume,
			"onUpdate:volume":e[1]||(e[1]=_=>unref(u).volume=_),muted:unref(u).muted,"onUpdate:muted":e[2]||(e[2]=_=>unref(u).muted=_),
			"playback-rate":unref(u).playbackRate,"onUpdate:playbackRate":e[3]||(e[3]=_=>unref(u).playbackRate=_),
			"auto-load-thumbnails":unref(u).autoLoadThumbnails,"onUpdate:autoLoadThumbnails":e[4]||(e[4]=_=>unref(u).autoLoadThumbnails=_),
			"disabled-h-d-r":unref(u).disabledHDR,"onUpdate:disabledHDR":e[5]||(e[5]=_=>unref(u).disabledHDR=_),
			"thumbnails-sampling-interval":unref(u).thumbnailsSamplingInterval,
			"onUpdate:thumbnailsSamplingInterval":e[6]||(e[6]=_=>unref(u).thumbnailsSamplingInterval=_),"auto-play":unref(u).autoPlay,
			"onUpdate:autoPlay":e[7]||(e[7]=_=>unref(u).autoPlay=_),class:normalizeClass([s.player.video]),style:normalizeStyle({aspectRatio:F.value}),
			"video-id":unref(I).pickCode.value,sources:unref(T).list,"last-time":unref(R).lastTime.value,
			"on-thumbnail-request":unref(P).onThumbnailRequest,"on-timeupdate":handleTimeupdate,"on-seeking":unref(R).handleSeek,
			"on-seeked":unref(R).handleSeek,"on-canplay":handleStartAutoBuffer,"get-current-playlist":getCurrentPlaylist,
			"get-current-pick-code":getCurrentPickCode,"on-change-video":onChangeVideo,"current-play-mode":unref(u).playMode,
			"set-play-mode":setPlayMode,"on-previous-video":goToPreviousVideo,"on-next-video":goToNextVideo},{
			headerLeft:withCtx(()=>[createVNode(ja,{"file-info":unref(c),playlist:unref(M)},null,8,["file-info","playlist"])]),controlsRight:withCtx(()=>{var _,e
			;return [createVNode(B_,{"is-mark":unref(L).isMark.value,"on-toggle-mark":unref(L).toggleMark
			},null,8,["is-mark","on-toggle-mark"]),createElementVNode("button",{
			class:normalizeClass([s.controls.btn.root,unref(u).showPlaylist&&"btn-active btn-primary"]),"data-tip":"播放列表(B)",onClick:togglePlaylist
			},[createVNode(unref(ct$1),{icon:unref(Ct$1),class:normalizeClass([s.controls.btn.icon])
			},null,8,["icon","class"])],2),(null==(_=unref(M).state)?void 0:_.data)&&y.value?(openBlock(),createElementBlock("button",{key:0,
			class:normalizeClass([s.controls.btn.root]),"data-tip":"上一集 (←)",onClick:goToPreviousVideo},[createVNode(unref(ct$1),{icon:unref(It$1),
			class:normalizeClass([s.controls.btn.icon])
			},null,8,["icon","class"])],2)):createCommentVNode("",true),(null==(e=unref(M).state)?void 0:e.data)&&B.value?(openBlock(),createElementBlock("button",{key:1,
			class:normalizeClass([s.controls.btn.root]),"data-tip":"下一集 (→)",onClick:goToNextVideo},[createVNode(unref(ct$1),{icon:unref(Tt$1),
			class:normalizeClass([s.controls.btn.icon])},null,8,["icon","class"])],2)):createCommentVNode("",true)]}),_:1
			},8,["show-playlist","volume","muted","playback-rate","auto-load-thumbnails","disabled-h-d-r","thumbnails-sampling-interval","auto-play","class","style","video-id","sources","last-time","on-thumbnail-request","on-seeking","on-seeked","current-play-mode"])],2)],2),unref(de$1)?(openBlock(),
			createElementBlock("div",{key:0,class:normalizeClass(s.container.pageFlow)},null,2)):createCommentVNode("",true),unref(u).showPlaylist?(openBlock(),createElementBlock("div",{key:1,
			class:normalizeClass(s.playlist.container)},[createVNode(_l,{class:normalizeClass(s.playlist.content),"pick-code":unref(I).pickCode.value,playlist:unref(M),
			visible:unref(u).showPlaylist,onPlay:handleChangeVideo,onClose:handleClosePlaylist
			},null,8,["class","pick-code","playlist","visible"])],2)):createCommentVNode("",true)],2))}}));

		})
	};
}));

System.import("./__entry.js", "./");