import pexpect

cmd = "ssh bmsheetv2benchma@bmsheet-v2.benchmarkstudio.biz"
child = pexpect.spawn(cmd, encoding="utf-8")
idx = child.expect(["assword:", pexpect.EOF, pexpect.TIMEOUT], timeout=10)
if idx == 0:
    child.sendline("Bm!v2@#456&*()")
    child.expect(["\\$", "#", ">"], timeout=10)
    sql = "mysql -u bmsheetv2benchma_admin -p'}B(cMH)z[*g@' bmsheetv2benchma_qms -e 'SELECT id, year, month, date, project_name, department, type, `propery-order`, qname, status, query_done, completed_by, instruction FROM `order` WHERE `propery-order` LIKE \"%349799%\";'"
    child.sendline(sql)
    child.expect(["\\$", "#", ">"], timeout=15)
    print(child.before)
