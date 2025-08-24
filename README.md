# 115Master 修改版

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v5.3.3%2B-blue?logo=tampermonkey&logoColor=white)](https://www.tampermonkey.net/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![原作者](https://img.shields.io/badge/原作者-cbingb666-green)](https://github.com/cbingb666/115master)
[![修改版本](https://img.shields.io/badge/修改版本-1.6.1--mod.0.0.1-orange)](https://github.com/qh775885/115master)

> **基于 [cbingb666/115master](https://github.com/cbingb666/115master) v1.6.1 修改**
> 修改者：qh775885

115Master 修改版是基于原作者 cbingb666 的 115Master 项目开发的增强版本，新增了画质选择记忆功能，旨在提升 `115网盘` 的浏览体验。

## 功能

### 播放器

- 🎨 `Ultra` 画质
- 👁 视频缩略图
- 🤖 在线外挂字幕
- 🎉 支持一键唤起 [IINA](https://iina.io/) 播放
- 🖼 画中画
- ⌚ 播放列表展示
- ⌨️ 快捷键
- 🎨 视频调色
- 🆕 **画质选择记忆功能** - 自动记忆每个视频的画质偏好

### 文件列表

- 显示视频封面
- 文件列表点击鼠标中键打开文件夹新标签页
- Tab 标题上显示当前目录路径
- 支持文件下载（仅支持单文件）
- 云下载离线任务，免刷新重定向
- 滚动位置记忆
- 返回目录按钮

### Magnet

支持任何网站的 Magnet 链接一键唤起离线任务。

[如何使用 Magnet 链接一键打开离线任务？](https://github.com/cbingb666/115master/discussions/238)

## 使用安装

1. 选择浏览器 `Chrome 130+` 或 `115Browser 35+`。

2. 安装 [Tampermonkey v5.3.3+](https://www.tampermonkey.net/)。

3. 开启 [浏览器扩展开发者模式](https://www.tampermonkey.net/faq.php#Q209)。

4. 点击 [115master.user.js](https://github.com/cbingb666/115master/releases/latest/download/115master.user.js) 安装 【115Master】脚本。

5. 在油猴面板勾选启动 【115Master】脚本并刷新 115 主页开始使用。

6. 安装完成后如果没有看到文件列表中有【master播放】的按钮，请检查有没有其他脚本导致冲突或重启浏览器。

<img width="329" alt="image" src="https://github.com/user-attachments/assets/189ac578-0592-43bd-ab75-b62cbe6f5170" />

👆上面一通操作后，还是无法使用的话请进入 [TG群](https://t.me/+EzfL2xXhlOA4ZjBh) 反馈或提交 [Issues](https://github.com/cbingb666/115master/issues)，请说明你的详情操作！

## 开发

环境基准

- Node.js v20+
- pnpm v9+

安装依赖

```sh
pnpm install
```

运行开发环境

```bash
pnpm dev
```

构建

```bash
pnpm build
```

## 📜 版权声明

> **重要声明**: 本项目是基于 [cbingb666/115master](https://github.com/cbingb666/115master) v1.6.1 的修改版本。
>
> - **原作者**: cbingb666
> - **修改者**: qh775885
> - **修改内容**: 画质选择记忆功能
> - **详细声明**: [📜 查看完整版权声明](./ATTRIBUTION.md)

## 常见问题

**修改版问题**: [提交 Issue](https://github.com/qh775885/115master/issues)

**原作品问题**: [Q&A](https://github.com/cbingb666/115master/discussions/categories/q-a)

## 赞助

**原作者**: [为爱发电~ 为 Master 添把柴火🔥](https://afdian.com/a/115Master)

**修改版**: 如果您觉得画质记忆功能有用，请给项目点个 Star ⭐

## 免责声明

本软件仅供技术研究、学习和交流目的使用。使用者应遵守以下条款：

本软件仅作为编程技术探讨与计算机安全研究的示例工具，不得用于任何商业用途或非法活动。

使用者需在合法、合规的环境下使用本软件，并需获得相关系统或软件所有者的明确授权。

开发者不对使用者因使用本软件造成的任何直接或间接损失负责，包括但不限于数据丢失、系统损坏或法律责任。

使用本软件即表示您已完全理解并同意本免责声明的全部内容，并承担因使用本软件产生的一切后果和法律责任。

如本软件功能可能违反任何法律法规或第三方权益，请立即停止使用并删除。

请尊重知识产权，遵守相关法律法规，合法、合理地开展技术研究活动。

## 鸣谢

- [@zhaohappy](https://github.com/zhaohappy) 提供了 [AvPlayer](https://zhaohappy.github.io/libmedia/docs/guide/player)
