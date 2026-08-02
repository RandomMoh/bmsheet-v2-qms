import pexpect
import sys
import json
import time

# 1. Bump deployment version in api/version.json
new_version = str(int(time.time()))
version_file = "api/version.json"
try:
    with open(version_file, "w") as f:
        json.dump({"version": new_version}, f, indent=2)
    print(f"Updated {version_file} to version {new_version}")
except Exception as e:
    print(f"Error updating version.json: {e}")

# 2. Sync version.json to remote api directory so backend returns latest deploy_version
sync_ver_cmd = "rsync -avz api/version.json bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/api/version.json"
print(f"Syncing version.json: {sync_ver_cmd}")
child_v = pexpect.spawn(sync_ver_cmd, encoding='utf-8')
idx_v = child_v.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx_v == 0:
    child_v.sendline('Bm!v2@#456&*()')
    child_v.expect(pexpect.EOF)

# 3. Sync built dist/ folder
cmd = "rsync -avz --exclude 'api' --exclude 'api/' --delete dist/ bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/"
print(f"Running main deployment command: {cmd}")
child = pexpect.spawn(cmd, encoding='utf-8')

idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=300)
if idx == 0:
    print("Sending password...")
    child.sendline('Bm!v2@#456&*()')
    while True:
        try:
            out = child.read_nonblocking(size=1024, timeout=60)
            sys.stdout.write(out)
            sys.stdout.flush()
        except pexpect.EOF:
            break
        except pexpect.TIMEOUT:
            print("\nTimeout waiting for output.")
            break
elif idx == 1:
    print("EOF encountered unexpectedly.")
    print(child.before)
elif idx == 2:
    print("Timeout encountered.")
    print(child.before)

print("\nDone.")
