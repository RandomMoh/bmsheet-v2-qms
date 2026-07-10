SELECT qname, COUNT(*) as c FROM `order` WHERE qname LIKE '%Laiba%' GROUP BY qname;
SELECT DATE(date) as d, COUNT(*) as c FROM `order` WHERE qname LIKE '%Laiba%' GROUP BY d ORDER BY d DESC LIMIT 5;
SELECT COUNT(*) FROM `order` WHERE qname LIKE '%Laiba%' AND query_done IS NULL AND status != 'issue';
