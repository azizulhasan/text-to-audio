<?php
/**
 * Email Validation & Deliverability Checker for merged_users.csv
 *
 * Checks:
 * 1. Email format validation (RFC 5322)
 * 2. MX record lookup (can the domain accept email?)
 * 3. Disposable/temporary email domain detection
 * 4. Common domain typo detection (gmial.com, yaho.com, etc.)
 * 5. Role-based email detection (info@, admin@, noreply@)
 * 6. Duplicate detection
 * 7. Gibberish/random string detection
 *
 * Usage: php validate_emails.php
 */

$csvFile = __DIR__ . '/merged_users.csv';
$outputFile = __DIR__ . '/merged_users.csv'; // overwrite in place

// ─── Disposable email domains ────────────────────────────────────────
$disposableDomains = [
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'tempmail.com',
    'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com',
    'guerrillamailblock.com', 'grr.la', 'dispostable.com', 'yopmail.com',
    'trashmail.com', 'trashmail.net', 'trashmail.me', 'mailnesia.com',
    'maildrop.cc', 'discard.email', 'mailcatch.com', 'tempail.com',
    'tempr.email', 'temp-mail.io', 'mohmal.com', 'burnermail.io',
    'minutemail.com', 'emailondeck.com', 'getnada.com', 'mailsac.com',
    'harakirimail.com', 'tmail.ws', '10minutemail.com', 'guerrillamail.info',
    'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.org',
    'spam4.me', 'binkmail.com', 'bobmail.info', 'chammy.info',
    'devnullmail.com', 'jetable.org', 'meltmail.com', 'nospam.ze.tc',
    'spamgourmet.com', 'trashymail.com', 'mailexpire.com', 'safetymail.info',
    'filzmail.com', 'mailmoat.com', 'mailnull.com', 'spamfree24.org',
    'mytemp.email', 'tmpmail.net', 'tmpmail.org', 'tempmailaddress.com',
    'emailfake.com', 'crazymailing.com', 'armyspy.com', 'dayrep.com',
    'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com',
    'rhyta.com', 'superrito.com', 'teleworm.us',
];

// ─── Common domain typos → corrections ──────────────────────────────
$domainTypos = [
    'gmial.com' => 'gmail.com', 'gmai.com' => 'gmail.com', 'gamil.com' => 'gmail.com',
    'gmaill.com' => 'gmail.com', 'gmali.com' => 'gmail.com', 'gmal.com' => 'gmail.com',
    'gnail.com' => 'gmail.com', 'gmsil.com' => 'gmail.com', 'gmil.com' => 'gmail.com',
    'gmail.co' => 'gmail.com', 'gmail.con' => 'gmail.com', 'gmail.om' => 'gmail.com',
    'gmail.cm' => 'gmail.com', 'gmail.cim' => 'gmail.com', 'gmail.vom' => 'gmail.com',
    'gmail.xom' => 'gmail.com', 'gmaol.com' => 'gmail.com', 'gmaiil.com' => 'gmail.com',
    'yaho.com' => 'yahoo.com', 'yahooo.com' => 'yahoo.com', 'yhaoo.com' => 'yahoo.com',
    'yahoo.co' => 'yahoo.com', 'yahoo.con' => 'yahoo.com', 'yaoo.com' => 'yahoo.com',
    'yhoo.com' => 'yahoo.com', 'yhaoo.com' => 'yahoo.com',
    'hotmai.com' => 'hotmail.com', 'hotmal.com' => 'hotmail.com', 'hotmial.com' => 'hotmail.com',
    'hotmail.co' => 'hotmail.com', 'hotmail.con' => 'hotmail.com', 'hotamil.com' => 'hotmail.com',
    'outlok.com' => 'outlook.com', 'outloo.com' => 'outlook.com', 'outlook.co' => 'outlook.com',
    'outook.com' => 'outlook.com', 'outlool.com' => 'outlook.com',
    'protonmal.com' => 'protonmail.com', 'protonmail.co' => 'protonmail.com',
    'iclod.com' => 'icloud.com', 'icloud.co' => 'icloud.com',
    'live.co' => 'live.com', 'live.con' => 'live.com',
];

// ─── Role-based email prefixes ──────────────────────────────────────
$rolePrefixes = [
    'noreply', 'no-reply', 'no_reply', 'donotreply', 'do-not-reply',
    'mailer-daemon', 'postmaster', 'hostmaster', 'abuse', 'spam',
    'null', 'devnull', 'nobody', 'root', 'daemon', 'bounce',
    'unsubscribe', 'autoresponder', 'auto-responder',
];

// Informational role prefixes (still marketable, just flagged)
$roleInfoPrefixes = [
    'info', 'admin', 'support', 'sales', 'contact', 'help',
    'office', 'mail', 'webmaster', 'team', 'hello', 'billing',
    'marketing', 'press', 'media', 'feedback', 'general',
];

// ─── Helper functions ───────────────────────────────────────────────

function isValidEmailFormat($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function hasMXRecord($domain) {
    static $cache = [];
    if (isset($cache[$domain])) return $cache[$domain];

    // Check MX records
    $hasMX = @checkdnsrr($domain, 'MX');

    // Fallback: check A record (some domains accept mail via A record)
    if (!$hasMX) {
        $hasMX = @checkdnsrr($domain, 'A');
    }

    $cache[$domain] = $hasMX;
    return $hasMX;
}

function isDisposable($domain, $disposableDomains) {
    return in_array(strtolower($domain), $disposableDomains);
}

function getDomainTypo($domain, $domainTypos) {
    $lower = strtolower($domain);
    return isset($domainTypos[$lower]) ? $domainTypos[$lower] : false;
}

function isNonDeliveryRole($localPart, $rolePrefixes) {
    $lower = strtolower($localPart);
    return in_array($lower, $rolePrefixes);
}

function isGibberish($localPart) {
    // Check for excessive consonant clusters (5+ consonants in a row)
    if (preg_match('/[^aeiou0-9_.+-]{6,}/i', $localPart)) return true;

    // Check for random-looking strings (mostly numbers with few letters, 10+ chars)
    if (strlen($localPart) > 10 && preg_match('/^[0-9]{8,}$/', $localPart)) return true;

    // Very long random-looking local parts
    if (strlen($localPart) > 40) return true;

    return false;
}

function hasValidTLD($domain) {
    $parts = explode('.', $domain);
    $tld = end($parts);
    // TLD must be at least 2 chars
    if (strlen($tld) < 2) return false;
    // TLD shouldn't be all numbers
    if (ctype_digit($tld)) return false;
    return true;
}

// ─── Main processing ────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     EMAIL VALIDATION & DELIVERABILITY CHECK                 ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

$lines = file($csvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);
$headerCols = str_getcsv($header);

echo "Columns: " . implode(', ', $headerCols) . "\n";
echo "Total rows loaded: " . count($lines) . "\n\n";

// Parse all rows
$allRows = [];
foreach ($lines as $line) {
    $allRows[] = str_getcsv($line);
}

// ─── Categorize rows ────────────────────────────────────────────────

$alreadyDelivered = [];   // email_status = delivered (already validated)
$nullStatus = [];          // email_status = null/empty (need validation)
$otherStatus = [];         // email_status = something else

foreach ($allRows as $row) {
    $status = isset($row[10]) ? trim($row[10]) : '';
    if ($status === 'delivered') {
        $alreadyDelivered[] = $row;
    } elseif ($status === '' || $status === null) {
        $nullStatus[] = $row;
    } else {
        $otherStatus[] = $row;
    }
}

echo "=== STATUS BREAKDOWN ===\n";
echo "  Already delivered:  " . count($alreadyDelivered) . "\n";
echo "  Null/empty status:  " . count($nullStatus) . " ← THESE NEED VALIDATION\n";
echo "  Other status:       " . count($otherStatus) . "\n\n";

// ─── Validate null-status emails ────────────────────────────────────

$stats = [
    'total_checked' => 0,
    'valid' => 0,
    'invalid_format' => 0,
    'no_mx' => 0,
    'disposable' => 0,
    'typo_domain' => 0,
    'non_delivery_role' => 0,
    'info_role' => 0,
    'gibberish' => 0,
    'invalid_tld' => 0,
    'duplicate' => 0,
];

$seenEmails = [];
$validatedRows = [];
$removedRows = [];
$typoFixedRows = [];

// First, collect all emails from delivered rows to check for cross-duplicates
foreach ($alreadyDelivered as $row) {
    $email = strtolower(trim($row[0]));
    $seenEmails[$email] = true;
}

echo "=== VALIDATING " . count($nullStatus) . " NULL-STATUS EMAILS ===\n\n";

$mxCheckCount = 0;
$domainBatch = [];

// First pass: collect unique domains for batch MX check
foreach ($nullStatus as $row) {
    $email = strtolower(trim($row[0]));
    if (strpos($email, '@') !== false) {
        $domain = substr($email, strpos($email, '@') + 1);
        $domainBatch[$domain] = true;
    }
}

echo "Unique domains to check MX: " . count($domainBatch) . "\n";
echo "Running MX record lookups (this may take a moment)...\n";

// Pre-cache all MX lookups
$mxResults = [];
$mxPass = 0;
$mxFail = 0;
foreach (array_keys($domainBatch) as $domain) {
    $result = hasMXRecord($domain);
    $mxResults[$domain] = $result;
    if ($result) $mxPass++;
    else $mxFail++;
}

echo "MX Results: $mxPass domains can receive mail, $mxFail cannot\n\n";

// Show failed MX domains
if ($mxFail > 0) {
    echo "--- Domains with NO MX/A record (emails undeliverable) ---\n";
    foreach ($mxResults as $domain => $result) {
        if (!$result) {
            // Count how many emails use this domain
            $count = 0;
            foreach ($nullStatus as $row) {
                $e = strtolower(trim($row[0]));
                if (strpos($e, '@' . $domain) !== false) $count++;
            }
            echo "  ✗ $domain ($count emails)\n";
        }
    }
    echo "\n";
}

// Second pass: full validation
foreach ($nullStatus as $idx => $row) {
    $stats['total_checked']++;
    $email = strtolower(trim($row[0]));
    $issues = [];
    $fatal = false;

    // 1. Duplicate check (against delivered + already seen null-status)
    if (isset($seenEmails[$email])) {
        $stats['duplicate']++;
        $issues[] = 'DUPLICATE';
        $fatal = true;
    }
    $seenEmails[$email] = true;

    if ($fatal) {
        $row[] = implode('; ', $issues);
        $removedRows[] = $row;
        continue;
    }

    // 2. Format check
    if (!isValidEmailFormat($email)) {
        $stats['invalid_format']++;
        $issues[] = 'INVALID_FORMAT';
        $fatal = true;
    }

    if ($fatal) {
        $row[] = implode('; ', $issues);
        $removedRows[] = $row;
        continue;
    }

    // Parse parts
    list($localPart, $domain) = explode('@', $email, 2);

    // 3. TLD check
    if (!hasValidTLD($domain)) {
        $stats['invalid_tld']++;
        $issues[] = 'INVALID_TLD';
        $fatal = true;
    }

    // 4. Disposable domain
    if (isDisposable($domain, $disposableDomains)) {
        $stats['disposable']++;
        $issues[] = 'DISPOSABLE';
        $fatal = true;
    }

    // 5. Domain typo check
    $typoFix = getDomainTypo($domain, $domainTypos);
    if ($typoFix) {
        $stats['typo_domain']++;
        $correctedEmail = $localPart . '@' . $typoFix;
        // Check if corrected email already exists
        if (isset($seenEmails[$correctedEmail])) {
            $issues[] = "TYPO_DUPLICATE($domain→$typoFix)";
            $fatal = true;
        } else {
            $issues[] = "TYPO_FIXED($domain→$typoFix)";
            $row[0] = $correctedEmail;
            $seenEmails[$correctedEmail] = true;
            $typoFixedRows[] = ['old' => $email, 'new' => $correctedEmail];
        }
    }

    // 6. MX record check
    $checkDomain = $typoFix ?: $domain;
    $hasMX = isset($mxResults[$checkDomain]) ? $mxResults[$checkDomain] : hasMXRecord($checkDomain);
    if (!$hasMX) {
        $stats['no_mx']++;
        $issues[] = 'NO_MX_RECORD';
        $fatal = true;
    }

    // 7. Non-delivery role check (noreply, bounce, etc.)
    if (isNonDeliveryRole($localPart, $rolePrefixes)) {
        $stats['non_delivery_role']++;
        $issues[] = 'NON_DELIVERY_ROLE';
        $fatal = true;
    }

    // 8. Gibberish check
    if (isGibberish($localPart)) {
        $stats['gibberish']++;
        $issues[] = 'GIBBERISH';
        // Not fatal, just flagged — could be a real person
    }

    // 9. Info role check (not fatal, just noted)
    if (in_array($localPart, $roleInfoPrefixes)) {
        $stats['info_role']++;
        // Not added to issues, these are fine for marketing
    }

    if ($fatal) {
        $row[] = implode('; ', $issues);
        $removedRows[] = $row;
        continue;
    }

    // Email passed validation — mark as validated
    $row[10] = 'validated'; // Set email_status to 'validated'
    $stats['valid']++;
    $validatedRows[] = $row;
}

// ─── Results ────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                    VALIDATION RESULTS                       ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

echo "Total null-status emails checked:  " . $stats['total_checked'] . "\n";
echo "──────────────────────────────────────────\n";
echo "  ✅ Valid (deliverable):          " . $stats['valid'] . "\n";
echo "  ❌ Invalid format:               " . $stats['invalid_format'] . "\n";
echo "  ❌ No MX record (undeliverable): " . $stats['no_mx'] . "\n";
echo "  ❌ Disposable domain:            " . $stats['disposable'] . "\n";
echo "  ❌ Non-delivery role (noreply):   " . $stats['non_delivery_role'] . "\n";
echo "  ❌ Invalid TLD:                  " . $stats['invalid_tld'] . "\n";
echo "  ❌ Duplicate (cross-check):      " . $stats['duplicate'] . "\n";
echo "  🔧 Typo domain fixed:            " . $stats['typo_domain'] . "\n";
echo "  ⚠️  Gibberish (kept, flagged):    " . $stats['gibberish'] . "\n";
echo "  ℹ️  Role-based info (kept):       " . $stats['info_role'] . "\n\n";

if (count($typoFixedRows) > 0) {
    echo "--- TYPO CORRECTIONS ---\n";
    foreach ($typoFixedRows as $fix) {
        echo "  {$fix['old']} → {$fix['new']}\n";
    }
    echo "\n";
}

// Show sample removed rows
if (count($removedRows) > 0) {
    echo "--- SAMPLE REMOVED EMAILS (first 20) ---\n";
    $shown = 0;
    foreach ($removedRows as $row) {
        if ($shown >= 20) break;
        $reason = end($row);
        echo "  ✗ {$row[0]} [{$reason}]\n";
        $shown++;
    }
    if (count($removedRows) > 20) {
        echo "  ... and " . (count($removedRows) - 20) . " more\n";
    }
    echo "\n";
}

// ─── Build final CSV ────────────────────────────────────────────────

// Combine: already delivered + validated null-status + other-status
$finalRows = array_merge($alreadyDelivered, $validatedRows, $otherStatus);

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                    FINAL CSV SUMMARY                        ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";
echo "  Previously delivered:     " . count($alreadyDelivered) . "\n";
echo "  Newly validated:          " . count($validatedRows) . "\n";
echo "  Other status (kept):      " . count($otherStatus) . "\n";
echo "  ──────────────────────────────────\n";
echo "  TOTAL MARKETABLE:         " . count($finalRows) . "\n";
echo "  Removed (undeliverable):  " . count($removedRows) . "\n\n";

// ─── Write output ───────────────────────────────────────────────────

$fp = fopen($outputFile, 'w');
fwrite($fp, $header . "\n");
foreach ($finalRows as $row) {
    // Ensure we only write the original columns (not the appended reason)
    $row = array_slice($row, 0, count($headerCols));
    fputcsv($fp, $row);
}
fclose($fp);

echo "✅ Saved cleaned CSV to: $outputFile\n";
echo "   Total rows: " . (count($finalRows) + 1) . " (header + data)\n\n";

// ─── Write removed emails log ───────────────────────────────────────

$logFile = __DIR__ . '/removed_emails_log.csv';
$lfp = fopen($logFile, 'w');
$logHeader = $headerCols;
$logHeader[] = 'removal_reason';
fputcsv($lfp, $logHeader);
foreach ($removedRows as $row) {
    fputcsv($lfp, $row);
}
fclose($lfp);

echo "📋 Removed emails log saved to: removed_emails_log.csv\n";
echo "   Removed count: " . count($removedRows) . "\n";
