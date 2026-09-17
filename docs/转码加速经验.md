# 转码（VIP 加速）经验文档

> ⚠️ 修改任何转码相关代码（`transcode-api.ts` / `transcode.ts` / `main-world.ts` 的 115vod fetch 链路 / `transcode-button.ts` / `transcode-store.ts`）前必须通读本文件。
> 该功能历史上多次因「架构优化」被改坏，核心原因都是忽略了**执行环境**约束。

---

## 一、功能本质

**转码是 115 官方自带功能，扩展只是替用户一键触发。** 用户打开 `https://115vod.com/?pickcode=xxx&share_id=0`，页面自带「视频转码 → 立即转码 → 正在加速」官方弹窗。扩展用同样接口在后台完成相同动作。

完整接口清单（全部已验证，在**有效 115vod 会话**下均正常）：

| 用途 | 接口 | 参数 |
| --- | --- | --- |
| 视频信息（拿 sha1） | `GET https://115vod.com/webapi/files/video?pickcode=..&share_id=0&local=1` | query |
| 转码支持检查 | `POST https://115vod.com/webapi/files/is_transcoded` | body: `pick_code=..` |
| 任务查询 | `POST https://115vod.com/transcode/api/1.0/web/1.0/trans_code/check_transcode_job?sha1=..&priority=100` | body: `{"fid":"<sha1>"}` |
| VIP 推送 | `POST https://115vod.com/site/?ct=play&ac=push` | body: `op=vip_push&pickcode=..&sha1=..` |
| 批量推送 | `POST https://115vod.com/site/?ctl=play&ac=batch_push` | body: `file_ids=<逗号分隔>` |

状态语义：`check_transcode_job` 返回 `status=3` 排队中（含 count/time）、`status=1` 已入队、`status=127` 无任务、`result` 字段另计。`is_transcoded` 返回 `state=1` 且 `data` 为同文件夹待转码 `file_ids`。

## 二、执行环境铁律（每次被改坏都出在这里）

**115vod.com 接口必须在「有效 115vod 会话」下同源调用，且该会话只有打开带 `pickcode` 的播放页才会建立。**

1. **裸首页 `https://115vod.com/`（或 `/index.html`）不建立会话**。无会话时 115vod 页面会 `window.close()`（后台 tab 自动消失），API 一律 302 重定向到 `http://115.com/?ct=play&ac=push`（跨源 + http 降级），浏览器 fetch 跟随该重定向被拦截 → `TypeError: Failed to fetch`。
2. 因此 `ensure115VodTabId()` **必须传 pickCode**（拼 `?pickcode=..&share_id=0`），绝不能创建裸首页 tab。
3. `fetch` 路径优先级：`direct`（background 直连，依赖浏览器 115vod cookie）→ `main_world`（115.com 页面注入）→ **`page`（115vod 播放页内同源 fetch，最可靠，能顺带建立会话）**。`auto` 模式 direct/main_world 失败后**必须兜底 `page`**，不能直接报「page mode disabled」。
4. 从 115.com 页面跨源 fetch 115vod 不可行：115vod 返回的 `Access-Control-Allow-Origin: https://115.com, https://...` 是多值畸形头，浏览器直接拒绝。115 前端自己靠 JSONP/iframe，不受影响。

## 三、本次修复要点（2026-08 实测定位）

- 根因：`get115VodTabId` 调 `ensure115VodTabId()` 不带 pickCode → 创建裸首页 → 无会话 → 同源 fetch 302 → Failed to fetch。
- 修复 1：`get115VodTabId(sender, pickCode)` 透传 pickCode 给 `ensure115VodTabId(pickCode)`（`main-world.ts`）。
- 修复 2：`fetchTextIn115VodMainWorldQueued` 在 direct/main_world 失败后统一兜底 `fetch115VodPageMode`（在 115vod 播放页内同源 fetch），auto 与 page 模式共用。
- 修复 3（content 侧）：`transcode-store.ts` 中 `chrome.storage.session` 在受限 context（115 页面的 `about:blank` iframe，因 `allFrames`+`matchAboutBlank` 注入）被拒时报 `Access to storage is not allowed from this context`，需降级 `sessionStorage`（get/set 对称 + onChanged 注册保护）。

## 四、修改检查清单

- [ ] `ensure115VodTabId` 调用是否传了 pickCode？裸首页 tab = 会话失效。
- [ ] 新增/改动 115vod fetch 是否保留 `page` 兜底？auto 失败不能直接放弃。
- [ ] 错误信息是否对用户可操作（不能把 `TypeError: Failed to fetch` 裸抛上屏）？
- [ ] 115.com 顶层 vs iframe 上下文：content script 有 `allFrames`/`matchAboutBlank` 时，storage 类 API 必须有降级。
- [ ] 验证方式：手动打开 `https://115vod.com/?pickcode=<任意视频>&share_id=0`（会话建立）→ 在页面控制台同源 fetch 各接口 → 200 即环境 OK；再对比裸首页行为。
