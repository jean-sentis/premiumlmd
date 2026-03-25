<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$t   = $wpdb->prefix . 'lmd_estimations';
$use = $wpdb->prefix . 'lmd_ai_usage';

$total     = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status != 'archived'");
$unread    = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status = 'new'");
$pending   = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status NOT IN ('responded','archived')");
$responded = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status = 'responded'");
$overdue   = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)");
$ai_month  = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$use} WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
$cost_month= (float) $wpdb->get_var("SELECT COALESCE(SUM(billed_eur),0) FROM {$use} WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");

// Conversion rate
$total_ever = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t}");
$responded_ever = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t} WHERE status = 'responded'");
$conversion = $total_ever > 0 ? round(($responded_ever / $total_ever) * 100) : 0;

// Average response time (hours)
$avg_hours = $wpdb->get_var("SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, responded_at)) FROM {$t} WHERE responded_at IS NOT NULL AND responded_at > created_at");
$avg_hours = $avg_hours ? round((float)$avg_hours) : '—';

// Weekly activity (last 8 weeks)
$weekly = $wpdb->get_results("
    SELECT YEARWEEK(created_at,1) as yw, COUNT(*) as cnt
    FROM {$t}
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
    GROUP BY YEARWEEK(created_at,1)
    ORDER BY yw ASC
");
$weekly_labels = [];
$weekly_data = [];
foreach ($weekly as $w) {
    $year = substr($w->yw, 0, 4);
    $week = substr($w->yw, 4);
    $weekly_labels[] = "S{$week}";
    $weekly_data[] = (int)$w->cnt;
}

// Category distribution
$categories = $wpdb->get_results("
    SELECT object_category, COUNT(*) as cnt
    FROM {$t}
    WHERE status != 'archived' AND object_category IS NOT NULL AND object_category != ''
    GROUP BY object_category
    ORDER BY cnt DESC
    LIMIT 10
");

// Interest distribution
$interests = $wpdb->get_results("
    SELECT interest_level, COUNT(*) as cnt
    FROM {$t}
    WHERE status != 'archived' AND interest_level IS NOT NULL AND interest_level != ''
    GROUP BY interest_level
    ORDER BY cnt DESC
");

// Source distribution
$sources = $wpdb->get_results("
    SELECT source, COUNT(*) as cnt
    FROM {$t}
    WHERE status != 'archived'
    GROUP BY source
    ORDER BY cnt DESC
");
?>
<div class="lmd-dashboard-header">
    <h1><span class="dashicons dashicons-superhero-alt"></span> LMD Actions I.A.</h1>
    <p class="lmd-subtitle">Plateforme de services intelligents pour commissaires-priseurs</p>
    <span class="lmd-version-badge">v<?php echo LMD_VERSION; ?></span>
</div>
<hr class="lmd-hr-gold">

<!-- ═══ KPI CARDS ═══ -->
<div class="lmd-stats-grid lmd-stats-grid--6">
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
        <div class="lmd-stat-number lmd-stat--green"><?php echo $responded; ?></div>
        <div class="lmd-stat-label">RÉPONDUES</div>
    </div>
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo $conversion; ?>%</div>
        <div class="lmd-stat-label">TAUX CONVERSION</div>
    </div>
    <div class="lmd-stat-card">
        <div class="lmd-stat-number"><?php echo $avg_hours; ?>h</div>
        <div class="lmd-stat-label">TEMPS MOYEN RÉPONSE</div>
    </div>
</div>

<!-- ═══ CHARTS ROW ═══ -->
<div class="lmd-dashboard-charts">
    <!-- Weekly Activity -->
    <div class="lmd-chart-card">
        <h3>📈 Activité hebdomadaire</h3>
        <div class="lmd-bar-chart">
            <?php
            $max_val = max(array_merge($weekly_data, [1]));
            foreach ($weekly_data as $i => $val) :
                $height = round(($val / $max_val) * 120);
            ?>
            <div class="lmd-bar-col">
                <span class="lmd-bar-val"><?php echo $val; ?></span>
                <div class="lmd-bar" style="height:<?php echo $height; ?>px"></div>
                <span class="lmd-bar-label"><?php echo $weekly_labels[$i]; ?></span>
            </div>
            <?php endforeach; ?>
            <?php if (empty($weekly_data)) : ?>
                <p class="description">Pas encore de données</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- Category Distribution -->
    <div class="lmd-chart-card">
        <h3>📊 Répartition par catégorie</h3>
        <?php if (!empty($categories)) : ?>
        <div class="lmd-horiz-chart">
            <?php
            $cat_max = max(array_column((array)$categories, 'cnt')) ?: 1;
            foreach ($categories as $c) :
                $cat_label = LMD_Estimation_Manager::OBJECT_CATEGORIES[$c->object_category] ?? ucfirst(str_replace('_', ' ', $c->object_category));
                $width = round(($c->cnt / $cat_max) * 100);
            ?>
            <div class="lmd-horiz-row">
                <span class="lmd-horiz-label"><?php echo esc_html($cat_label); ?></span>
                <div class="lmd-horiz-bar-bg">
                    <div class="lmd-horiz-bar" style="width:<?php echo $width; ?>%"></div>
                </div>
                <span class="lmd-horiz-val"><?php echo $c->cnt; ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else : ?>
            <p class="description">Aucune catégorie renseignée</p>
        <?php endif; ?>
    </div>

    <!-- Interest Distribution -->
    <div class="lmd-chart-card">
        <h3>🎯 Répartition par intérêt</h3>
        <?php if (!empty($interests)) : ?>
        <div class="lmd-interest-chart">
            <?php foreach ($interests as $int) :
                $cfg = LMD_Estimation_Manager::INTEREST_LEVELS[$int->interest_level] ?? null;
                if (!$cfg) continue;
            ?>
            <div class="lmd-interest-row">
                <span class="lmd-interest-dot" style="background:<?php echo $cfg['dot']; ?>"></span>
                <span class="lmd-interest-label"><?php echo esc_html($cfg['label']); ?></span>
                <span class="lmd-interest-val"><?php echo $int->cnt; ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else : ?>
            <p class="description">Aucun niveau d'intérêt attribué</p>
        <?php endif; ?>
    </div>
</div>

<!-- ═══ AI + SOURCE ROW ═══ -->
<div class="lmd-dashboard-charts">
    <div class="lmd-chart-card">
        <h3>🤖 IA ce mois</h3>
        <div class="lmd-ai-stats">
            <div class="lmd-ai-stat">
                <span class="lmd-ai-stat-num"><?php echo $ai_month; ?></span>
                <span class="lmd-ai-stat-label">Analyses</span>
            </div>
            <div class="lmd-ai-stat">
                <span class="lmd-ai-stat-num"><?php echo number_format($cost_month, 2); ?>€</span>
                <span class="lmd-ai-stat-label">Coût facturé</span>
            </div>
        </div>
    </div>
    <div class="lmd-chart-card">
        <h3>📥 Sources des demandes</h3>
        <?php if (!empty($sources)) : ?>
        <div class="lmd-source-list">
            <?php foreach ($sources as $src) : ?>
            <div class="lmd-source-row">
                <span class="lmd-tag lmd-tag--source"><?php echo esc_html($src->source ?: 'form'); ?></span>
                <span class="lmd-source-val"><?php echo $src->cnt; ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<div class="lmd-quick-actions" style="margin-top:30px">
    <a href="<?php echo admin_url('admin.php?page=lmd-estimations'); ?>" class="button button-primary button-hero">
        📋 Gérer les estimations <?php if ($unread > 0) echo '<span class="lmd-btn-badge">' . $unread . '</span>'; ?>
    </a>
    <a href="<?php echo admin_url('admin.php?page=lmd-credits'); ?>" class="button button-secondary button-hero" style="margin-left:10px">
        🤖 Crédits IA
    </a>
    <a href="<?php echo admin_url('admin.php?page=lmd-settings'); ?>" class="button button-secondary button-hero" style="margin-left:10px">
        ⚙️ Réglages
    </a>
</div>
