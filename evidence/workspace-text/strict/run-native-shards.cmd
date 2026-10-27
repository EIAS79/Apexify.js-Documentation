@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
set TEXT_CERT_SHARD_TOTAL=8
set TEXT_CERT_EXEC_CODE=0
set FAILED=0
for /L %%i in (1,1,7) do (
  set TEXT_CERT_SHARD_INDEX=%%i
  call node_modules\.bin\tsx.cmd --test tests\workspace\text-strict-native.test.ts > evidence\workspace-text\strict\probe-%%i-of-8.log 2>&1
  if errorlevel 1 (echo SHARD %%i FAIL & set FAILED=1) else (echo SHARD %%i PASS)
)
exit /b %FAILED%