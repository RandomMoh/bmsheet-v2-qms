import pexpect

cmd = "ssh bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz"
child = pexpect.spawn(cmd, encoding="utf-8")
idx = child.expect(["assword:", pexpect.EOF, pexpect.TIMEOUT], timeout=10)
if idx == 0:
    child.sendline("Bm!v2@#456&*()")
    child.expect(["\\$", "#", ">"], timeout=10)
    sql = "mysql -u bmsheetv2benchma_admin -p'}B(cMH)z[*g@' bmsheetv2benchma_qms -e 'SELECT NOW() AS pkt_now; SELECT * FROM active_sessions; SELECT qname, completed_by, date FROM `order` WHERE date >= DATE_SUB(NOW(), INTERVAL 30 MINUTE);'"
    child.sendline(sql)
    child.expect(["\\$", "#", ">"], timeout=15)
    print(child.before)
