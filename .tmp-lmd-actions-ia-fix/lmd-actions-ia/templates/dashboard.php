<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$t = $wpdb->prefix . 'lmd_estimations';
$total     = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status != 'archived'");
$unread    = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status = 'new'");
$overdue   = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)");
$ai_calls  = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}lmd_ai_usage WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
?>
<div class="wrap lmd-wrap">
    <div class="lmd-dashboard-header">
        <h1><span class="dashicons dashicons-superhero-alt"></span> LMD Actions I.A.</h1>
        <p class="lmd-subtitle">Plateforme de services intelligents pour commissaires-priseurs</p>
    </div>
    <hr class="lmd-hr-gold">
    <div class="lmd-stats-grid">
        <div class="lmd-stat-card">
            <div class="lmd-stat-number"><?php echo $total; ?></div>
            <div class="lmd-stat-label">DEMANDES TOTALES</div>
        </div>
        <div class="lmd-stat-card">
            <div class="lmd-stat-number lmd-stat--blue"><?php echo $unread; ?></div>
            <div class="lmd-stat-label">NON LUES</div>
        </div>
        <div class="lmd-stat-card">
            <div class="lmd-stat-number lmd-stat--red"><?php echo $overdue; ?></div>
            <div class="lmd-stat-label">EN RETARD (&gt;48H)</div>
        </div>
        <div class="lmd-stat-card">
            <div class="lmd-stat-number"><?php echo $ai_calls; ?></div>
            <div class="lmd-stat-label">APPELS IA CE MOIS</div>
        </div>
    </div>

    <div class="lmd-quick-actions" style="margin-top:30px">
        <a href="<?php echo admin_url('admin.php?page=lmd-estimations'); ?>" class="button button-primary button-hero">
            📋 Gérer les estimations
        </a>
        <a href="<?php echo admin_url('admin.php?page=lmd-settings'); ?>" class="button button-secondary button-hero" style="margin-left:10px">
            ⚙️ Réglages
        </a>
    </div>
</div>
