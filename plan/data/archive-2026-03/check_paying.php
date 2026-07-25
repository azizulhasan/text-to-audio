<?php
/**
 * Check paying customers breakdown in cleaned merged_users.csv
 */
$file = __DIR__ . '/merged_users.csv';
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);
$cols = str_getcsv($header);

echo "Columns relevant to payment:\n";
echo "  Index 8: {$cols[8]}\n";   // gross
echo "  Index 9: {$cols[9]}\n";   // is_verified
echo "  Index 10: {$cols[10]}\n"; // email_status
echo "  Index 11: {$cols[11]}\n"; // is_marketing_allowed
echo "  Index 5: {$cols[5]}\n";   // data_source
echo "  Index 14: {$cols[14]}\n"; // plugin_ids
echo "\nTotal rows: " . count($lines) . "\n\n";

$paying = [];
$free = [];
$noGross = [];

foreach ($lines as $line) {
    $f = str_getcsv($line);
    $gross = isset($f[8]) ? trim($f[8]) : '';
    $grossNum = floatval($gross);

    if ($gross === '' || $gross === null) {
        $noGross[] = $f;
    } elseif ($grossNum > 0) {
        $paying[] = $f;
    } else {
        $free[] = $f;
    }
}

echo "=== PAYMENT BREAKDOWN ===\n";
echo "  Paying (gross > 0):     " . count($paying) . "\n";
echo "  Free (gross = 0):       " . count($free) . "\n";
echo "  No gross data (empty):  " . count($noGross) . "\n\n";

// Show gross value distribution for paying users
if (count($paying) > 0) {
    $grossValues = array_map(function($f) { return floatval($f[8]); }, $paying);
    sort($grossValues);
    $total = array_sum($grossValues);

    echo "=== PAYING CUSTOMERS DETAILS ===\n";
    echo "  Count:   " . count($paying) . "\n";
    echo "  Total $: $" . number_format($total, 2) . "\n";
    echo "  Min:     $" . number_format(min($grossValues), 2) . "\n";
    echo "  Max:     $" . number_format(max($grossValues), 2) . "\n";
    echo "  Avg:     $" . number_format($total / count($paying), 2) . "\n\n";

    // Show data_source for paying
    $sources = [];
    foreach ($paying as $f) {
        $src = isset($f[5]) ? trim($f[5]) : 'EMPTY';
        $sources[$src] = ($sources[$src] ?? 0) + 1;
    }
    echo "  Data sources of paying users:\n";
    arsort($sources);
    foreach ($sources as $s => $c) echo "    {$s}: {$c}\n";

    // Show email_status for paying
    echo "\n  Email status of paying users:\n";
    $statuses = [];
    foreach ($paying as $f) {
        $s = isset($f[10]) ? trim($f[10]) : 'EMPTY';
        $statuses[$s] = ($statuses[$s] ?? 0) + 1;
    }
    arsort($statuses);
    foreach ($statuses as $s => $c) echo "    {$s}: {$c}\n";

    // Show sample paying users
    echo "\n  Sample paying users (first 15):\n";
    for ($i = 0; $i < min(15, count($paying)); $i++) {
        $f = $paying[$i];
        echo "    {$f[0]} | gross: \${$f[8]} | source: {$f[5]} | status: {$f[10]} | mktg: {$f[11]}\n";
    }
}

// Show data_source for no-gross (the validated ones)
echo "\n=== NO GROSS DATA (empty) - SOURCES ===\n";
$noGrossSources = [];
foreach ($noGross as $f) {
    $src = isset($f[5]) ? trim($f[5]) : 'EMPTY';
    $noGrossSources[$src] = ($noGrossSources[$src] ?? 0) + 1;
}
arsort($noGrossSources);
foreach ($noGrossSources as $s => $c) echo "  {$s}: {$c}\n";

echo "\n=== SUMMARY FOR MAILCHIMP SEGMENTATION ===\n";
echo "  Journey 3 (Pro/Paying):  " . count($paying) . " contacts\n";
echo "  Journey 2 (Free Users):  " . count($free) . " contacts\n";
echo "  Journey 1 (Blog Leads):  " . count($noGross) . " contacts (no Freemius data)\n";
echo "  TOTAL:                   " . (count($paying) + count($free) + count($noGross)) . "\n";
