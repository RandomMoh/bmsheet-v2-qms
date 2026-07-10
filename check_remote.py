import pexpect
import sys

cmd_rsync = "rsync -avz migrate_workspaces.sql bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz:public_html/migrate_workspaces.sql"
print(f"Running command: {cmd_rsync}")
child = pexpect.spawn(cmd_rsync, encoding='utf-8')
idx = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child.sendline('Bm!v2@#456&*()')
    print(child.read())

cmd_mysql = "ssh -o StrictHostKeyChecking=no bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz \"mysql -u bmsheetv2benchma_admin -p'}B(cMH)z[*g@' bmsheetv2benchma_qms < public_html/migrate_workspaces.sql\""
print(f"Running command: {cmd_mysql}")
child2 = pexpect.spawn(cmd_mysql, encoding='utf-8')
idx = child2.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0:
    child2.sendline('Bm!v2@#456&*()')
    print(child2.read())
