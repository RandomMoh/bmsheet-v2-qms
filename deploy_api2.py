import pexpect
import sys

cmd_rsync = "rsync -avz --delete api/ bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/api/"
print(f"Running command: {cmd_rsync}")
child = pexpect.spawn(cmd_rsync, encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child.sendline('Bm!v2@#456&*()')
    print(child.read())
else:
    print("Failed")
