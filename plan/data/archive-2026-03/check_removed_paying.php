<?php
/**
 * Check if paying customers were incorrectly removed
 */
$logFile = __DIR__ . '/removed_emails_log.csv';
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);
$cols = str_getcsv($header);

echo "Log columns: " . implode(', ', $cols) . "\n";
echo "Total removed: " . count($lines) . "\n\n";

// Find removed entries with gross > 0
$payingRemoved = [];
$payingReasons = [];

foreach ($lines as $line) {
    $f = str_getcsv($line);
    $gross = isset($f[8]) ? floatval(trim($f[8])) : 0;
    $reason = end($f);

    if ($gross > 0) {
        $payingRemoved[] = $f;
        // Extract reason
        if (preg_match('/^([A-Z_]+)/', $reason, $m)) {
            $payingReasons[$m[1]] = ($payingReasons[$m[1]] ?? 0) + 1;
        }
    }
}

echo "=== PAYING CUSTOMERS IN REMOVED LOG ===\n";
echo "Count: " . count($payingRemoved) . "\n\n";

if (count($payingRemoved) > 0) {
    echo "Removal reasons:\n";
    arsort($payingReasons);
    foreach ($payingReasons as $r => $c) echo "  {$r}: {$c}\n";

    // Show samples
    echo "\nSample removed paying users (first 20):\n";
    for ($i = 0; $i < min(20, count($payingRemoved)); $i++) {
        $f = $payingRemoved[$i];
        $reason = end($f);
        echo "  Email: {$f[0]} | Gross: \${$f[8]} | Reason: {$reason}\n";
    }

    // Check the email format of INVALID_FORMAT ones
    echo "\n=== INVALID_FORMAT paying emails - pattern analysis ===\n";
    $commaEmails = 0;
    $otherInvalid = 0;
    foreach ($payingRemoved as $f) {
        $reason = end($f);
        if (strpos($reason, 'INVALID_FORMAT') !== false) {
            $email = $f[0];
            if (strpos($email, ',') !== false) {
                $commaEmails++;
                if ($commaEmails <= 10) {
                    echo "  COMMA in email: [{$email}]\n";
                }
            } else {
                $otherInvalid++;
                if ($otherInvalid <= 5) {
                    echo "  Other invalid: [{$email}]\n";
                }
            }
        }
    }
    echo "\n  Emails with commas: {$commaEmails}\n";
    echo "  Other invalid format: {$otherInvalid}\n";
}

// Also check: how many paying users are in the BACKUP file?
echo "\n=== CHECKING ORIGINAL BACKUP ===\n";
$backupFile = __DIR__ . '/merged_users_backup_with_bounced.csv';
$bLines = file($backupFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
array_shift($bLines); // remove header

$totalPaying = 0;
$payingWithComma = 0;
$payingClean = 0;

foreach ($bLines as $line) {
    $f = str_getcsv($line);
    $gross = isset($f[8]) ? floatval(trim($f[8])) : 0;
    if ($gross > 0) {
        $totalPaying++;
        $email = trim($f[0]);
        if (strpos($email, ',') !== false) {
            $payingWithComma++;
        } elseif (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $payingClean++;
        }
    }
}

echo "Total paying in backup: {$totalPaying}\n";
echo "  With comma in email field: {$payingWithComma}\n";
echo "  Clean valid email format: {$payingClean}\n";
echo "  Other: " . ($totalPaying - $payingWithComma - $payingClean) . "\n";
