# Slack Webhook Restoration & Response Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Slack Webhook event delivery by ensuring instant <50ms HTTP 200 responses to Slack and guiding the re-verification of the webhook URL in the Slack API Dashboard.

**Architecture:** Move `ackSlack()` early execution right after `url_verification` challenge response in `api/slack-webhook.php`. This closes the HTTP connection to Slack immediately so background processing (Gemini AI API calls, database writes) never causes a Slack 3-second timeout.

**Tech Stack:** PHP, Apache mod_rewrite, Slack Events API, cPanel SCP deployment.

## Global Constraints

- Do not break existing Gemini AI parsing logic or database schema.
- Preserve all existing channel mapping, project filter defaults, and 1st reply detection rules.
- Maintain `ignore_user_abort(true)` and `set_time_limit(60)` for background execution after HTTP ack.

---

### Task 1: Optimize `api/slack-webhook.php` for Early ACK & Deploy to Live cPanel

**Files:**
- Modify: `api/slack-webhook.php:24-75`

**Interfaces:**
- Consumes: Slack Events API HTTP POST payloads.
- Produces: Instant HTTP 200 OK `{"status":"ok"}` response to Slack within <50ms before background processing.

- [ ] **Step 1: Inspect current `ackSlack()` placement in `api/slack-webhook.php`**

Ensure `ackSlack()` is called immediately after `url_verification` check so HTTP response is returned to Slack before DB/AI processing.

- [ ] **Step 2: Update `api/slack-webhook.php` with early `ackSlack()` execution**

```php
if (isset($payload['type']) && $payload['type'] === 'url_verification') {
    debugLog("URL verification challenge.");
    header('Content-Type: application/json');
    echo json_encode(['challenge' => $payload['challenge']]);
    exit;
}

// Immediately acknowledge Slack with HTTP 200 OK to prevent 3-second timeout deactivation
ackSlack();
```

- [ ] **Step 3: Test local build & syntax**

Run: `cd /opt/lampp/htdocs/qms_pro && php -l api/slack-webhook.php`
Expected: `No syntax errors detected in api/slack-webhook.php`

- [ ] **Step 4: Commit and push changes to GitHub**

```bash
git add api/slack-webhook.php
git commit -m "fix(webhook): move ackSlack() call to top of slack-webhook.php for instant <50ms HTTP 200 response"
git push https://github.com/RandomMoh/bmsheet-v2-qms.git main
```

- [ ] **Step 5: Deploy `api/slack-webhook.php` to live cPanel production server**

Upload `api/slack-webhook.php` to `public_html/qms_react/api/` via SCP and verify live deployment.

---

### Task 2: Verify Endpoint with Curl & Provide Re-verification Instructions

**Files:**
- Test: `https://bmsheet-v2.benchmarkstudio.biz/qms_react/api/slack-webhook.php`

- [ ] **Step 1: Execute live curl challenge test**

Run: `curl -i -X POST https://bmsheet-v2.benchmarkstudio.biz/qms_react/api/slack-webhook.php -H "Content-Type: application/json" -d '{"type":"url_verification","challenge":"qms_verify_2026"}'`
Expected: HTTP/2 200 `{"challenge":"qms_verify_2026"}`

- [ ] **Step 2: Execute live curl event test**

Run: `curl -i -X POST https://bmsheet-v2.benchmarkstudio.biz/qms_react/api/slack-webhook.php -H "Content-Type: application/json" -d '{"type":"event_callback","event":{"type":"message","text":"test"}}'`
Expected: HTTP/2 200 `{"status":"ok"}`

- [ ] **Step 3: Verify tail of `debug_webhook.log` on cPanel server**

Verify log contains fresh entries for the test event.

- [ ] **Step 4: Provide step-by-step Slack API Dashboard Re-activation Guide to User**

Guide user to re-verify `https://bmsheet-v2.benchmarkstudio.biz/qms_react/api/slack-webhook.php` on `api.slack.com/apps`.
