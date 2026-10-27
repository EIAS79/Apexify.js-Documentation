@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
set TEXT_CERT_SHARD_TOTAL=8
set TEXT_CERT_EXEC_CODE=0
set TEXT_CERT_EVIDENCE_SUFFIX=-validation
set FAILED=0
for /L %%i in (0,1,7) do (
 set TEXT_CERT_SHARD_INDEX=%%i
 call node_modules\.bin\tsx.cmd --test tests\workspace\text-strict-native.test.ts > evidence\workspace-text\strict\validation-%%i-of-8.log 2>&1
 if errorlevel 1 (echo VALIDATION SHARD %%i FAIL & set FAILED=1) else (echo VALIDATION SHARD %%i PASS)
)
exit /b %FAILED%