// 抑制 Lit 在 Chrome 扩展中的开发模式非错误黄色警告，保持扩展管理面板错误日志绝对纯净
;(globalThis as any).litIssuedWarnings = {
  has: () => true,
  add: () => {},
}
