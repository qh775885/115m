# 115Master 野生版

本项目是基于 [cbingb666/115master](https://github.com/cbingb666/115master) 的 `115Master` 项目进行修改的版本

本项目修改了以下功能：

- 增加 上一集，下一集按钮。

- 增加 播放模式选择 播完暂停，循环播放，自动下一集

- 支持 画质 旋转 选择后记忆

- 移除 -调色 -收藏 -自动播放面板 -预览图开关 -云下载按钮恢复原生

- 修改播放列表完全到右侧

<img width="439" height="241" alt="image" src="https://github.com/user-attachments/assets/d04fe3d9-341a-4ae1-a53b-64d87c01e913" />

## 构建说明

本项目支持开发版和正式版两种构建模式，并自动管理构建缓存。

### 缓存管理

- **缓存位置**：构建缓存会自动移动到 `dist/.rollup.cache` 和 `dist/.vite`
- **自动清理**：构建完成后自动清理所有缓存文件
- **无需手动管理**：无需手动清理 `.rollup.cache` 文件夹

### 开发版构建 (`pnpm dev:build`)

用于日常开发和测试，特点：

- 代码不压缩，保留调试信息
- 版本号固定为 `dev`（避免重复安装）
- 生成两个文件：
  - `dist/script.user.js` - 主体代码（未压缩）
  - `dist/115master-野生版-dev.user.js` - 脚本头文件

**使用方式：**

1. 运行 `pnpm dev:build` 构建开发版
2. 安装 `dist/115master-野生版-dev.user.js` 到油猴
3. 修改代码后重新运行 `pnpm dev:build` 即可热更新

### 正式版构建 (`pnpm build`)

用于正式发布，特点：

- 代码压缩优化（使用 Terser）
- 版本号从 `package.json` 读取
- 移除 console 和 debugger
- 生成完整脚本：`dist/115master-v版本号.user.js`

**使用方式：**

1. 运行 `pnpm build` 构建正式版
2. 生成的脚本可直接发布到油猴脚本平台

## 致谢

- 感谢 [cbingb666](https://github.com/cbingb666) 创建了优秀的 `115Master` 原始项目。
