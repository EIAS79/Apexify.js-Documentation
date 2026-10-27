@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
for %%i in (25 44 63 185) do (
 set TEXT_UI_START=%%i
 set TEXT_UI_COUNT=1
 call node tests\workspace\text-strict-ui-matrix.cjs > evidence\workspace-text\strict\ui-retry-%%i.log 2>&1
 if errorlevel 1 (echo UI_RETRY_%%i_FAIL) else (echo UI_RETRY_%%i_DONE)
)