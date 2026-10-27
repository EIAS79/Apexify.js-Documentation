@echo off
cd /d D:\ApexifyWorkspaceParallel\text-strict-20261023
set TEXT_CERT_SHARD_INDEX=2
set TEXT_CERT_SHARD_TOTAL=8
set TEXT_CERT_EXEC_CODE=1
set TEXT_CERT_EVIDENCE_SUFFIX=-retry-final
call node_modules\.bin\tsx.cmd --test tests\workspace\text-strict-native.test.ts > evidence\workspace-text\strict\code-parity-2-of-8-retry-final.log 2>&1
if errorlevel 1 (echo CODE_SHARD2_FINAL_FAIL & exit /b 1)
echo CODE_SHARD2_FINAL_PASS