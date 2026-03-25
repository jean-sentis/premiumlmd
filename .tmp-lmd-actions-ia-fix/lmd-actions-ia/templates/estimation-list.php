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
    'all'       => ['label' => 'Toutes',     'icon' => '📋', 'count' => $counts['all']],
    'unread'    => ['label' => 'Non lues',   'icon' => '🔵', 'count' => $counts['unread']],
    'pending'   => ['label' => 'En attente', 'icon' => '⏳', 'count' => $counts['pending']],
    'overdue'   => ['label' => 'En retard',  'icon' => '🔴', 'count' => $counts['overdue']],
    'responded' => ['label' => 'Répondu',    'icon' => '✅', 'count' => $counts['responded']],
    'archived'  => ['label' => 'Archivées',  'icon' => '🗃️', 'count' => $counts['archived'] ?? 0],
];
?>
<h1 class="lmd-page-title">📋 Demandes d'estimation</h1>

<!-- ═══ FILTER BAR ═══ -->
<div class="lmd-filter-bar">
    <div class="lmd-filters">
        <?php foreach ($filters_config as $key => $cfg) : ?>
            <a href="<?php echo esc_url(add_query_arg(['filter' => $key, 's' => $search, 'sort' => $current_sort, 'dir' => $current_dir], $page_url)); ?>"
               class="lmd-filter-btn <?php echo $filter === $key ? 'is-active' : ''; ?>">
                <?php echo $cfg['icon']; ?> <?php echo esc_html($cfg['label']); ?>
                <span class="lmd-filter-count"><?php echo $cfg['count']; ?></span>
            </a>
        <?php endforeach; ?>

        <?php if ( !empty($interest_counts) && array_sum($interest_counts) > 0 ) : ?>
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
        <?php endif; ?>
    </div>

    <!-- Search + Sort -->
    <form method="get" action="<?php echo esc_url($page_url); ?>" class="lmd-search-inline" id="lmd-sort-form">
        <input type="hidden" name="page" value="lmd-estimations">
        <input type="hidden" name="filter" value="<?php echo esc_attr($filter); ?>">
        <input type="search" name="s" value="<?php echo esc_attr($search); ?>" placeholder="Rechercher nom, email, description…" class="lmd-search-input">

        <!-- Sort controls -->
        <div class="lmd-sort-controls">
            <label class="lmd-sort-label">Tri :</label>
            <select name="sort" class="lmd-sort-select" onchange="document.getElementById('lmd-sort-form').submit()">
                <?php foreach ($sort_labels as $skey => $slabel) : ?>
                    <option value="<?php echo esc_attr($skey); ?>" <?php selected($current_sort, $skey); ?>><?php echo esc_html($slabel); ?></option>
                <?php endforeach; ?>
            </select>
            <input type="hidden" name="dir" value="<?php echo esc_attr($current_dir); ?>">
            <a href="<?php echo esc_url(add_query_arg(['filter' => $filter, 's' => $search, 'sort' => $current_sort, 'dir' => $toggle_dir], $page_url)); ?>"
               class="lmd-sort-dir" title="<?php echo $current_dir === 'DESC' ? 'Plus ancien d\'abord' : 'Plus récent d\'abord'; ?>">
                <?php echo $current_dir === 'DESC' ? '↓ Récent' : '↑ Ancien'; ?>
            </a>
        </div>
    </form>
</div>

<!-- ═══ CATEGORY FILTERS (if any) ═══ -->
<?php if ( !empty($category_counts) ) : ?>
<div class="lmd-category-bar">
    <?php foreach ($category_counts as $cat_key => $cat_count) :
        $cat_label = LMD_Estimation_Manager::OBJECT_CATEGORIES[$cat_key] ?? ucfirst(str_replace('_', ' ', $cat_key));
    ?>
        <span class="lmd-tag lmd-tag--category" style="cursor:default">
            <?php echo esc_html($cat_label); ?>
            <span class="lmd-filter-count"><?php echo $cat_count; ?></span>
        </span>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<!-- ═══ CARDS GRID ═══ -->
<?php if (empty($estimations)) : ?>
    <div class="lmd-empty">
        <span class="dashicons dashicons-email-alt" style="font-size:48px;opacity:.15"></span>
        <p>Aucune demande trouvée</p>
        <?php if ($search) : ?>
            <p class="description">Essayez un autre terme de recherche</p>
        <?php endif; ?>
    </div>
<?php else : ?>
    <p class="lmd-results-count"><?php echo count($estimations); ?> résultat(s)</p>
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
                <img src="<?php echo esc_url($photos[0]); ?>" alt="<?php echo esc_attr($name); ?>"
                     onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='block')">
                <span class="dashicons dashicons-format-image" style="display:none;font-size:32px;color:#cbd5e1"></span>
                <?php if (count($photos) > 1) : ?>
                    <span class="lmd-est-card__photo-count"><?php echo count($photos); ?> 📷</span>
                <?php endif; ?>
            <?php else : ?>
                <span class="dashicons dashicons-format-image" style="font-size:32px;color:#cbd5e1"></span>
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