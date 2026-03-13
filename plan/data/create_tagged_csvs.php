<?php
/**
 * Create two tagged CSV files for Mailchimp re-import
 * Mailchimp will match by email and add the tag without duplicating
 */
$file = __DIR__ . '/merged_users.csv';
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$header = array_shift($lines);

$freeUsers = [];
$blogLeads = [];

foreach ($lines as $line) {
    $f = str_getcsv($line);
    $email = isset($f[0]) ? trim($f[0]) : '';
    $firstName = isset($f[1]) ? trim($f[1]) : '';
    $lastName = isset($f[2]) ? trim($f[2]) : '';
    $status = isset($f[10]) ? trim($f[10]) : '';

    if ($email === '') continue;

    if ($status === 'delivered') {
        $freeUsers[] = [$email, $firstName, $lastName, 'free_user'];
    } elseif ($status === 'validated') {
        $blogLeads[] = [$email, $firstName, $lastName, 'blog_lead'];
    }
}

// Write free_user CSV
$fp = fopen(__DIR__ . '/mailchimp_tag_free_user.csv', 'w');
fputcsv($fp, ['Email Address', 'First Name', 'Last Name', 'Tags']);
foreach ($freeUsers as $row) {
    fputcsv($fp, $row);
}
fclose($fp);

// Write blog_lead CSV
$fp = fopen(__DIR__ . '/mailchimp_tag_blog_lead.csv', 'w');
fputcsv($fp, ['Email Address', 'First Name', 'Last Name', 'Tags']);
foreach ($blogLeads as $row) {
    fputcsv($fp, $row);
}
fclose($fp);

echo "=== TAGGED CSV FILES CREATED ===\n\n";
echo "1. mailchimp_tag_free_user.csv\n";
echo "   Count: " . count($freeUsers) . " contacts\n";
echo "   Tag: free_user\n\n";
echo "2. mailchimp_tag_blog_lead.csv\n";
echo "   Count: " . count($blogLeads) . " contacts\n";
echo "   Tag: blog_lead\n\n";
echo "TOTAL: " . (count($freeUsers) + count($blogLeads)) . "\n\n";
echo "HOW TO IMPORT:\n";
echo "  1. Go to Audience → Add contacts → Import contacts\n";
echo "  2. Upload mailchimp_tag_free_user.csv first\n";
echo "  3. Mailchimp will match existing emails and add the 'free_user' tag\n";
echo "  4. Then upload mailchimp_tag_blog_lead.csv\n";
echo "  5. Mailchimp will add the 'blog_lead' tag\n";
