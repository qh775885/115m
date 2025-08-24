@echo off
echo 回退到稳定版本 v1.6.1-mod.0.2.1-stable
echo.

echo 1. 创建稳定版本标签...
git tag v1.6.1-mod.0.2.1-stable 25b1dfa

echo 2. 创建回退分支...
git checkout -b rollback-to-stable 25b1dfa

echo 3. 完成回退！
echo 当前处于稳定版本分支: rollback-to-stable
echo.

echo 如需返回开发分支:
echo git checkout main
echo.
pause
