import pexpect
import sys

# We need to run rsync to sync the dist folder to the remote qms_react folder.
# We exclude the 'api' directory to ensure the backend is untouched.
cmd = "rsync -avz --exclude 'api' --exclude 'api/' --delete dist/ bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/qms_react/"

print(f"Running command: {cmd}")
child = pexpect.spawn(cmd, encoding='utf-8')

# Expect the password prompt or EOF
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    print("Sending password...")
    child.sendline('Bm!v2@#456&*()')
    # Print the rest of the output
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
