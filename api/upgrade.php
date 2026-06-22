<?php
ini_set('session.cookie_httponly', 1);
ini_set('display_errors', 0);
session_start();

date_default_timezone_set('Asia/Karachi');

$host = "localhost";
$db_user = "bmsheetv2benchma_admin";
$db_pass = "}B(cMH)z[*g@";
$db_name = "bmsheetv2benchma_qms";

$conn = @mysqli_connect($host, $db_user, $db_pass, $db_name);

$error = '';
$success = false;
$new_username = '';
$new_password = '';

if (!$conn) {
    $error = "System temporarily unavailable. Please try again later.";
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old_user = trim($_POST['old_username'] ?? '');
    $old_pass = trim($_POST['old_password'] ?? '');

    if (empty($old_user) || empty($old_pass)) {
        $error = "Please enter both your username and password.";
    } else {
        $stmt = $conn->prepare("SELECT d_id, dname, dusername, dpassword FROM user WHERE dusername = ? AND dpassword = ?");
        $stmt->bind_param("ss", $old_user, $old_pass);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows === 1) {
            $row = $res->fetch_assoc();
            $dname = trim($row['dname']);

            $clean_name = preg_replace('/\b(csr|user|login)\b/i', '', $dname);
            $clean_name = preg_replace('/\s+/', ' ', trim($clean_name));
            $parts = explode(' ', strtolower($clean_name));
            $first = preg_replace('/[^a-z]/', '', $parts[0] ?? 'user');
            $last  = preg_replace('/[^a-z]/', '', $parts[1] ?? '');
            $new_username = !empty($last) ? $first . '.' . $last : $first;

            $chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            $new_password = '';
            for ($i = 0; $i < 8; $i++) {
                $new_password .= $chars[random_int(0, strlen($chars) - 1)];
            }

            $upd = $conn->prepare("UPDATE user SET dusername = ?, dpassword = ? WHERE d_id = ?");
            $upd->bind_param("ssi", $new_username, $new_password, $row['d_id']);

            if ($upd->execute()) {
                $success = true;
            } else {
                $error = "Upgrade failed. Please contact your administrator.";
            }
        } else {
            $error = "Invalid credentials. If you have already upgraded, use your new login at the main portal.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QMS — Account Security Upgrade</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="icon" type="image/x-icon" href="/qms_react/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}

body {
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
  background: #f0fdfa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 20px;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 15% 10%, rgba(20,184,166,.12), transparent),
    radial-gradient(ellipse 60% 50% at 85% 90%, rgba(6,182,212,.10), transparent),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,.6), transparent);
  z-index: 0;
}

.deco { position: fixed; border-radius: 50%; z-index: 0; }
.deco-1 {
  width: 600px; height: 600px;
  top: -200px; right: -150px;
  background: radial-gradient(circle, rgba(20,184,166,.08), transparent 70%);
  animation: float1 18s ease-in-out infinite;
}
.deco-2 {
  width: 500px; height: 500px;
  bottom: -180px; left: -120px;
  background: radial-gradient(circle, rgba(6,182,212,.07), transparent 70%);
  animation: float2 22s ease-in-out infinite;
}
@keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
@keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-25px)} }

.wrap { position: relative; z-index: 1; width: 92%; max-width: 480px; }

/* Brand */
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 36px;
}
.brand-logo {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
}
.brand-logo svg { width: 20px; height: 20px; color: #fff; }
.brand-name { font-size: 15px; font-weight: 700; color: #134e4a; letter-spacing: -.2px; }
.brand-sep { width: 1px; height: 18px; background: #99f6e4; }
.brand-tag { font-size: 12px; font-weight: 500; color: #5eead4; letter-spacing: .5px; text-transform: uppercase; }

/* Card */
.card {
  background: #fff;
  border-radius: 28px;
  padding: 48px 40px;
  box-shadow:
    0 1px 0 rgba(20,184,166,.12),
    0 4px 6px rgba(15,118,110,.04),
    0 20px 60px rgba(15,118,110,.08),
    0 0 0 1px rgba(20,184,166,.06);
}

/* Icon */
.icon-wrap {
  width: 76px; height: 76px;
  margin: 0 auto 28px;
  border-radius: 22px;
  background: linear-gradient(145deg, #f0fdfa, #ccfbf1);
  border: 1.5px solid rgba(20,184,166,.2);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.icon-wrap::after {
  content: '';
  position: absolute;
  inset: -6px; border-radius: 28px;
  border: 1.5px solid rgba(20,184,166,.08);
  animation: pulse-ring 3s ease-in-out infinite;
}
@keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.06);opacity:1} }
.icon-wrap svg { width: 32px; height: 32px; color: #0d9488; }

/* Success icon */
.icon-wrap.ok {
  background: linear-gradient(145deg, #f0fdf4, #dcfce7);
  border-color: rgba(34,197,94,.2);
}
.icon-wrap.ok::after { border-color: rgba(34,197,94,.08); }
.icon-wrap.ok svg { color: #16a34a; animation: popIn .5s cubic-bezier(.175,.885,.32,1.275); }
@keyframes popIn { 0%{transform:scale(0);opacity:0} 100%{transform:scale(1);opacity:1} }

/* Typography */
h1 { font-size: 24px; font-weight: 800; color: #134e4a; letter-spacing: -.4px; margin-bottom: 10px; text-align: center; }
.sub { font-size: 14.5px; color: #5f7271; line-height: 1.75; margin-bottom: 28px; text-align: center; }

/* Error */
.error-msg {
  background: #fff1f2;
  border: 1.5px solid #fecdd3;
  color: #be123c;
  padding: 13px 16px;
  border-radius: 14px;
  font-size: 13px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.5;
}
.error-msg svg { flex-shrink: 0; color: #e11d48; }

/* Form */
.form-group { margin-bottom: 18px; }
label {
  display: block;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #0d9488;
  text-transform: uppercase;
  letter-spacing: .06em;
}
input {
  width: 100%;
  padding: 13px 16px;
  border-radius: 12px;
  border: 1.5px solid #e2f5f3;
  background: #f0fdfa;
  color: #134e4a;
  font-size: 14.5px;
  font-family: inherit;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
input:focus {
  border-color: #5eead4;
  box-shadow: 0 0 0 3px rgba(20,184,166,.1);
  background: #fff;
}
input::placeholder { color: #99bfbc; }
button {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #0d9488, #06b6d4);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s;
  margin-top: 4px;
  letter-spacing: .01em;
  box-shadow: 0 4px 14px rgba(13,148,136,.25);
}
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(13,148,136,.3);
}
button:active { transform: translateY(0); }

/* Credential blocks */
.cred-block {
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  text-align: left;
}
.cred-block.user { background: #f0fdfa; border: 1.5px solid rgba(20,184,166,.2); }
.cred-block.pass { background: #fffbeb; border: 1.5px solid rgba(234,179,8,.2); }
.cred-block::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0; width: 4px;
  border-radius: 4px 0 0 4px;
}
.cred-block.user::before { background: linear-gradient(180deg,#14b8a6,#06b6d4); }
.cred-block.pass::before { background: linear-gradient(180deg,#f59e0b,#fbbf24); }
.cred-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
.cred-block.user .cred-label { color: #0d9488; }
.cred-block.pass .cred-label { color: #b45309; }
.cred-value {
  font-family: 'SF Mono','Fira Code','Cascadia Code','Consolas', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .03em;
  word-break: break-all;
  user-select: all;
}
.cred-block.user .cred-value { color: #0f766e; }
.cred-block.pass .cred-value { color: #92400e; }

/* Warning note */
.warning-note {
  background: #fffbeb;
  border: 1.5px solid rgba(234,179,8,.2);
  border-radius: 12px;
  padding: 15px 16px;
  margin-top: 20px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.warning-note svg { flex-shrink: 0; margin-top: 2px; color: #d97706; }

/* Status pill */
.status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 11px 22px;
  border-radius: 100px;
  background: #f0fdfa;
  border: 1.5px solid rgba(20,184,166,.25);
  font-size: 13.5px;
  font-weight: 600;
  color: #0d9488;
  box-shadow: 0 2px 8px rgba(20,184,166,.08);
  margin-top: 8px;
}
.dot { width: 8px; height: 8px; border-radius: 50%; background: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,.2); animation: blink 1.5s ease-in-out infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.footer { margin-top: 32px; font-size: 12px; color: #99bfbc; font-weight: 500; text-align: center; letter-spacing: .3px; }
</style>
</head>
<body>
<div class="deco deco-1"></div>
<div class="deco deco-2"></div>

<div class="wrap">

  <div class="brand">
    <div class="brand-logo">
      <img src="/qms_react/favicon.ico" alt="Benchmark Studio" style="width:22px;height:22px;object-fit:contain">
    </div>
    <span class="brand-name">Benchmark Studio</span>
    <div class="brand-sep"></div>
    <span class="brand-tag">QMS</span>
  </div>

  <div class="card">

    <?php if ($success): ?>
      <div class="icon-wrap ok" style="margin-bottom:24px">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1>Upgrade Complete</h1>
      <p class="sub">Your account has been secured. Save the credentials below — you will need them to log in going forward.</p>

      <div class="cred-block user">
        <div class="cred-label">New Username</div>
        <div class="cred-value"><?php echo htmlspecialchars($new_username); ?></div>
      </div>
      <div class="cred-block pass">
        <div class="cred-label">New Password</div>
        <div class="cred-value"><?php echo htmlspecialchars($new_password); ?></div>
      </div>

      <div class="warning-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Screenshot or write these down now. You will not be able to view them again after leaving this page.</span>
      </div>

      <div style="text-align:center;margin-top:28px">
        <div class="status"><div class="dot"></div>Account secured successfully</div>
      </div>

    <?php else: ?>
      <div class="icon-wrap">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
        </svg>
      </div>
      <h1>Account Security Upgrade</h1>
      <p class="sub">Verify your identity with your current credentials to complete the security migration.</p>

      <?php if ($error): ?>
        <div class="error-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <?php echo htmlspecialchars($error); ?>
        </div>
      <?php endif; ?>

      <form method="POST">
        <div class="form-group">
          <label>Current Username</label>
          <input type="text" name="old_username" placeholder="Enter your current username" required autocomplete="off">
        </div>
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" name="old_password" placeholder="Enter your current password" required autocomplete="off">
        </div>
        <button type="submit">Verify &amp; Upgrade Account</button>
      </form>
    <?php endif; ?>

  </div>

  <p class="footer">Benchmark Studio &copy; <?php echo date('Y'); ?></p>
</div>
</body>
</html>
