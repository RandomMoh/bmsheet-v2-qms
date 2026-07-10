<?php
http_response_code(503);
header('Retry-After: 3600');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Offline | Benchmark Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #050505;
            color: #EAEAEA;
            margin: 0;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
            position: relative;
            z-index: 10;
            animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        @keyframes fadeUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .eyebrow {
            font-size: 0.75rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #EF4444; /* red-500 */
            margin-bottom: 1.5rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .eyebrow::before, .eyebrow::after {
            content: '';
            display: block;
            width: 24px;
            height: 1px;
            background-color: rgba(239, 68, 68, 0.3);
        }
        h1 {
            font-size: 3.5rem;
            font-weight: 300;
            letter-spacing: -0.03em;
            margin: 0 0 1.5rem 0;
            color: #FFFFFF;
        }
        p {
            font-size: 1.125rem;
            line-height: 1.6;
            color: #9CA3AF; /* gray-400 */
            margin-bottom: 3rem;
            font-weight: 300;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 2.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            color: #050505;
            background-color: #EAEAEA;
            text-decoration: none;
            border-radius: 4px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
        }
        .btn:hover {
            background-color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
        }
        .btn:active {
            transform: translateY(0);
        }
        .glow {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, rgba(5, 5, 5, 0) 60%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 0;
        }
        .grid-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-image: 
                linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 48px 48px;
            z-index: 1;
            pointer-events: none;
            mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
            -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="glow"></div>
    <div class="container">
        <div class="eyebrow">Service Deprecated</div>
        <h1>System Offline</h1>
        <p>The legacy QMS portal has been permanently shut down and replaced with a faster, modern architecture. Please use the new React-based dashboard to manage operations.</p>
        <a href="https://bmsheet-v2.benchmarkstudio.biz/qms_react/" class="btn">
            ACCESS NEW DASHBOARD
        </a>
    </div>
</body>
</html>
