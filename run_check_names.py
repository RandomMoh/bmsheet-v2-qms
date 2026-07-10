import pexpect
import sys

SERVER = 'bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz'
PASS = 'Bm!v2@#456&*()'
DB_USER = 'bmsheetv2benchma_admin'
DB_PASS = '}B(cMH)z[*g@'
DB_NAME = 'bmsheetv2benchma_qms'

sql = """
SELECT qname, COUNT(*) FROM `order` WHERE DATE(date) = '2026-07-10' GROUP BY qname;
SELECT qname, COUNT(*) FROM `order` WHERE DATE(date) = '2026-07-09' GROUP BY qname;
"""

with open('check_names.sql', 'w') as f:
    f.write(sql)

child = pexpect.spawn('scp', ['-o', 'StrictHostKeyChecking=no', 'check_names.sql', SERVER + ':/tmp/check_names.sql'], encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if idx == 0:
    child.sendline(PASS)
    child.expect(pexpect.EOF, timeout=20)

cmd = f'ssh -o StrictHostKeyChecking=no {SERVER} "mysql -u {DB_USER} -p\\"{DB_PASS}\\" {DB_NAME} < /tmp/check_names.sql"'
child2 = pexpect.spawn('/bin/bash', ['-c', cmd], encoding='utf-8')
idx = child2.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
if idx == 0:
    child2.sendline(PASS)
    child2.expect(pexpect.EOF, timeout=20)
print(child2.before.strip())
