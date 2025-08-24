@echo off
chcp 65001 >nul
echo 🚀 快速提交脚本

set "message=%*"
if "%message%"=="" set "message=快速更新"

echo 📝 提交信息: %message%

REM 检查是否有改动
git diff --quiet
if %ERRORLEVEL% equ 0 (
    git diff --cached --quiet
    if %ERRORLEVEL% equ 0 (
        echo ℹ️ 没有检测到改动
        pause
        exit /b 0
    )
)

echo 🔨 构建项目...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ 构建失败!
    pause
    exit /b 1
)

echo 📦 提交更改...
git add .
git commit -m "update: %message%"

echo ✅ 提交完成!
echo 💡 如需发布新版本，请使用:
echo    - scripts\release.bat patch   (修复)
echo    - scripts\release.bat minor   (新功能)  
echo    - scripts\release.bat major   (重大更新)

pause
