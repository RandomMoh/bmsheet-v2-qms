import pexpect

cmd = "ssh bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz"
child = pexpect.spawn(cmd, encoding="utf-8")
idx = child.expect(["assword:", pexpect.EOF, pexpect.TIMEOUT], timeout=10)
if idx == 0:
    child.sendline("Bm!v2@#456&*()")
    child.expect(["\\$", "#", ">"], timeout=10)
    sql = "mysql -u bmsheetv2benchma_admin -p'}B(cMH)z[*g@' bmsheetv2benchma_qms -e 'SELECT a.user_id, a.username, a.role, a.last_active, u.dname, u.dusername FROM active_sessions a LEFT JOIN user u ON u.d_id = a.user_id;'"
    child.sendline(sql)
    child.expect(["\\$", "#", ">"], timeout=15)
    with open("/opt/lampp/htdocs/qms_pro/sessions_out.txt", "w") as f:
        f.write(child.before)
    print("Done writing sessions_out.txt")
