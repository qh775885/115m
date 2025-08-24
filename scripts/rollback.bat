@echo off
chcp 65001 >nul
echo 🔄 版本回滚脚本

set "version=%1"
if "%version%"=="" (
    echo 📋 可用版本:
    git tag -l "v*" --sort=-version:refname
    echo.
    echo 用法: scripts\rollback.bat [版本号]
    echo 示例: scripts\rollback.bat 1.6.1-mod.0.2.0
    pause
    exit /b 0
)

echo ⏪ 回滚到版本: %version%

REM 检查版本是否存在
git tag -l "v%version%" | findstr "v%version%" >nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 版本 v%version% 不存在!
    pause
    exit /b 1
)

echo ⚠️ 警告: 这将丢失当前未提交的更改!
set /p "confirm=确定要回滚吗? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ 已取消回滚
    pause
    exit /b 0
)

git checkout "v%version%"
echo ✅ 已回滚到版本 %version%

pause
