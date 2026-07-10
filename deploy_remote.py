import pexpect
import sys

# Deploy API
cmd_api = "rsync -avz api/ bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/api/"
print(f"Running command: {cmd_api}")
child = pexpect.spawn(cmd_api, encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child.sendline('Bm!v2@#456&*()')
    print(child.read())

# Deploy dist folder (react app)
cmd_dist = "rsync -avz dist/ bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/"
print(f"Running command: {cmd_dist}")
child = pexpect.spawn(cmd_dist, encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child.sendline('Bm!v2@#456&*()')
    print(child.read())
