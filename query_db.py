import pexpect
import sys

cmd = "ssh -o StrictHostKeyChecking=no bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz \"mysql -u bmsheetv2benchma_admin -p'}B(cMH)z[*g@' -e 'USE bmsheetv2benchma_qms; SELECT * FROM slack_channels;'\""
child = pexpect.spawn(cmd, encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)

if idx == 0:
    child.sendline('Bm!v2@#456&*()')
    child.expect(pexpect.EOF)
    print(child.before)
else:
    print("Failed to get password prompt")
