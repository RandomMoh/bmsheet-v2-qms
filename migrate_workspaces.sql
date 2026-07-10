CREATE TABLE IF NOT EXISTS `slack_workspaces` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `team_id` varchar(100) NOT NULL,
    `team_name` varchar(255) NOT NULL,
    `bot_token_shift1` varchar(255) NOT NULL,
    `bot_token_shift2` varchar(255) NOT NULL,
    `bot_token_shift3` varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `team_id` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add workspace_id to slack_channels if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'slack_channels';
SET @columnname = 'workspace_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " INT(11) NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create default workspace if table is empty
INSERT IGNORE INTO `slack_workspaces` (`team_id`, `team_name`, `bot_token_shift1`, `bot_token_shift2`, `bot_token_shift3`) 
VALUES ('DEFAULT', 'Default Workspace', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');

-- Update existing channels to point to the default workspace
UPDATE `slack_channels` SET `workspace_id` = (SELECT `id` FROM `slack_workspaces` WHERE `team_id` = 'DEFAULT' LIMIT 1) WHERE `workspace_id` IS NULL;
