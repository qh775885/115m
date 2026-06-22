# 115 Open API

## 授权方式

推荐"手机扫码授权 PKCE 模式"——无后端、不需要 AppSecret，适合开源 Chrome 扩展。

### 1. 获取设备码

POST `https://passportapi.115.com/open/authDeviceCode`

Body (form-urlencoded): `client_id`, `code_challenge`(url_safe base64 sha256), `code_challenge_method=sha256`

返回: `data.uid`(设备码), `data.time`, `data.qrcode`(二维码内容), `data.sign`

### 2. 轮询状态

GET `https://qrcodeapi.115.com/get/status/?uid=&time=&sign=`

- `state=0`: 二维码无效
- `state=1`: 继续轮询
- `data.status=1`: 已扫码，等待确认
- `data.status=2`: 已确认，结束轮询

### 3. 换 Token

POST `https://passportapi.115.com/open/deviceCodeToToken`

Body: `uid`, `code_verifier`

返回: `data.access_token`, `data.refresh_token`(有效期 1 年), `data.expires_in`

### 刷新 Token

POST `https://passportapi.115.com/open/refreshToken`

Body: `refresh_token`

返回: 新 `access_token`、`refresh_token`、`expires_in`。不要频繁刷新，会触发频控。

## 视频转码

POST `域名/open/video/video_push`

Header: `Authorization: Bearer access_token`

Body (form-data): `pick_code`, `op`(`vip_push` VIP加速 / `pay_push` 枫叶加速)

返回: `state`(true/false), `message`, `code`(0=成功)

## 注意

- 授权码模式需要 AppSecret，不适合纯开源扩展
- Token 只存本地，不写入 Git
- 自动转码优先走官方 `/open/video/video_push`
