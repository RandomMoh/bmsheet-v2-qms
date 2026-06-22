CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `created_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `active_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `session_id` VARCHAR(128) NOT NULL,
  `last_active` DATETIME NOT NULL,
  `login_time` DATETIME NOT NULL,
  `ip_address` VARCHAR(45),
  UNIQUE KEY `unique_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
