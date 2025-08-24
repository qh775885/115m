@echo off
chcp 65001 >nul
echo 🚀 115Master 自动发布脚本

set "type=%1"
if "%type%"=="" set "type=patch"

echo 📋 发布类型: %type%

REM 读取当前版本
for /f "tokens=2 delims=," %%i in ('findstr "version" package.json') do (
    set "version_line=%%i"
)
for /f "tokens=2 delims=:" %%i in ("%version_line%") do (
    set "current_version=%%i"
)
set "current_version=%current_version: =%"
set "current_version=%current_version:"=%"

echo 📦 当前版本: %current_version%

REM 计算新版本号
for /f "tokens=1,2,3,4 delims=.-" %%a in ("%current_version%") do (
    set "base=%%a.%%b.%%c"
    set "mod_major=%%d"
)
for /f "tokens=2,3,4 delims=." %%a in ("%mod_major%") do (
    set "mod_major=%%a"
    set "mod_minor=%%b" 
    set "mod_patch=%%c"
)

if "%type%"=="major" (
    set /a "mod_major+=1"
    set "mod_minor=0"
    set "mod_patch=0"
) else if "%type%"=="minor" (
    set /a "mod_minor+=1"
    set "mod_patch=0"
) else (
    set /a "mod_patch+=1"
)

set "new_version=%base%-mod.%mod_major%.%mod_minor%.%mod_patch%"
echo ✨ 新版本: %new_version%

REM 更新版本号
powershell -Command "(Get-Content package.json) -replace '\"version\": \".*\"', '\"version\": \"%new_version%\"' | Set-Content package.json"

echo 🔨 开始构建...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ 构建失败!
    exit /b 1
)

echo 📝 提交更改...
git add .
git commit -m "%type%: 自动发布 %new_version%"

echo 🏷️ 创建标签...
git tag "v%new_version%"

echo 🎉 发布完成! 版本: %new_version%
echo 📁 用户脚本: dist/115master.user.js
echo 🏷️ Git标签: v%new_version%

pause
