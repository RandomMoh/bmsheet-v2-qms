
SELECT qname, COUNT(*) FROM `order` WHERE DATE(date) = '2026-07-10' GROUP BY qname;
SELECT qname, COUNT(*) FROM `order` WHERE DATE(date) = '2026-07-09' GROUP BY qname;
