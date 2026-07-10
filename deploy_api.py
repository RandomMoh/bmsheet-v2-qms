import pexpect
import sys

SERVER = "bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz"
PASS   = "Bm!v2@#456&*()"

def run_rsync(label, cmd):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  {cmd}")
    print(f"{'='*60}")
    child = pexpect.spawn(cmd, encoding='utf-8')
    idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
    if idx == 0:
        child.sendline(PASS)
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
    else:
        print("No password prompt (SSH keys or instant completion).")
        print(child.before)

# ─── Deploy API ────────────────────────────────────────────────
# Syncs ONLY api/ → remote api/
# --delete removes stale files inside api/ only
run_rsync(
    "Deploying API (api/ → remote api/)",
    f"rsync -avz --delete api/ {SERVER}:public_html/qms_react/api/"
)

# ─── Deploy Frontend ───────────────────────────────────────────
# Syncs ONLY dist/ → remote root
# --exclude api/ ensures the remote api/ folder is NEVER touched
run_rsync(
    "Deploying Frontend (dist/ → remote root, EXCLUDING api/)",
    f"rsync -avz --delete --exclude='api/' dist/ {SERVER}:public_html/qms_react/"
)

print("\n✅ Deploy complete. API and Frontend deployed safely.\n")
