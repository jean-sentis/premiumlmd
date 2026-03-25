<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$audit_table = $wpdb->prefix . 'lmd_audit_log';

if ( ! LMD_Schema_Helpers::table_exists($audit_table) ) {
    echo '<div class="notice notice-warning"><p>La table du journal n\'existe pas encore. Réactivez le plugin.</p></div>';
    return;
}

// Filters
$filter_action = sanitize_text_field($_GET['audit_action'] ?? '');
$filter_user   = sanitize_text_field($_GET['audit_user'] ?? '');
$filter_est_id = absint($_GET['audit_est'] ?? 0);
$page_num      = max(1, absint($_GET['audit_page'] ?? 1));
$per_page      = 50;
$offset        = ($page_num - 1) * $per_page;

$where = "WHERE 1=1";
$vals = [];
if ($filter_action) {
    $where .= " AND a.action = %s";
    $vals[] = $filter_action;
}
if ($filter_user) {
    $where .= " AND a.user_login = %s";
    $vals[] = $filter_user;
}
if ($filter_est_id) {
    $where .= " AND a.estimation_id = %d";
    $vals[] = $filter_est_id;
}

$total = (int) $wpdb->get_var(
    $vals
        ? $wpdb->prepare("SELECT COUNT(*) FROM `{$audit_table}` a {$where}", ...$vals)
        : "SELECT COUNT(*) FROM `{$audit_table}` a {$where}"
);

$logs = $vals
    ? $wpdb->get_results($wpdb->prepare(
        "SELECT a.*, e.nom as est_nom
         FROM `{$audit_table}` a
         LEFT JOIN `{$wpdb->prefix}lmd_estimations` e ON a.estimation_id = e.id
         {$where}
         ORDER BY a.created_at DESC LIMIT {$per_page} OFFSET {$offset}",
        ...$vals
    ))
    : $wpdb->get_results(
        "SELECT a.*, e.nom as est_nom
         FROM `{$audit_table}` a
         LEFT JOIN `{$wpdb->prefix}lmd_estimations` e ON a.estimation_id = e.id
         {$where}
         ORDER BY a.created_at DESC LIMIT {$per_page} OFFSET {$offset}"
    );

$action_types = $wpdb->get_col("SELECT DISTINCT action FROM `{$audit_table}` ORDER BY action");
$users = $wpdb->get_col("SELECT DISTINCT user_login FROM `{$audit_table}` ORDER BY user_login");

$action_labels = [
    'status_change'        => '🔄 Changement statut',
    'archived'             => '🗃️ Archivé',
    'notes_saved'          => '📝 Notes sauvées',
    'second_opinion_saved' => '🟣 2ème avis sauvé',
    'interest_set'         => '🎯 Intérêt défini',
    'email_sent'           => '📧 Email envoyé',
    'delegated'            => '👥 Délégué',
    'sale_assigned'        => '🏷️ Vente assignée',
    'seller_assigned'      => '👤 Vendeur assigné',
    'deleted'              => '🗑️ Supprimé',
    'magic_link_sent'      => '🔗 Magic link envoyé',
    'ai_analysis'          => '🤖 Analyse IA',
];
?>
<h1 class="lmd-page-title">📜 Journal d'audit</h1>

<!-- Filters -->
<form method="get" class="lmd-filter-bar" style="margin-bottom:20px">
    <input type="hidden" name="page" value="lmd-audit">
    <select name="audit_action" class="lmd-sort-select" onchange="this.form.submit()">
        <option value="">Toutes les actions</option>
        <?php foreach ($action_types as $at) : ?>
            <option value="<?php echo esc_attr($at); ?>" <?php selected($filter_action, $at); ?>>
                <?php echo esc_html($action_labels[$at] ?? $at); ?>
            </option>
        <?php endforeach; ?>
    </select>
    <select name="audit_user" class="lmd-sort-select" onchange="this.form.submit()">
        <option value="">Tous les utilisateurs</option>
        <?php foreach ($users as $u) : ?>
            <option value="<?php echo esc_attr($u); ?>" <?php selected($filter_user, $u); ?>>
                <?php echo esc_html($u); ?>
            </option>
        <?php endforeach; ?>
    </select>
    <?php if ($filter_est_id) : ?>
        <span class="lmd-tag lmd-tag--info">Demande #<?php echo $filter_est_id; ?>
            <a href="<?php echo esc_url(remove_query_arg('audit_est')); ?>" style="margin-left:4px;color:inherit">✕</a>
        </span>
    <?php endif; ?>
</form>

<p class="lmd-results-count"><?php echo $total; ?> entrée(s)</p>

<?php if (!empty($logs)) : ?>
<table class="widefat striped" style="font-size:12px;border-radius:var(--lmd-radius,8px);overflow:hidden">
    <thead>
        <tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Demande</th><th>Détails</th></tr>
    </thead>
    <tbody>
    <?php foreach ($logs as $log) : ?>
    <tr>
        <td><?php echo esc_html(date_i18n('d/m/Y H:i:s', strtotime($log->created_at))); ?></td>
        <td><?php echo esc_html($log->user_login); ?></td>
        <td><?php echo $action_labels[$log->action] ?? esc_html($log->action); ?></td>
        <td>
            <?php if ($log->estimation_id) : ?>
                <a href="<?php echo esc_url(add_query_arg(['page'=>'lmd-estimations','view'=>'detail','est_id'=>$log->estimation_id], admin_url('admin.php'))); ?>">
                    <?php echo esc_html($log->est_nom ?: "#{$log->estimation_id}"); ?>
                </a>
            <?php else : ?>—<?php endif; ?>
        </td>
        <td><code><?php echo esc_html(mb_strimwidth($log->details ?? '', 0, 60, '…')); ?></code></td>
    </tr>
    <?php endforeach; ?>
    </tbody>
</table>

<!-- Pagination -->
<?php
$total_pages = ceil($total / $per_page);
if ($total_pages > 1) : ?>
<div class="tablenav" style="margin-top:12px">
    <div class="tablenav-pages">
        <?php for ($i = 1; $i <= $total_pages; $i++) : ?>
            <?php if ($i === $page_num) : ?>
                <span class="tablenav-pages-navspan button disabled"><?php echo $i; ?></span>
            <?php else : ?>
                <a href="<?php echo esc_url(add_query_arg('audit_page', $i)); ?>" class="button"><?php echo $i; ?></a>
            <?php endif; ?>
        <?php endfor; ?>
    </div>
</div>
<?php endif; ?>
<?php else : ?>
    <div class="lmd-empty">
        <span class="dashicons dashicons-book" style="font-size:48px;opacity:.15"></span>
        <p>Aucune entrée dans le journal</p>
    </div>
<?php endif; ?>
