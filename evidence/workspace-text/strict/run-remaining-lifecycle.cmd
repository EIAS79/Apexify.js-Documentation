@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
set TEXT_UI_LIFECYCLE=1
set FAILED=0
for %%s in (50 100 150 200 250 300) do (
 set TEXT_UI_START=%%s
 set TEXT_UI_COUNT=50
 call node tests\workspace\text-strict-ui-matrix.cjs > evidence\workspace-text\strict\ui-lifecycle-%%s-next.log 2>&1
 if errorlevel 1 (echo LIFECYCLE_SHARD_%%s_EXECUTION_FAIL & set FAILED=1) else (echo LIFECYCLE_SHARD_%%s_COMPLETED)
)
set TEXT_UI_START=350
set TEXT_UI_COUNT=49
call node tests\workspace\text-strict-ui-matrix.cjs > evidence\workspace-text\strict\ui-lifecycle-350-next.log 2>&1
if errorlevel 1 (echo LIFECYCLE_SHARD_350_EXECUTION_FAIL & set FAILED=1) else (echo LIFECYCLE_SHARD_350_COMPLETED)
exit /b %FAILED%