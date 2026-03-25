<?php if ( ! defined( 'ABSPATH' ) ) exit;
$page_url = admin_url('admin.php?page=lmd-estimations');
$current_sort = $sort_by ?? 'created_at';
$current_dir  = $sort_dir ?? 'DESC';
$toggle_dir   = ($current_dir === 'DESC') ? 'ASC' : 'DESC';
$sort_labels  = [
    'created_at'     => 'Date',
    'nom'            => 'Nom',
    'status'         => 'Statut',
    'interest_level' => 'Intérêt',
];
$filters_config = [
    'all'       => ['label' => 'Toutes',     'count' => $counts['all']],
    'unread'    => ['label' => 'Non lues',   'count' => $counts['unread']],
    'pending'   => ['label' => 'En attente', 'count' => $counts['pending']],
    'overdue'   => ['label' => 'En retard',  'count' => $counts['overdue']],
    'responded' => ['label' => 'Répondu',    'count' => $counts['responded']],
    'archived'  => ['label' => 'Archivées',  'count' => $counts['archived'] ?? 0],
];
?>
<h1 class="lmd-page-title">Demandes d'estimation</h1>

<!-- Filter bar -->
<div class="lmd-filter-bar">
    <div class="lmd-filters">
        <?php foreach ($filters_config as $key => $cfg) : ?>
            <a href="<?php echo esc_url(add_query_arg(['filter' => $key, 's' => $search, 'sort' => $current_sort, 'dir' => $current_dir], $page_url)); ?>"
               class="lmd-filter-btn <?php echo $filter === $key ? 'is-active' : ''; ?>">
                <?php echo esc_html($cfg['label']); ?>
                <span class="lmd-filter-count"><?php echo $cfg['count']; ?></span>
            </a>
        <?php endforeach; ?>

        <span class="lmd-filter-sep"></span>

        <?php foreach (LMD_Estimation_Manager::INTEREST_LEVELS as $key => $cfg) : ?>
            <?php if (($interest_counts[$key] ?? 0) > 0) : ?>
            <a href="<?php echo esc_url(add_query_arg(['filter' => $key, 's' => $search, 'sort' => $current_sort, 'dir' => $current_dir], $page_url)); ?>"
               class="lmd-filter-btn lmd-filter-btn--interest <?php echo $filter === $key ? 'is-active' : ''; ?>"
               style="<?php echo $filter === $key ? "background:{$cfg['bg']};color:{$cfg['color']};border-color:{$cfg['border']}" : ''; ?>">
                <span class="lmd-interest-dot" style="background:<?php echo $cfg['dot']; ?>"></span>
                <?php echo esc_html($cfg['label']); ?>
                <span class="lmd-filter-count"><?php echo $interest_counts[$key]; ?></span>
            </a>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>

    <!-- Search -->
    <form method="get" action="<?php echo esc_url($page_url); ?>" class="lmd-search-inline">
        <input type="hidden" name="page" value="lmd-estimations">
        <input type="hidden" name="filter" value="<?php echo esc_attr($filter); ?>">
        <input type="hidden" name="sort" value="<?php echo esc_attr($current_sort); ?>">
        <input type="hidden" name="dir" value="<?php echo esc_attr($current_dir); ?>">
        <input type="search" name="s" value="<?php echo esc_attr($search); ?>" placeholder="Rechercher…" class="lmd-search-input">

        <!-- Sort -->
        <div class="lmd-sort-controls">
            <select name="sort" class="lmd-sort-select" onchange="this.form.submit()">
                <?php foreach ($sort_labels as $skey => $slabel) : ?>
                    <option value="<?php echo esc_attr($skey); ?>" <?php selected($current_sort, $skey); ?>><?php echo esc_html($slabel); ?></option>
                <?php endforeach; ?>
            </select>
            <a href="<?php echo esc_url(add_query_arg(['filter' => $filter, 's' => $search, 'sort' => $current_sort, 'dir' => $toggle_dir], $page_url)); ?>"
               class="lmd-sort-dir" title="<?php echo $current_dir === 'DESC' ? 'Plus ancien d\'abord' : 'Plus récent d\'abord'; ?>">
                <?php echo $current_dir === 'DESC' ? '↓' : '↑'; ?>
            </a>
        </div>
    </form>
</div>

<!-- Cards grid -->
<?php if (empty($estimations)) : ?>
    <div class="lmd-empty">
        <span class="dashicons dashicons-email-alt" style="font-size:48px;opacity:.15"></span>
        <p>Aucune demande trouvée</p>
    </div>
<?php else : ?>
<div class="lmd-cards-grid">
    <?php foreach ($estimations as $est) :
        $status         = $est->status;
        $name           = $est->nom;
        $description    = $est->description;
        $interest_level = $est->interest_level;
        $response_mode  = $est->response_mode;
        $delegate_to    = $est->delegate_to;
        $created_at     = $est->created_at;
        $source         = $est->source;
        $category       = $est->object_category ?? '';
        $est_id         = (int) ($est->id ?? 0);

        $is_responded = ($status === 'responded');
        // Resolve photos: handles URLs, attachment IDs, relative paths
        $photos = LMD_Estimation_Manager::resolve_photos( $est->photo_urls );
        $overdue_days = LMD_Estimation_Manager::get_overdue_days($created_at);
        $detail_url = add_query_arg(['page' => 'lmd-estimations', 'view' => 'detail', 'est_id' => $est_id], admin_url('admin.php'));
        $interest_cfg = LMD_Estimation_Manager::INTEREST_LEVELS[$interest_level] ?? null;
        $description_preview = $description !== '' ? mb_strimwidth($description, 0, 100, '…') : 'Sans description';
    ?>
    <a href="<?php echo esc_url($detail_url); ?>"
       class="lmd-est-card <?php echo $is_responded ? 'is-responded' : ($status === 'new' ? 'is-unread' : ''); ?>"
       <?php if ($interest_cfg) : ?>style="border-color:<?php echo $interest_cfg['border']; ?>"<?php endif; ?>>

        <div class="lmd-est-card__photo">
            <?php if (!empty($photos[0])) : ?>
                <img src="<?php echo esc_url($photos[0]); ?>" alt="<?php echo esc_attr($name); ?>">
                <?php if (count($photos) > 1) : ?>
                    <span class="lmd-est-card__photo-count"><?php echo count($photos); ?> 📷</span>
                <?php endif; ?>
            <?php else : ?>
                <span class="dashicons dashicons-format-image"></span>
            <?php endif; ?>
        </div>

        <div class="lmd-est-card__body">
            <div class="lmd-est-card__header">
                <strong class="lmd-est-card__name"><?php echo esc_html($name !== '' ? $name : 'Sans nom'); ?></strong>
                <?php if ($status === 'new') : ?>
                    <span class="lmd-unread-dot" title="Non lu"></span>
                <?php endif; ?>
            </div>
            <p class="lmd-est-card__desc"><?php echo esc_html($description_preview); ?></p>
            <div class="lmd-est-card__meta">
                <?php if ($is_responded) : ?>
                    <span class="lmd-tag lmd-tag--ok">✓ Répondu</span>
                <?php elseif ($status === 'archived') : ?>
                    <span class="lmd-tag" style="background:#f1f5f9;color:#64748b;border-color:#d1d5db">Archivée</span>
                <?php else : ?>
                    <span class="lmd-tag lmd-tag--pending">En attente</span>
                <?php endif; ?>
                <?php if ($overdue_days > 0 && !$is_responded) : ?>
                    <span class="lmd-tag lmd-tag--danger">+<?php echo $overdue_days; ?>j</span>
                <?php endif; ?>
                <?php echo LMD_Estimation_Manager::get_interest_badge($interest_level); ?>
                <?php if ($category !== '') : ?>
                    <span class="lmd-tag lmd-tag--category"><?php echo esc_html(ucfirst(str_replace('_',' ',$category))); ?></span>
                <?php endif; ?>
                <?php if ($response_mode === 'delegate' && $delegate_to !== '') : ?>
                    <span class="lmd-tag lmd-tag--info">→ <?php echo esc_html($delegate_to); ?></span>
                <?php endif; ?>
            </div>
            <div class="lmd-est-card__date">
                <?php echo $created_at ? esc_html(date_i18n('d M Y · H:i', strtotime($created_at))) : '—'; ?>
                <?php if ($source !== 'form' && $source !== '') : ?>
                    <span>· <span class="lmd-tag lmd-tag--source" style="font-size:9px;padding:1px 4px"><?php echo esc_html($source); ?></span></span>
                <?php endif; ?>
            </div>
        </div>
    </a>
    <?php endforeach; ?>
</div>
<?php endif; ?>
