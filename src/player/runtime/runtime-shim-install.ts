/**
 * 安装点：必须在任何业务模块调用 chrome.runtime 之前执行。
 * 单独成文件以保证 import 顺序（仅副作用）。
 */

import { installRuntimeShim } from './runtime-shim'

installRuntimeShim()
