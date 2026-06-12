# 项目进度记忆

## 用途

- 只记录会影响后续继续工作的进度、验证结果和中断点
- 不记录流水账、工具迁移、已废弃协作方式等低价值信息

## 当前稳定状态

- 播放器页 `/assets/*` 404 的关键边界：`src/content/video-page.ts` 保持顶层静态 import 播放器模块，不能运行时动态 import 播放器入口
- 进度条预览图、播放列表封面已恢复；相关缩略图方法保持顶层静态导入，不能恢复运行时动态 import
- 缩略图缓存读取过滤 `blob:` 等非稳定图片地址，UI 使用稳定 `data:` 图片地址
- 播放进度记忆以 115 原生 history 接口为准；本地 playHistory 默认关闭但代码保留
- 播放列表为右侧外置面板，不遮挡视频；移动/删除后保持当前播放链稳定
- 移动弹窗默认进入最近一次移动目录；确认按钮固定为“移动到此”；移动成功后当前视频继续播放但从播放列表移除
- 播放列表切视频已做冷却与合并，频繁点击只保留最后一次目标；播放列表封面加载为低并发懒加载
- 播放源关键请求已加 timeout 兜底；background 高权限消息已加 sender 校验和 URL 白名单
- 无损播放策略：默认只对浏览器较稳格式启用原生无损；MKV 默认不主动无损，但用户手动选择无损会记住；若检测到 MKV 无损无声，会提示并切回 115 原画，同时把该视频偏好改为 115 原画
- 文件夹封面收藏角标已优化：已收藏常显，未收藏默认隐藏，鼠标悬浮/键盘聚焦时显示；角标样式已改为贴合封面右上角的嵌入式折角
- 字幕链路已恢复：`SubtitleManager.loadList()` 不再因 load token 误增导致接口字幕结果被整批丢弃；常见 `srt / ass / vtt / MicroDVD sub` 解析已补齐测试覆盖
- 字幕控件已收敛为短标签显示，并去掉 `[内置字幕] / [外挂字幕]` 前缀，避免控制栏遮挡
- 图片墙/文件夹墙拖选已恢复：自定义墙支持从墙空白、标题、列表区域起拖，命中卡片后同步到 115 原生选择状态；拖选启动/结束只响应真实用户鼠标事件，避免合成选择事件打断拖选

## 最近验证

- 近期播放器、播放列表、预览图、播放记忆、移动弹窗、收藏角标相关改动均通过 `pnpm test` 与 `pnpm build`
- 构建存在既有 chunk 体积警告，当前不处理，避免重新引入扩展路径和动态 import 风险
- 2026-05-26：无损播放排查结论已确认：当前问题主因不是网络或纯下载速度，而是浏览器原生无损直链在远距离 seek 后缓冲浅、恢复脆弱；已新增 native 卡死自动降级到 `115原画`，并细化为“远跳后恢复失败”更积极降级，普通顺播与小跳不轻易误判；已通过 `pnpm test`、`pnpm build`，项目无 `pnpm lint` 脚本，构建仍仅有既有 chunk 体积警告
- 2026-05-15：字幕修复后 `pnpm test`、`pnpm build` 通过；构建仍仅有既有 chunk 体积警告
- 2026-05-15：字幕控件文案与宽度调整后，`pnpm test`、`pnpm build` 继续通过
- 2026-05-23：图片墙/文件夹墙拖选修复后，`pnpm test`、`pnpm build` 通过；构建仍仅有既有 chunk 体积警告；已提交 `e7c7b10`
- 2026-05-23：扩展更新后旧页面 `Extension context invalidated` 不再触发或残留列表视频转码提示，只显示刷新提示；`pnpm test`、`pnpm build` 通过，构建仍仅有既有 chunk 体积警告
- 2026-05-26：自动 VIP 加速转码新增“后台加速”最后兜底：仅在自动失败后用户手动加速也失败/异常时显示按钮；点击后用全局单例队列打开一个非激活 115 原生播放页短暂触发，随后关闭并刷新转码状态。当前缺少可复现样本，待用户后续反馈实测结果；已通过 `pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-05-29：修复 `pnpm typecheck` 失败：后台加速按钮函数恢复到转码按钮闭包内，runtime context invalidated 返回值调用方已做类型收窄，`OPEN_TAB` 已补 sender 校验；已通过 `pnpm typecheck`、`pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-05-29：收窄 `web_accessible_resources`，移除全量 `*` 暴露，仅保留播放器入口、`.vite/manifest.json`、`assets/*.js/css` 等必要资源；`dist/manifest.json` 已确认包含 video-page、player、hls 等构建产物；已通过 `pnpm build`、`pnpm test`，构建仍仅有既有 chunk 体积警告
- 2026-05-29：清理生产环境直出调试日志，保留错误/警告与本地开关控制的播放器 debug；已通过 `pnpm typecheck`、`pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-05-29：播放列表快速切视频稳定性补强：切换前统一清理旧视频无损探测/卡死检测/音轨同步计时器，切换后播放进度恢复改为等待 metadata/canplay 并保留 1.2s 兜底；已通过 `pnpm typecheck`、`pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-06-05：MCP 复现无损黑屏有声：Chrome 原生 video `currentTime` 正常推进、音频字节已解码，但 `videoWidth/videoHeight` 与视频帧数均为 0；已新增 native 视频帧探测，命中后自动降级并记住 `115原画`；黑屏探测日志改为 debug 开关控制，避免生产环境 console warn 弹浏览器告警。已通过 `pnpm typecheck`、`pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-06-12：修复预览图失败误触发自动加速：`preview.ts` 中封面生成为空或异常时不再自动触发 VIP 加速转码，改为显示"预览图不可用"和手动加速按钮；仅 `duration === 0` 保留自动触发。已通过 `pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告
- 2026-06-12：新增 `M3u8UnavailableError` 精确区分转码需求：`videoThumbnail.ts` 中 M3U8 获取失败时抛出专用错误类型，`preview.ts` 按错误类型分流——M3U8 不可用自动触发加速，其他封面失败只显示手动按钮。已通过 `pnpm test`、`pnpm build`，构建仍仅有既有 chunk 体积警告

## 待测事项

- 后台加速兜底待测：后续遇到自动/手动都返回 `manual_required` 的视频时，点击“后台加速”观察是否只短暂出现一个非激活标签页、是否自动关闭、是否进入 VIP 加速队列或完成状态

## 后续优化候选

- 字幕功能优先级靠后，后续再考虑，不作为当前阶段优先事项

## 发布记录

- 2026-05-15：准备发布 `v1.6.5`
  - 变更：修复播放器字幕列表加载与字幕显示；新增常见字幕格式兼容；优化控制栏字幕标签显示
  - 待执行：`pnpm zip`、`pnpm release:check`、GitHub Release
- 2026-05-08：已发布 `v1.5.0`
  - GitHub Release：https://github.com/qh775885/115m/releases/tag/v1.5.0
  - 发布包：`release/115m-v1.5.0.zip`
  - 验证：`pnpm test`、`pnpm build`、`pnpm zip`、`pnpm release:check` 均通过
- 2026-05-08：已发布 `v1.4.0`
  - GitHub Release：https://github.com/qh775885/115m/releases/tag/v1.4.0
  - 发布包：`release/115m-v1.4.0.zip`
  - 验证：`pnpm build`、`pnpm test`、`pnpm zip`、`pnpm release:check` 均通过
