import pexpect

SERVER = 'bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz'
PASS = 'Bm!v2@#456&*()'
DB_USER = 'bmsheetv2benchma_admin'
DB_PASS = '}B(cMH)z[*g@'
DB_NAME = 'bmsheetv2benchma_qms'

def run(cmd):
    child = pexpect.spawn('ssh', ['-o', 'StrictHostKeyChecking=no', SERVER, cmd], encoding='utf-8')
    idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
    if idx == 0:
        child.sendline(PASS)
        child.expect(pexpect.EOF, timeout=20)
    out = child.before.strip()
    print(out)
    return out

child = pexpect.spawn('scp', ['-o', 'StrictHostKeyChecking=no', 'check_laiba.sql', SERVER + ':/tmp/check_laiba.sql'], encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if idx == 0:
    child.sendline(PASS)
    child.expect(pexpect.EOF, timeout=20)

run(f'mysql -u {DB_USER} -p"{DB_PASS}" {DB_NAME} < /tmp/check_laiba.sql')
