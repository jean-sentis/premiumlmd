<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Ajax_Handler {
    private static $instance = null;
    public static function instance() {
        if ( null === self::$instance ) self::$instance = new self();
        return self::$instance;
    }
    private function __construct() {
        $actions = [
            'lmd_update_status', 'lmd_archive', 'lmd_save_notes',
            'lmd_save_second_opinion', 'lmd_set_interest',
            'lmd_send_response', 'lmd_delegate', 'lmd_run_ai',
            'lmd_assign_sale', 'lmd_assign_seller',
            'lmd_bulk_delete', 'lmd_send_magic_link',
        ];
        foreach ($actions as $action) {
            add_action("wp_ajax_{$action}", [$this, $action]);
        }
    }

    private function verify() {
        check_ajax_referer('lmd_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Non autorisé');
    }

    public function lmd_update_status() {
        $this->verify();
        global $wpdb;
        $id     = absint($_POST['id']);
        $status = sanitize_text_field($_POST['status']);
        $data = ['status' => $status];
        if ($status === 'responded') $data['responded_at'] = current_time('mysql');
        $wpdb->update($wpdb->prefix . 'lmd_estimations', $data, ['id' => $id]);
        wp_send_json_success();
    }

    public function lmd_archive() {
        $this->verify();
        global $wpdb;
        $wpdb->update($wpdb->prefix . 'lmd_estimations', ['status' => 'archived'], ['id' => absint($_POST['id'])]);
        wp_send_json_success();
    }

    public function lmd_save_notes() {
        $this->verify();
        global $wpdb;
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'auctioneer_notes' => sanitize_textarea_field($_POST['notes']),
        ], ['id' => absint($_POST['id'])]);
        wp_send_json_success();
    }

    public function lmd_save_second_opinion() {
        $this->verify();
        global $wpdb;
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'second_opinion' => sanitize_textarea_field($_POST['opinion']),
        ], ['id' => absint($_POST['id'])]);
        wp_send_json_success();
    }

    public function lmd_set_interest() {
        $this->verify();
        global $wpdb;
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'interest_level' => sanitize_text_field($_POST['level']),
            'decided_at'     => current_time('mysql'),
        ], ['id' => absint($_POST['id'])]);
        wp_send_json_success();
    }

    public function lmd_send_response() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'response_message' => sanitize_textarea_field($_POST['message']),
            'interest_level'   => sanitize_text_field($_POST['interest'] ?? ''),
            'response_mode'    => 'email',
            'status'           => 'responded',
            'responded_at'     => current_time('mysql'),
        ], ['id' => $id]);
        wp_send_json_success(['message' => 'Réponse enregistrée']);
    }

    public function lmd_delegate() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $delegate = sanitize_text_field($_POST['delegate_to']);
        $est = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id));

        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'delegate_to'   => $delegate,
            'response_mode' => 'delegate',
            'status'        => 'in_review',
        ], ['id' => $id]);

        $nom = is_object($est) && property_exists($est, 'nom') && $est->nom !== null ? (string) $est->nom : 'Sans nom';
        $email = is_object($est) && property_exists($est, 'email') && $est->email !== null ? (string) $est->email : '';
        $telephone = is_object($est) && property_exists($est, 'telephone') && $est->telephone !== null ? (string) $est->telephone : '';
        $description = is_object($est) && property_exists($est, 'description') && $est->description !== null ? (string) $est->description : '';

        $subject = "Demande d'estimation à examiner — " . $nom;
        $body = "Bonjour,\n\nJe vous transfère cette demande d'estimation pour avis.\n\n";
        $body .= "De : {$nom}" . ($email !== '' ? " ({$email})" : '') . "\n";
        if ($telephone !== '') $body .= "Tél : {$telephone}\n";
        $body .= "Description : " . mb_substr($description, 0, 300) . "\n\n";
        $body .= "Merci de me faire part de votre analyse.\n\nCordialement";

        wp_send_json_success([
            'mailto' => 'mailto:?subject=' . rawurlencode($subject) . '&body=' . rawurlencode($body),
        ]);
    }

    /* ── Assign sale ── */
    public function lmd_assign_sale() {
        $this->verify();
        global $wpdb;
        $id      = absint($_POST['id']);
        $sale_id = absint($_POST['sale_id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'sale_id' => $sale_id > 0 ? $sale_id : null,
        ], ['id' => $id]);
        wp_send_json_success();
    }

    /* ── Assign seller ── */
    public function lmd_assign_seller() {
        $this->verify();
        global $wpdb;
        $id        = absint($_POST['id']);
        $seller_id = absint($_POST['seller_id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'seller_id' => $seller_id > 0 ? $seller_id : null,
        ], ['id' => $id]);
        wp_send_json_success();
    }

    /* ══════════════════════════════════════════════ */
    /* BULK DELETE                                      */
    /* ══════════════════════════════════════════════ */
    public function lmd_bulk_delete() {
        $this->verify();
        global $wpdb;
        $ids = isset($_POST['ids']) ? array_map('absint', (array) $_POST['ids']) : [];
        if (empty($ids)) wp_send_json_error('Aucune demande sélectionnée');

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->prefix}lmd_estimations WHERE id IN ({$placeholders})",
            ...$ids
        ));
        wp_send_json_success(['deleted' => count($ids)]);
    }

    /* ══════════════════════════════════════════════ */
    /* MAGIC LINK — 2nd opinion                        */
    /* ══════════════════════════════════════════════ */
    public function lmd_send_magic_link() {
        $this->verify();
        global $wpdb;
        $id    = absint($_POST['id']);
        $email = sanitize_email($_POST['email']);
        if (!is_email($email)) wp_send_json_error('Email invalide');

        $est = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id));
        if (!$est) wp_send_json_error('Demande introuvable');

        // Generate a unique token
        $token = wp_generate_password(32, false);
        $expiry = date('Y-m-d H:i:s', strtotime('+7 days'));

        // Store the magic link token
        $wpdb->replace($wpdb->prefix . 'lmd_magic_links', [
            'estimation_id' => $id,
            'token'         => $token,
            'email'         => $email,
            'expires_at'    => $expiry,
            'created_at'    => current_time('mysql'),
        ]);

        // Update estimation with magic link info
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'magic_link_email'   => $email,
            'magic_link_sent_at' => current_time('mysql'),
        ], ['id' => $id]);

        // Build the magic link URL
        $magic_url = add_query_arg([
            'lmd_opinion' => 1,
            'token'       => $token,
        ], home_url('/'));

        // Prepare photos for the email
        $photos = LMD_Estimation_Manager::resolve_photos($est->photo_urls);
        $photo_html = '';
        if (!empty($photos)) {
            $photo_html = '<div style="margin:16px 0">';
            foreach (array_slice($photos, 0, 3) as $url) {
                $photo_html .= '<img src="' . esc_url($url) . '" style="max-width:200px;max-height:150px;margin:4px;border-radius:6px;border:1px solid #e2e8f0" />';
            }
            $photo_html .= '</div>';
        }

        $nom = $est->nom ?: 'Sans nom';
        $description = mb_strimwidth($est->description ?: '', 0, 300, '…');

        // Send the email
        $subject = "Demande d'avis expert — " . $nom . ' — Le Marteau Digital';
        $body = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="text-align:center;padding:20px;background:#faf5ff;border-radius:8px;margin-bottom:20px">
                <h1 style="color:#7c3aed;font-size:22px;margin:0">🟣 Demande de 2ème avis</h1>
                <p style="color:#64748b;font-size:14px;margin:8px 0 0">Le Marteau Digital</p>
            </div>

            <p>Bonjour,</p>
            <p>Nous sollicitons votre expertise pour l\'objet suivant :</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #7c3aed;border-radius:6px;padding:16px;margin:16px 0">
                <p style="margin:0 0 4px"><strong>' . esc_html($nom) . '</strong></p>
                <p style="margin:0;color:#64748b;font-size:13px">' . esc_html($description) . '</p>
            </div>

            ' . $photo_html . '

            <div style="text-align:center;margin:24px 0">
                <a href="' . esc_url($magic_url) . '"
                   style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px">
                    📝 Donner mon avis
                </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center">
                Ce lien est valable 7 jours et à usage unique.<br>
                En cliquant, vous accéderez à un formulaire sécurisé pour donner votre avis.
            </p>
        </div>';

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        $sent = wp_mail($email, $subject, $body, $headers);

        if (!$sent) {
            wp_send_json_error('Erreur lors de l\'envoi de l\'email');
        }

        wp_send_json_success(['email' => $email, 'expires' => $expiry]);
    }

    /* ── AI Analysis ── */
    public function lmd_run_ai() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $depth = sanitize_text_field($_POST['depth'] ?? 'full');
        $est = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id));
        if (!$est) wp_send_json_error('Demande introuvable');

        // Step 1: Triage
        $triage = LMD_AI_Connector::triage((array)$est);
        if (isset($triage['error'])) wp_send_json_error($triage['error']);

        $analysis = $triage;

        // Step 2: Google Lens (if photos)
        $photos = json_decode($est->photo_urls ?: '[]', true);
        $lens = [];
        if (!empty($photos[0]) && filter_var($photos[0], FILTER_VALIDATE_URL)) {
            $lens = LMD_AI_Connector::google_lens($photos[0]);
            if (!isset($lens['error'])) {
                $analysis['lens_detection'] = $lens;
            }
        }

        // Step 3: Firecrawl (depth = full only)
        $scraped = [];
        if ($depth === 'full' && !empty($lens['visualMatches'])) {
            $blocked = ['drouot.com','invaluable.com','artprice.com','instagram.com','facebook.com','twitter.com'];
            $urls_to_scrape = [];
            foreach (array_slice($lens['visualMatches'], 0, 5) as $match) {
                $host = parse_url($match['link'], PHP_URL_HOST) ?: '';
                $dominated = false;
                foreach ($blocked as $b) { if (stripos($host, $b) !== false) { $dominated = true; break; } }
                if (!$dominated) $urls_to_scrape[] = $match['link'];
            }
            foreach (array_slice($urls_to_scrape, 0, 3) as $url) {
                $result = LMD_AI_Connector::scrape_url($url);
                if (!isset($result['error'])) {
                    $scraped[] = [
                        'url' => $url,
                        'content' => mb_substr($result['data']['markdown'] ?? '', 0, 2000),
                    ];
                }
            }
            if (!empty($scraped)) {
                $analysis['scraped_results_count'] = count($scraped);
                $analysis['web_sources'] = array_map(function($s) {
                    return ['url' => $s['url'], 'title' => mb_substr($s['content'], 0, 80)];
                }, $scraped);
            }
        }

        // Step 4: Synthesis via Gemini Pro
        if (!empty($lens['visualMatches']) || !empty($scraped)) {
            $synth = LMD_AI_Connector::synthesize($triage, $lens, $scraped);
            if (!isset($synth['error'])) {
                $analysis['market_insights'] = ($analysis['market_insights'] ?? '') . "\n\n" . $synth['synthesis'];
            }
        }

        // Save
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'ai_analysis'    => wp_json_encode($analysis, JSON_UNESCAPED_UNICODE),
            'ai_analyzed_at' => current_time('mysql'),
            'interest_level' => $analysis['recommendation'] ?? $est->interest_level,
        ], ['id' => $id]);

        LMD_AI_Connector::log_usage('full_analysis', 'lovable_ai', 'gemini-flash+pro', 0, 0, 0.08, $id);

        wp_send_json_success($analysis);
    }
}
