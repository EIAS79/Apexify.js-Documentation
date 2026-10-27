@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
set "NODE_OPTIONS=--max-old-space-size=2048"
call npm run build > evidence\workspace-text\strict\production-build-2048.log 2>&1
if errorlevel 1 (echo CONTROLLED_PRODUCTION_BUILD_FAIL & exit /b 1)
echo CONTROLLED_PRODUCTION_BUILD_PASS