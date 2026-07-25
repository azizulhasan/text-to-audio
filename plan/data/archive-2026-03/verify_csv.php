<?php
/**
 * Quick verification of merged_users.csv after validation
 */
$file = __DIR__ . '/merged_users.csv';
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);

echo "Total data rows: " . count($lines) . "\n\n";

$statuses = [];
$mktg = [];
$cross = [];

foreach ($lines as $line) {
    $f = str_getcsv($line);
    $s = isset($f[10]) ? trim($f[10]) : 'EMPTY';
    $m = isset($f[11]) ? trim($f[11]) : 'EMPTY';

    $statuses[$s] = ($statuses[$s] ?? 0) + 1;
    $mktg[$m ?: 'EMPTY'] = ($mktg[$m ?: 'EMPTY'] ?? 0) + 1;

    $key = "status={$s} + mktg={$m}";
    $cross[$key] = ($cross[$key] ?? 0) + 1;
}

echo "=== email_status breakdown ===\n";
arsort($statuses);
foreach ($statuses as $s => $c) echo "  {$s}: {$c}\n";

echo "\n=== is_marketing_allowed breakdown ===\n";
arsort($mktg);
foreach ($mktg as $s => $c) echo "  {$s}: {$c}\n";

echo "\n=== Cross-tab: status × marketing_allowed ===\n";
arsort($cross);
foreach ($cross as $k => $c) echo "  {$k}: {$c}\n";

// Also check removed log
$logFile = __DIR__ . '/removed_emails_log.csv';
if (file_exists($logFile)) {
    $logLines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    array_shift($logLines); // header
    echo "\n=== Removed emails log ===\n";
    echo "  Total removed: " . count($logLines) . "\n";

    $reasons = [];
    foreach ($logLines as $line) {
        $f = str_getcsv($line);
        $reason = end($f);
        // Extract main reason
        if (preg_match('/^([A-Z_]+)/', $reason, $m)) {
            $reasons[$m[1]] = ($reasons[$m[1]] ?? 0) + 1;
        }
    }
    arsort($reasons);
    foreach ($reasons as $r => $c) echo "    {$r}: {$c}\n";
}
