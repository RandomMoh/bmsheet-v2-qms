CREATE TABLE IF NOT EXISTS api_usage (
    id INT PRIMARY KEY DEFAULT 1,
    remaining_requests INT DEFAULT 0,
    remaining_tokens INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO api_usage (id, remaining_requests, remaining_tokens) VALUES (1, 14400, 30000);
