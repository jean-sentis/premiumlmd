<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$use = $wpdb->prefix . 'lmd_ai_usage';

// Monthly summary
$monthly = $wpdb->get_results("
    SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
           COUNT(*) as calls,
           COALESCE(SUM(tokens_in),0) as tok_in,
           COALESCE(SUM(tokens_out),0) as tok_out,
           COALESCE(SUM(cost_eur),0) as cost,
           COALESCE(SUM(billed_eur),0) as billed
    FROM `{$use}`
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
");

// Current month
$current_month = date('Y-m');
$month_calls = 0;
$month_cost = 0;
$month_billed = 0;
foreach ($monthly as $m) {
    if ($m->month === $current_month) {
        $month_calls = (int)$m->calls;
        $month_cost = (float)$m->cost;
        $month_billed = (float)$m->billed;
        break;
    }
}

// By action type
$by_action = $wpdb->get_results("
    SELECT action_type, COUNT(*) as cnt, COALESCE(SUM(cost_eur),0) as cost, COALESCE(SUM(billed_eur),0) as billed
    FROM `{$use}`
    WHERE DATE_FORMAT(created_at, '%Y-%m') = '{$current_month}'
    GROUP BY action_type
    ORDER BY cnt DESC
");

// Recent usage (last 50)
$recent = $wpdb->get_results("
    SELECT u.*, e.nom as est_nom
    FROM `{$use}` u
    LEFT JOIN `{$wpdb->prefix}lmd_estimations` e ON u.ref_id = e.id
    ORDER BY u.created_at DESC
    LIMIT 50
");

// Threshold alert
$monthly_limit = (int) get_option('lmd_monthly_ai_limit', 100);
$usage_percent = $monthly_limit > 0 ? round(($month_calls / $monthly_limit) * 100) : 0;
$is_warning = $usage_percent >= 80;
$is_critical = $usage_percent >= 95;
?>

<h1 class="lmd-page-title">🤖 Crédits & Consommation IA</h1>

<!-- ═══ ALERT BANNER ═══ -->
<?php if ($is_critical) : ?>
<div class="notice notice-error" style="border-left-color:#dc2626">
    <p>⚠️ <strong>Quota critique !</strong> Vous avez utilisé <?php echo $month_calls; ?>/<?php echo $monthly_limit; ?> appels IA ce mois (<?php echo $usage_percent; ?>%).</p>
</div>
<?php elseif ($is_warning) : ?>
<div class="notice notice-warning">
    <p>⚡ <strong>Attention :</strong> Vous avez utilisé <?php echo $usage_percent; ?>% de votre quota mensuel (<?php echo $month_calls; ?>/<?php echo $monthly_limit; ?>).</p>
</div>
<?php endif; ?>

<!-- ═══ KPI CARDS ═══ -->
<div class="lmd-stats-grid">
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo $month_calls; ?></div>
        <div class="lmd-stat-label">APPELS CE MOIS</div>
        <?php if ($monthly_limit > 0) : ?>
        <div class="lmd-progress-bar">
            <div class="lmd-progress-fill <?php echo $is_critical ? 'is-critical' : ($is_warning ? 'is-warning' : ''); ?>"
                 style="width:<?php echo min(100, $usage_percent); ?>%"></div>
        </div>
        <div class="lmd-stat-sub"><?php echo $usage_percent; ?>% de <?php echo $monthly_limit; ?></div>
        <?php endif; ?>
    </div>
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo number_format($month_cost, 3); ?>€</div>
        <div class="lmd-stat-label">COÛT RÉEL</div>
    </div>
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo number_format($month_billed, 2); ?>€</div>
        <div class="lmd-stat-label">FACTURÉ CLIENT</div>
    </div>
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo $month_billed > 0 ? number_format($month_billed - $month_cost, 2) : '0.00'; ?>€</div>
        <div class="lmd-stat-label">MARGE</div>
    </div>
</div>

<!-- Quota setting -->
<div class="lmd-settings-card" style="margin:20px 0">
    <form method="post">
        <?php wp_nonce_field('lmd_credits_settings'); ?>
        <label style="font-weight:600">Limite mensuelle :</label>
        <input type="number" name="lmd_monthly_ai_limit" value="<?php echo esc_attr($monthly_limit); ?>" min="0" style="width:80px;margin:0 8px">
        appels/mois (0 = illimité)
        <button type="submit" class="button" name="save_limit" value="1" style="margin-left:8px">💾 Enregistrer</button>
    </form>
    <?php
    if (isset($_POST['save_limit']) && check_admin_referer('lmd_credits_settings')) {
        update_option('lmd_monthly_ai_limit', absint($_POST['lmd_monthly_ai_limit']));
        echo '<div class="notice notice-success inline" style="margin-top:8px"><p>Limite enregistrée ✓</p></div>';
    }
    ?>
</div>

<!-- ═══ BY ACTION TYPE ═══ -->
<?php if (!empty($by_action)) : ?>
<div class="lmd-settings-card" style="margin-bottom:20px">
    <h2>📊 Répartition ce mois</h2>
    <table class="widefat striped">
        <thead><tr><th>Action</th><th>Appels</th><th>Coût réel</th><th>Facturé</th></tr></thead>
        <tbody>
        <?php foreach ($by_action as $a) : ?>
        <tr>
            <td><code><?php echo esc_html($a->action_type); ?></code></td>
            <td><?php echo (int)$a->cnt; ?></td>
            <td><?php echo number_format((float)$a->cost, 4); ?>€</td>
            <td><?php echo number_format((float)$a->billed, 2); ?>€</td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php endif; ?>

<!-- ═══ MONTHLY HISTORY ═══ -->
<?php if (!empty($monthly)) : ?>
<div class="lmd-settings-card" style="margin-bottom:20px">
    <h2>📅 Historique mensuel</h2>
    <table class="widefat striped">
        <thead><tr><th>Mois</th><th>Appels</th><th>Tokens IN</th><th>Tokens OUT</th><th>Coût réel</th><th>Facturé</th><th>Marge</th></tr></thead>
        <tbody>
        <?php foreach ($monthly as $m) : ?>
        <tr>
            <td><strong><?php echo esc_html($m->month); ?></strong></td>
            <td><?php echo (int)$m->calls; ?></td>
            <td><?php echo number_format((int)$m->tok_in); ?></td>
            <td><?php echo number_format((int)$m->tok_out); ?></td>
            <td><?php echo number_format((float)$m->cost, 4); ?>€</td>
            <td><?php echo number_format((float)$m->billed, 2); ?>€</td>
            <td><?php echo number_format((float)$m->billed - (float)$m->cost, 2); ?>€</td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php endif; ?>

<!-- ═══ RECENT USAGE ═══ -->
<?php if (!empty($recent)) : ?>
<div class="lmd-settings-card">
    <h2>🕐 Derniers appels</h2>
    <table class="widefat striped" style="font-size:12px">
        <thead><tr><th>Date</th><th>Action</th><th>Modèle</th><th>Demande</th><th>Coût</th></tr></thead>
        <tbody>
        <?php foreach ($recent as $r) : ?>
        <tr>
            <td><?php echo esc_html(date_i18n('d/m H:i', strtotime($r->created_at))); ?></td>
            <td><code><?php echo esc_html($r->action_type); ?></code></td>
            <td><?php echo esc_html($r->model); ?></td>
            <td>
                <?php if ($r->ref_id) : ?>
                    <a href="<?php echo esc_url(add_query_arg(['page'=>'lmd-estimations','view'=>'detail','est_id'=>$r->ref_id], admin_url('admin.php'))); ?>">
                        <?php echo esc_html($r->est_nom ?: "#{$r->ref_id}"); ?>
                    </a>
                <?php else : ?>—<?php endif; ?>
            </td>
            <td><?php echo number_format((float)$r->billed_eur, 3); ?>€</td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php endif; ?>
