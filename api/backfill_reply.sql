UPDATE `order` SET `query-first-reply_datetime` = '2026-04-23 09:18:00'
WHERE `propery-order` IN ('315423','315409','315399','315398','315393','315374','315360','315350')
AND `query-first-reply_datetime` IS NULL;

UPDATE `order` SET `query-first-reply_datetime` = '2026-04-23 09:21:00'
WHERE `propery-order` IN ('315281','315280','315265','315241','315226','315250','314655','314283')
AND `query-first-reply_datetime` IS NULL;
