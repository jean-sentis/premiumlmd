<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$sellers_table = $wpdb->prefix . 'lmd_sellers';
$est_table     = $wpdb->prefix . 'lmd_estimations';

// Handle form submissions
if ( $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['lmd_seller_action']) ) {
    check_admin_referer('lmd_seller_nonce');
    $action = sanitize_text_field($_POST['lmd_seller_action']);

    if ( $action === 'create' || $action === 'update' ) {
        $data = [
            'nom'       => sanitize_text_field($_POST['nom'] ?? ''),
            'email'     => sanitize_email($_POST['email'] ?? ''),
            'telephone' => sanitize_text_field($_POST['telephone'] ?? ''),
            'address'   => sanitize_textarea_field($_POST['address'] ?? ''),
            'city'      => sanitize_text_field($_POST['city'] ?? ''),
            'notes'     => sanitize_textarea_field($_POST['notes'] ?? ''),
        ];
        if ( $action === 'create' ) {
            $wpdb->insert( $sellers_table, $data );
            echo '<div class="notice notice-success"><p>Vendeur créé ✓</p></div>';
        } else {
            $wpdb->update( $sellers_table, $data, ['id' => absint($_POST['seller_id'])] );
            echo '<div class="notice notice-success"><p>Vendeur mis à jour ✓</p></div>';
        }
    } elseif ( $action === 'delete' ) {
        $wpdb->delete( $sellers_table, ['id' => absint($_POST['seller_id'])] );
        $wpdb->query( $wpdb->prepare("UPDATE `{$est_table}` SET seller_id = NULL WHERE seller_id = %d", absint($_POST['seller_id'])) );
        echo '<div class="notice notice-success"><p>Vendeur supprimé ✓</p></div>';
    }
}

// Search
$search = sanitize_text_field($_GET['s'] ?? '');
$where = '';
if ($search) {
    $like = '%' . $wpdb->esc_like($search) . '%';
    $where = $wpdb->prepare("WHERE s.nom LIKE %s OR s.email LIKE %s OR s.telephone LIKE %s OR s.city LIKE %s", $like, $like, $like, $like);
}

$sellers = $wpdb->get_results("
    SELECT s.*, COUNT(e.id) as est_count
    FROM `{$sellers_table}` s
    LEFT JOIN `{$est_table}` e ON e.seller_id = s.id
    {$where}
    GROUP BY s.id
    ORDER BY s.nom ASC
    LIMIT 200
");

$editing = null;
if ( isset($_GET['edit_seller']) ) {
    $editing = $wpdb->get_row( $wpdb->prepare("SELECT * FROM `{$sellers_table}` WHERE id = %d", absint($_GET['edit_seller'])) );
}

// Auto-create sellers from estimations that don't have a seller_id
if ( isset($_GET['auto_link']) && $_GET['auto_link'] === '1' ) {
    check_admin_referer('lmd_auto_link');
    $orphans = $wpdb->get_results("SELECT DISTINCT email, nom, telephone FROM `{$est_table}` WHERE seller_id IS NULL AND email != '' GROUP BY email");
    $linked = 0;
    foreach ($orphans as $o) {
        // Check if seller already exists
        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM `{$sellers_table}` WHERE email = %s LIMIT 1", $o->email));
        if (!$existing) {
            $wpdb->insert($sellers_table, ['nom' => $o->nom, 'email' => $o->email, 'telephone' => $o->telephone ?: '']);
            $existing = $wpdb->insert_id;
        }
        // Link estimations
        $wpdb->query($wpdb->prepare("UPDATE `{$est_table}` SET seller_id = %d WHERE email = %s AND seller_id IS NULL", $existing, $o->email));
        $linked++;
    }
    echo '<div class="notice notice-success"><p>' . $linked . ' vendeur(s) liés automatiquement ✓</p></div>';
    // Refresh sellers list
    $sellers = $wpdb->get_results("
        SELECT s.*, COUNT(e.id) as est_count
        FROM `{$sellers_table}` s
        LEFT JOIN `{$est_table}` e ON e.seller_id = s.id
        GROUP BY s.id
        ORDER BY s.nom ASC
        LIMIT 200
    ");
}
$orphan_count = (int) $wpdb->get_var("SELECT COUNT(DISTINCT email) FROM `{$est_table}` WHERE seller_id IS NULL AND email != ''");
?>

<h1 class="lmd-page-title">👤 Vendeurs</h1>

<!-- Search -->
<form method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>" class="lmd-filter-bar" style="margin-bottom:20px">
    <input type="hidden" name="page" value="lmd-sellers">
    <input type="search" name="s" value="<?php echo esc_attr($search); ?>" placeholder="Rechercher par nom, email, téléphone, ville…" class="lmd-search-input" style="width:300px">
    <button type="submit" class="button">🔍 Rechercher</button>
    <?php if ($orphan_count > 0) : ?>
        <a href="<?php echo esc_url(wp_nonce_url(add_query_arg(['page' => 'lmd-sellers', 'auto_link' => '1'], admin_url('admin.php')), 'lmd_auto_link')); ?>"
           class="button button-secondary" onclick="return confirm('Créer automatiquement les vendeurs à partir des emails des estimations existantes ?')"
           title="<?php echo $orphan_count; ?> estimation(s) sans vendeur lié">
            🔗 Lier <?php echo $orphan_count; ?> estimation(s) orpheline(s)
        </a>
    <?php endif; ?>
</form>

<!-- ═══ CREATE / EDIT FORM ═══ -->
<div class="lmd-settings-card" style="margin-bottom:24px">
    <h2><?php echo $editing ? 'Modifier le vendeur' : 'Ajouter un vendeur'; ?></h2>
    <form method="post">
        <?php wp_nonce_field('lmd_seller_nonce'); ?>
        <input type="hidden" name="lmd_seller_action" value="<?php echo $editing ? 'update' : 'create'; ?>">
        <?php if ($editing) : ?>
            <input type="hidden" name="seller_id" value="<?php echo (int)$editing->id; ?>">
        <?php endif; ?>
        <table class="form-table">
            <tr>
                <th>Nom *</th>
                <td><input type="text" name="nom" value="<?php echo esc_attr($editing->nom ?? ''); ?>" class="regular-text" required></td>
            </tr>
            <tr>
                <th>Email</th>
                <td><input type="email" name="email" value="<?php echo esc_attr($editing->email ?? ''); ?>" class="regular-text"></td>
            </tr>
            <tr>
                <th>Téléphone</th>
                <td><input type="tel" name="telephone" value="<?php echo esc_attr($editing->telephone ?? ''); ?>" class="regular-text"></td>
            </tr>
            <tr>
                <th>Adresse</th>
                <td><textarea name="address" rows="2" class="large-text"><?php echo esc_textarea($editing->address ?? ''); ?></textarea></td>
            </tr>
            <tr>
                <th>Ville</th>
                <td><input type="text" name="city" value="<?php echo esc_attr($editing->city ?? ''); ?>" class="regular-text"></td>
            </tr>
            <tr>
                <th>Notes</th>
                <td><textarea name="notes" rows="3" class="large-text" placeholder="Notes internes sur ce vendeur…"><?php echo esc_textarea($editing->notes ?? ''); ?></textarea></td>
            </tr>
        </table>
        <?php submit_button( $editing ? 'Mettre à jour' : 'Ajouter le vendeur' ); ?>
        <?php if ($editing) : ?>
            <a href="<?php echo esc_url(admin_url('admin.php?page=lmd-sellers')); ?>" class="button">Annuler</a>
        <?php endif; ?>
    </form>
</div>

<!-- ═══ SELLERS LIST ═══ -->
<p class="lmd-results-count"><?php echo count($sellers); ?> vendeur(s)</p>
<?php if (empty($sellers)) : ?>
    <div class="lmd-empty">
        <span class="dashicons dashicons-admin-users" style="font-size:48px;opacity:.15"></span>
        <p>Aucun vendeur trouvé</p>
    </div>
<?php else : ?>
    <table class="widefat striped" style="border-radius:var(--lmd-radius,8px);overflow:hidden">
        <thead>
            <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>Estimations</th>
                <th>Créé le</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($sellers as $seller) : ?>
            <tr>
                <td><strong><?php echo esc_html($seller->nom ?: '—'); ?></strong></td>
                <td>
                    <?php if ($seller->email) : ?>
                        <a href="mailto:<?php echo esc_attr($seller->email); ?>"><?php echo esc_html($seller->email); ?></a>
                    <?php else : ?>
                        —
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html($seller->telephone ?: '—'); ?></td>
                <td><?php echo esc_html($seller->city ?: '—'); ?></td>
                <td>
                    <?php if ($seller->est_count > 0) : ?>
                        <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-estimations', 'filter_seller' => $seller->id], admin_url('admin.php'))); ?>">
                            <?php echo (int)$seller->est_count; ?> demande(s)
                        </a>
                    <?php else : ?>
                        0
                    <?php endif; ?>
                </td>
                <td><?php echo $seller->created_at ? esc_html(date_i18n('d/m/Y', strtotime($seller->created_at))) : '—'; ?></td>
                <td>
                    <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-sellers', 'edit_seller' => $seller->id], admin_url('admin.php'))); ?>" class="button button-small">✏️</a>
                    <form method="post" style="display:inline">
                        <?php wp_nonce_field('lmd_seller_nonce'); ?>
                        <input type="hidden" name="lmd_seller_action" value="delete">
                        <input type="hidden" name="seller_id" value="<?php echo (int)$seller->id; ?>">
                        <button type="submit" class="button button-small" onclick="return confirm('Supprimer ce vendeur ?')" style="color:#dc2626">🗑️</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
