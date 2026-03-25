<?php if ( ! defined( 'ABSPATH' ) ) exit;
global $wpdb;
$sales_table = $wpdb->prefix . 'lmd_sales';
$est_table   = $wpdb->prefix . 'lmd_estimations';

// Handle form submissions
if ( $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['lmd_sale_action']) ) {
    check_admin_referer('lmd_sale_nonce');
    $action = sanitize_text_field($_POST['lmd_sale_action']);

    if ( $action === 'create' || $action === 'update' ) {
        $data = [
            'title'       => sanitize_text_field($_POST['title'] ?? ''),
            'sale_date'   => sanitize_text_field($_POST['sale_date'] ?? '') ?: null,
            'location'    => sanitize_text_field($_POST['location'] ?? ''),
            'specialty'   => sanitize_text_field($_POST['specialty'] ?? ''),
            'description' => sanitize_textarea_field($_POST['description'] ?? ''),
            'status'      => sanitize_text_field($_POST['status'] ?? 'planned'),
        ];
        if ( $action === 'create' ) {
            $wpdb->insert( $sales_table, $data );
            echo '<div class="notice notice-success"><p>Vente créée ✓</p></div>';
        } else {
            $wpdb->update( $sales_table, $data, ['id' => absint($_POST['sale_id'])] );
            echo '<div class="notice notice-success"><p>Vente mise à jour ✓</p></div>';
        }
    } elseif ( $action === 'delete' ) {
        $wpdb->delete( $sales_table, ['id' => absint($_POST['sale_id'])] );
        // Unlink estimations
        $wpdb->query( $wpdb->prepare("UPDATE `{$est_table}` SET sale_id = NULL WHERE sale_id = %d", absint($_POST['sale_id'])) );
        echo '<div class="notice notice-success"><p>Vente supprimée ✓</p></div>';
    }
}

// Fetch sales with estimation counts
$sales = $wpdb->get_results("
    SELECT s.*, COUNT(e.id) as est_count
    FROM `{$sales_table}` s
    LEFT JOIN `{$est_table}` e ON e.sale_id = s.id
    GROUP BY s.id
    ORDER BY s.sale_date DESC, s.created_at DESC
");

$editing = null;
if ( isset($_GET['edit_sale']) ) {
    $editing = $wpdb->get_row( $wpdb->prepare("SELECT * FROM `{$sales_table}` WHERE id = %d", absint($_GET['edit_sale'])) );
}

$status_labels = [
    'planned'   => ['label' => 'Planifiée', 'icon' => '📅'],
    'open'      => ['label' => 'Ouverte', 'icon' => '🟢'],
    'closed'    => ['label' => 'Clôturée', 'icon' => '🔒'],
    'completed' => ['label' => 'Terminée', 'icon' => '✅'],
];
?>

<h1 class="lmd-page-title">🏷️ Ventes</h1>

<!-- ═══ CREATE / EDIT FORM ═══ -->
<div class="lmd-settings-card" style="margin-bottom:24px">
    <h2><?php echo $editing ? 'Modifier la vente' : 'Créer une vente'; ?></h2>
    <form method="post">
        <?php wp_nonce_field('lmd_sale_nonce'); ?>
        <input type="hidden" name="lmd_sale_action" value="<?php echo $editing ? 'update' : 'create'; ?>">
        <?php if ($editing) : ?>
            <input type="hidden" name="sale_id" value="<?php echo (int)$editing->id; ?>">
        <?php endif; ?>
        <table class="form-table">
            <tr>
                <th>Titre *</th>
                <td><input type="text" name="title" value="<?php echo esc_attr($editing->title ?? ''); ?>" class="regular-text" required></td>
            </tr>
            <tr>
                <th>Date de vente</th>
                <td><input type="datetime-local" name="sale_date" value="<?php echo $editing && $editing->sale_date ? esc_attr(date('Y-m-d\TH:i', strtotime($editing->sale_date))) : ''; ?>" class="regular-text"></td>
            </tr>
            <tr>
                <th>Lieu</th>
                <td><input type="text" name="location" value="<?php echo esc_attr($editing->location ?? ''); ?>" class="regular-text" placeholder="Ex: Salle des ventes, Bordeaux"></td>
            </tr>
            <tr>
                <th>Spécialité</th>
                <td><input type="text" name="specialty" value="<?php echo esc_attr($editing->specialty ?? ''); ?>" class="regular-text" placeholder="Ex: Art moderne, Bijoux"></td>
            </tr>
            <tr>
                <th>Statut</th>
                <td>
                    <select name="status">
                        <?php foreach ($status_labels as $skey => $scfg) : ?>
                            <option value="<?php echo esc_attr($skey); ?>" <?php selected($editing->status ?? 'planned', $skey); ?>><?php echo $scfg['icon'] . ' ' . esc_html($scfg['label']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th>Description</th>
                <td><textarea name="description" rows="3" class="large-text"><?php echo esc_textarea($editing->description ?? ''); ?></textarea></td>
            </tr>
        </table>
        <?php submit_button( $editing ? 'Mettre à jour' : 'Créer la vente' ); ?>
        <?php if ($editing) : ?>
            <a href="<?php echo esc_url(admin_url('admin.php?page=lmd-sales')); ?>" class="button">Annuler</a>
        <?php endif; ?>
    </form>
</div>

<!-- ═══ SALES LIST ═══ -->
<?php if (empty($sales)) : ?>
    <div class="lmd-empty">
        <span class="dashicons dashicons-calendar-alt" style="font-size:48px;opacity:.15"></span>
        <p>Aucune vente créée</p>
    </div>
<?php else : ?>
    <table class="widefat striped" style="border-radius:var(--lmd-radius,8px);overflow:hidden">
        <thead>
            <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Lieu</th>
                <th>Spécialité</th>
                <th>Statut</th>
                <th>Estimations</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($sales as $sale) :
            $st = $status_labels[$sale->status] ?? $status_labels['planned'];
        ?>
            <tr>
                <td><strong><?php echo esc_html($sale->title); ?></strong></td>
                <td><?php echo $sale->sale_date ? esc_html(date_i18n('d M Y · H:i', strtotime($sale->sale_date))) : '—'; ?></td>
                <td><?php echo esc_html($sale->location ?: '—'); ?></td>
                <td><?php echo esc_html($sale->specialty ?: '—'); ?></td>
                <td><?php echo $st['icon'] . ' ' . esc_html($st['label']); ?></td>
                <td>
                    <?php if ($sale->est_count > 0) : ?>
                        <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-estimations', 'filter_sale' => $sale->id], admin_url('admin.php'))); ?>">
                            <?php echo (int)$sale->est_count; ?> demande(s)
                        </a>
                    <?php else : ?>
                        0
                    <?php endif; ?>
                </td>
                <td>
                    <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-sales', 'edit_sale' => $sale->id], admin_url('admin.php'))); ?>" class="button button-small">✏️</a>
                    <form method="post" style="display:inline">
                        <?php wp_nonce_field('lmd_sale_nonce'); ?>
                        <input type="hidden" name="lmd_sale_action" value="delete">
                        <input type="hidden" name="sale_id" value="<?php echo (int)$sale->id; ?>">
                        <button type="submit" class="button button-small" onclick="return confirm('Supprimer cette vente ?')" style="color:#dc2626">🗑️</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
