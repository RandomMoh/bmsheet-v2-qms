import pexpect
import sys

SERVER = "bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz"
PASS   = "Bm!v2@#456&*()"

cmd = f"ssh {SERVER} 'chmod 777 public_html/qms_react/api/sessions && chmod 777 public_html/qms_react/api/webhook-status.json 2>/dev/null || true'"

print(f"Running command: {cmd}")
child = pexpect.spawn(cmd, encoding='utf-8')

idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child.sendline(PASS)
    child.expect(pexpect.EOF)
    print("Permissions fixed.")
elif idx == 1:
    print("EOF! SSH connected without password maybe?")
    print(child.before)
else:
    print("Failed to run SSH command. Timeout.")
    print(child.before)
