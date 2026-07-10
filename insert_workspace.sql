INSERT INTO slack_workspaces (team_id, team_name, bot_token_shift1, bot_token_shift2, bot_token_shift3)
VALUES ('T37K8NV8S', 'Elements Property', 'xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ', 'xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ', 'xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ')
ON DUPLICATE KEY UPDATE
  team_name='Elements Property',
  bot_token_shift1='xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ',
  bot_token_shift2='xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ',
  bot_token_shift3='xoxb-109654777298-11555905107010-ojNh0bMyklazKgcofnXYsPrJ';

SELECT id, team_id, team_name FROM slack_workspaces;
