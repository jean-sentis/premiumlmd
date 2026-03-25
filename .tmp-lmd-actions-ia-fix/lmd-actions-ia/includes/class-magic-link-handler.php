<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Handles the public-facing magic link page for external expert 2nd opinions.
 * Registers a shortcode [lmd_expert_opinion] and intercepts ?lmd_opinion=1&token=xxx URLs.
 */
class LMD_Magic_Link_Handler {
    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_shortcode('lmd_expert_opinion', [$this, 'render_shortcode']);
        add_action('template_redirect', [$this, 'intercept_magic_link']);
        add_action('wp_ajax_nopriv_lmd_submit_expert_opinion', [$this, 'handle_submit']);
        add_action('wp_ajax_lmd_submit_expert_opinion', [$this, 'handle_submit']);
    }

    /**
     * If ?lmd_opinion=1&token=xxx is accessed on any page, render the opinion form.
     */
    public function intercept_magic_link() {
        if ( !isset($_GET['lmd_opinion']) || !isset($_GET['token']) ) return;

        $token = sanitize_text_field($_GET['token']);
        $data = $this->validate_token($token);

        // Output a standalone page
        status_header(200);
        nocache_headers();

        wp_enqueue_style('lmd-estimation-form', LMD_PLUGIN_URL . 'assets/css/estimation-form.css', [], LMD_VERSION);

        echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
        echo '<title>Avis expert — ' . esc_html(get_bloginfo('name')) . '</title>';
        wp_head();
        echo '</head><body class="lmd-magic-link-body">';

        echo '<div class="lmd-magic-link-page">';
        echo '<div class="lmd-magic-link-container">';

        if (is_wp_error($data)) {
            echo '<div class="lmd-magic-link-error">';
            echo '<h1>🔒 Lien invalide</h1>';
            echo '<p>' . esc_html($data->get_error_message()) . '</p>';
            echo '</div>';
        } else {
            $this->render_opinion_form($data, $token);
        }

        echo '</div></div>';
        wp_footer();
        echo '</body></html>';
        exit;
    }

    /**
     * Validate a magic link token.
     * @return object|WP_Error The magic link row or error.
     */
    private function validate_token( string $token ) {
        global $wpdb;
        $link = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_magic_links WHERE token = %s LIMIT 1",
            $token
        ));

        if (!$link) {
            return new \WP_Error('invalid', 'Ce lien est invalide ou n\'existe pas.');
        }
        if ($link->is_used) {
            return new \WP_Error('used', 'Ce lien a déjà été utilisé. Merci pour votre avis !');
        }
        if (strtotime($link->expires_at) < time()) {
            return new \WP_Error('expired', 'Ce lien a expiré. Contactez le commissaire-priseur pour un nouveau lien.');
        }

        // Get estimation data
        $est = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d",
            $link->estimation_id
        ));
        if (!$est) {
            return new \WP_Error('not_found', 'La demande d\'estimation associée est introuvable.');
        }

        $link->estimation = $est;
        return $link;
    }

    /**
     * Render the opinion form for a valid magic link.
     */
    private function render_opinion_form( $data, string $token ) {
        $est = $data->estimation;
        $photos = LMD_Estimation_Manager::resolve_photos($est->photo_urls ?? '[]');
        $nom = trim($est->nom ?? '');
        $description = $est->description ?? '';
        $site_name = get_bloginfo('name') ?: 'Le Marteau Digital';
        ?>
        <div class="lmd-expert-header">
            <div class="lmd-expert-badge">🟣</div>
            <h1>Demande de 2ème avis</h1>
            <p class="lmd-expert-subtitle"><?php echo esc_html($site_name); ?></p>
        </div>

        <!-- Object info -->
        <div class="lmd-expert-object">
            <h2><?php echo esc_html($nom ?: 'Objet à expertiser'); ?></h2>
            <?php if ($description) : ?>
                <p class="lmd-expert-desc"><?php echo nl2br(esc_html(mb_strimwidth($description, 0, 500, '…'))); ?></p>
            <?php endif; ?>

            <?php if (!empty($photos)) : ?>
            <div class="lmd-expert-photos">
                <?php foreach (array_slice($photos, 0, 4) as $url) : ?>
                    <a href="<?php echo esc_url($url); ?>" target="_blank" class="lmd-expert-photo">
                        <img src="<?php echo esc_url($url); ?>" alt="Photo"
                             onerror="this.style.display='none'">
                    </a>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>

        <!-- AI analysis summary if available -->
        <?php
        $ai = json_decode($est->ai_analysis ?? '{}', true);
        if (!empty($ai['identified_object'])) :
        ?>
        <div class="lmd-expert-ai-summary">
            <h3>🟢 Analyse IA préliminaire</h3>
            <p><strong><?php echo esc_html($ai['identified_object']); ?></strong></p>
            <?php if (!empty($ai['estimated_range'])) : ?>
                <p>💰 Estimation IA : <?php echo esc_html($ai['estimated_range']); ?></p>
            <?php endif; ?>
            <?php if (!empty($ai['summary'])) : ?>
                <p style="font-size:13px;color:#64748b"><?php echo esc_html($ai['summary']); ?></p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Opinion form -->
        <form id="lmd-expert-form" class="lmd-expert-form">
            <input type="hidden" name="token" value="<?php echo esc_attr($token); ?>">

            <div class="lmd-expert-field">
                <label for="expert_name">Votre nom</label>
                <input type="text" id="expert_name" name="expert_name" placeholder="Dr. Martin, Expert en art moderne…" required>
            </div>

            <div class="lmd-expert-field">
                <label for="expert_opinion">Votre avis d'expert</label>
                <textarea id="expert_opinion" name="expert_opinion" rows="8"
                          placeholder="Votre analyse : identification, authenticité, état, estimation de valeur, recommandations…" required></textarea>
            </div>

            <div class="lmd-expert-field">
                <label for="expert_estimate">Estimation de valeur (optionnel)</label>
                <input type="text" id="expert_estimate" name="expert_estimate" placeholder="Ex: 500 – 800 €">
            </div>

            <div class="lmd-expert-actions">
                <button type="submit" class="lmd-expert-submit">📝 Envoyer mon avis</button>
            </div>

            <div id="lmd-expert-status" class="lmd-expert-status"></div>
        </form>

        <script>
        document.getElementById('lmd-expert-form').addEventListener('submit', function(e) {
            e.preventDefault();
            var form = this;
            var btn = form.querySelector('.lmd-expert-submit');
            var status = document.getElementById('lmd-expert-status');

            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours…';
            status.textContent = '';
            status.className = 'lmd-expert-status';

            var fd = new FormData(form);
            fd.append('action', 'lmd_submit_expert_opinion');
            fd.append('nonce', '<?php echo wp_create_nonce('lmd_expert_opinion_nonce'); ?>');

            fetch('<?php echo esc_url(admin_url('admin-ajax.php')); ?>', {
                method: 'POST',
                body: fd,
            })
            .then(function(r) { return r.json(); })
            .then(function(resp) {
                if (resp.success) {
                    form.style.display = 'none';
                    status.textContent = '✅ Merci ! Votre avis a bien été enregistré et transmis au commissaire-priseur.';
                    status.className = 'lmd-expert-status is-success';
                } else {
                    btn.disabled = false;
                    btn.textContent = '📝 Envoyer mon avis';
                    status.textContent = '❌ ' + (resp.data || 'Erreur lors de l\'envoi');
                    status.className = 'lmd-expert-status is-error';
                }
            })
            .catch(function() {
                btn.disabled = false;
                btn.textContent = '📝 Envoyer mon avis';
                status.textContent = '❌ Erreur réseau. Veuillez réessayer.';
                status.className = 'lmd-expert-status is-error';
            });
        });
        </script>
        <?php
    }

    /**
     * Handle expert opinion submission via AJAX.
     */
    public function handle_submit() {
        check_ajax_referer('lmd_expert_opinion_nonce', 'nonce');
        global $wpdb;

        $token   = sanitize_text_field($_POST['token'] ?? '');
        $name    = sanitize_text_field($_POST['expert_name'] ?? '');
        $opinion = sanitize_textarea_field($_POST['expert_opinion'] ?? '');
        $estimate= sanitize_text_field($_POST['expert_estimate'] ?? '');

        if (empty($token) || empty($opinion)) {
            wp_send_json_error('Tous les champs obligatoires doivent être remplis.');
        }

        $link = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_magic_links WHERE token = %s LIMIT 1",
            $token
        ));

        if (!$link) wp_send_json_error('Lien invalide.');
        if ($link->is_used) wp_send_json_error('Ce lien a déjà été utilisé.');
        if (strtotime($link->expires_at) < time()) wp_send_json_error('Ce lien a expiré.');

        // Format the opinion
        $formatted = "Expert : {$name}\n";
        $formatted .= "Date : " . current_time('d/m/Y à H:i') . "\n";
        if ($estimate) $formatted .= "Estimation : {$estimate}\n";
        $formatted .= "\n{$opinion}";

        // Save opinion to magic_links table
        $wpdb->update($wpdb->prefix . 'lmd_magic_links', [
            'opinion' => $formatted,
            'is_used' => 1,
            'used_at' => current_time('mysql'),
        ], ['id' => $link->id]);

        // Update estimation's second_opinion field (append if exists)
        $est = $wpdb->get_row($wpdb->prepare(
            "SELECT second_opinion FROM {$wpdb->prefix}lmd_estimations WHERE id = %d",
            $link->estimation_id
        ));

        $existing = trim($est->second_opinion ?? '');
        $new_opinion = ($existing ? $existing . "\n\n───────────────\n\n" : '') . $formatted;

        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'second_opinion' => $new_opinion,
        ], ['id' => $link->estimation_id]);

        // Notify admin by email
        $admin_email = get_option('admin_email');
        $est_full = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d",
            $link->estimation_id
        ));
        $admin_url = add_query_arg([
            'page'   => 'lmd-estimations',
            'view'   => 'detail',
            'est_id' => $link->estimation_id,
        ], admin_url('admin.php'));

        $site_name = get_bloginfo('name') ?: 'Le Marteau Digital';
        wp_mail($admin_email,
            "🟣 2ème avis reçu — " . ($est_full->nom ?? 'Sans nom') . " — {$site_name}",
            "Un expert externe ({$name}) a donné son avis.\n\n"
            . "Estimation : {$estimate}\n\n"
            . mb_strimwidth($opinion, 0, 500, '…')
            . "\n\nVoir la demande : {$admin_url}",
            ['Content-Type: text/plain; charset=UTF-8']
        );

        wp_send_json_success(['message' => 'Avis enregistré avec succès.']);
    }

    /**
     * Shortcode [lmd_expert_opinion] — alternative to URL interception.
     */
    public function render_shortcode($atts) {
        if (!isset($_GET['token'])) {
            return '<p>Aucun token fourni. Utilisez le lien reçu par email.</p>';
        }
        // The intercept_magic_link handles the rendering on template_redirect
        return '<p>Chargement…</p>';
    }
}
