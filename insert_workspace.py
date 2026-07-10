import pexpect

SERVER = 'bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz'
PASS = 'Bm!v2@#456&*()'
DB_USER = 'bmsheetv2benchma_admin'
DB_PASS = '}B(cMH)z[*g@'
DB_NAME = 'bmsheetv2benchma_qms'

def run(cmd, label=''):
    child = pexpect.spawn('ssh', ['-o', 'StrictHostKeyChecking=no', SERVER, cmd], encoding='utf-8')
    idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
    if idx == 0:
        child.sendline(PASS)
        child.expect(pexpect.EOF, timeout=20)
    out = child.before.strip()
    print(f'{label}: {out}' if out else f'{label}: OK')
    return out

# Step 1: Upload SQL file via SCP
child = pexpect.spawn('scp', ['-o', 'StrictHostKeyChecking=no', 'insert_workspace.sql', SERVER + ':/tmp/insert_workspace.sql'], encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if idx == 0:
    child.sendline(PASS)
    child.expect(pexpect.EOF, timeout=20)
print('SCP:', child.before.strip() or 'OK')

# Step 2: Run SQL
run(f'mysql -u {DB_USER} -p"{DB_PASS}" {DB_NAME} < /tmp/insert_workspace.sql', 'MySQL insert')

# Step 3: Verify
run(f'mysql -u {DB_USER} -p"{DB_PASS}" {DB_NAME} -e "SELECT id, team_id, team_name FROM slack_workspaces;"', 'Workspaces')
