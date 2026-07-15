<?php
/**
 * Debug the gross column to understand the data
 */
$backupFile = __DIR__ . '/merged_users_backup_with_bounced.csv';
$lines = file($backupFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);
$cols = str_getcsv($header);

echo "Column 8 name: {$cols[8]}\n\n";

// Get all unique gross values
$grossValues = [];
foreach ($lines as $line) {
    $f = str_getcsv($line);
    $gross = isset($f[8]) ? trim($f[8]) : 'MISSING';
    $grossValues[$gross] = ($grossValues[$gross] ?? 0) + 1;
}

echo "=== Unique 'gross' values (top 30) ===\n";
arsort($grossValues);
$i = 0;
foreach ($grossValues as $v => $c) {
    if ($i++ >= 30) break;
    echo "  [{$v}] => {$c}\n";
}

echo "\nTotal unique values: " . count($grossValues) . "\n";

// Check: are there ANY non-zero, non-empty gross values?
$nonZero = 0;
foreach ($grossValues as $v => $c) {
    if ($v !== '' && $v !== '0' && $v !== '0.00' && $v !== 'MISSING' && floatval($v) > 0) {
        $nonZero += $c;
        echo "  NON-ZERO: [{$v}] x {$c}\n";
    }
}
echo "\nTotal rows with non-zero gross: {$nonZero}\n";

// Let's also check what awk would see - show raw line #5 with comma split
echo "\n=== RAW LINE ANALYSIS (first 5 lines with awk-style comma split) ===\n";
$rawLines = file($backupFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
array_shift($rawLines);

for ($i = 0; $i < min(5, count($rawLines)); $i++) {
    $raw = $rawLines[$i];
    $awkFields = explode(',', $raw);
    $csvFields = str_getcsv($raw);

    echo "\nLine " . ($i+1) . ":\n";
    echo "  awk field[8] (0-indexed): " . (isset($awkFields[8]) ? "[{$awkFields[8]}]" : "MISSING") . "\n";
    echo "  CSV field[8] (0-indexed): " . (isset($csvFields[8]) ? "[{$csvFields[8]}]" : "MISSING") . "\n";
    echo "  Email (CSV[0]): {$csvFields[0]}\n";
    echo "  Raw first 200 chars: " . substr($raw, 0, 200) . "\n";
}

// Check a line that awk would see as gross > 0
echo "\n=== LINES WHERE AWK FIELD[8] > 0 (first 10) ===\n";
$found = 0;
foreach ($rawLines as $raw) {
    $awkFields = explode(',', $raw);
    if (isset($awkFields[8]) && is_numeric(trim($awkFields[8])) && floatval(trim($awkFields[8])) > 0) {
        $csvFields = str_getcsv($raw);
        echo "  awk[8]=[{$awkFields[8]}] vs csv[8]=[{$csvFields[8]}]\n";
        echo "    Email(csv): {$csvFields[0]}\n";
        echo "    Raw: " . substr($raw, 0, 250) . "\n\n";
        $found++;
        if ($found >= 10) break;
    }
}
echo "Found: {$found}\n";
