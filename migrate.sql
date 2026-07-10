CREATE TABLE IF NOT EXISTS slack_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id VARCHAR(255) NOT NULL UNIQUE,
    channel_name VARCHAR(255) NOT NULL,
    default_project VARCHAR(255) DEFAULT '',
    default_department VARCHAR(255) DEFAULT '',
    hint TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO slack_channels (channel_id, channel_name, default_project, default_department, hint) VALUES 
('C02203MEEBS', 'bm-xactimate-trueplan-operations', 'Xactimate', 'Floor Plan', 'This channel is for Xactimate/TruePlan floor plan orders. Default project is Xactimate.'),
('C0ALZCHAE1G', 'bm-internal-dev-testing', '', '', '');
