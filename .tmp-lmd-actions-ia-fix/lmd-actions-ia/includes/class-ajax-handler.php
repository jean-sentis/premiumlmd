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
            'lmd_export_csv', 'lmd_search_similar',
        ];
        foreach ($actions as $action) {
            add_action("wp_ajax_{$action}", [$this, $action]);
        }
    }

    private function verify() {
        check_ajax_referer('lmd_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Non autorisé');
    }

    private function log_audit( int $est_id, string $action, string $details = '' ) {
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'lmd_audit_log', [
            'estimation_id' => $est_id,
            'user_login'    => wp_get_current_user()->user_login,
            'action'        => $action,
            'details'       => $details,
        ]);
    }

    public function lmd_update_status() {
        $this->verify();
        global $wpdb;
        $id     = absint($_POST['id']);
        $status = sanitize_text_field($_POST['status']);
        $data = ['status' => $status];
        if ($status === 'responded') $data['responded_at'] = current_time('mysql');
        $wpdb->update($wpdb->prefix . 'lmd_estimations', $data, ['id' => $id]);
        $this->log_audit($id, 'status_change', $status);
        wp_send_json_success();
    }

    public function lmd_archive() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', ['status' => 'archived'], ['id' => $id]);
        $this->log_audit($id, 'archived');
        wp_send_json_success();
    }

    public function lmd_save_notes() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'auctioneer_notes' => sanitize_textarea_field($_POST['notes']),
        ], ['id' => $id]);
        $this->log_audit($id, 'notes_saved');
        wp_send_json_success();
    }

    public function lmd_save_second_opinion() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'second_opinion' => sanitize_textarea_field($_POST['opinion']),
        ], ['id' => $id]);
        $this->log_audit($id, 'second_opinion_saved');
        wp_send_json_success();
    }

    public function lmd_set_interest() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $level = sanitize_text_field($_POST['level']);
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'interest_level' => $level,
            'decided_at'     => current_time('mysql'),
        ], ['id' => $id]);
        $this->log_audit($id, 'interest_set', $level);
        wp_send_json_success();
    }

    /* ══════════════════════════════════════════════ */
    /* SEND RESPONSE — with REAL wp_mail()             */
    /* ══════════════════════════════════════════════ */
    public function lmd_send_response() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $message = sanitize_textarea_field($_POST['message']);
        $interest = sanitize_text_field($_POST['interest'] ?? '');

        $est = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id
        ));
        if (!$est) wp_send_json_error('Demande introuvable');

        $email_to = $est->email ?? '';
        if (empty($email_to) || !is_email($email_to)) {
            wp_send_json_error('Adresse email du vendeur invalide ou absente');
        }

        // Save to DB
        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'response_message' => $message,
            'interest_level'   => $interest,
            'response_mode'    => 'email',
            'status'           => 'responded',
            'responded_at'     => current_time('mysql'),
        ], ['id' => $id]);

        // Build and send real email
        $nom = trim((string)($est->nom ?? ''));
        $site_name = get_bloginfo('name') ?: 'Le Marteau Digital';
        $subject = "Votre demande d'estimation — {$site_name}";

        $html_body = self::build_response_email_html($nom, $message, $site_name);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $site_name . ' <' . get_option('admin_email') . '>',
        ];

        $sent = wp_mail($email_to, $subject, $html_body, $headers);

        $this->log_audit($id, 'email_sent', $sent ? "to:{$email_to}" : "FAILED:{$email_to}");

        if (!$sent) {
            wp_send_json_success([
                'message'   => 'Réponse enregistrée mais l\'email n\'a pas pu être envoyé.',
                'email_sent'=> false,
            ]);
        }

        wp_send_json_success([
            'message'    => "Réponse envoyée à {$email_to}",
            'email_sent' => true,
        ]);
    }

    private static function build_response_email_html( string $nom, string $message, string $site_name ): string {
        $safe_nom = esc_html($nom ?: 'Madame, Monsieur');
        $safe_msg = nl2br(esc_html($message));
        return '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="text-align:center;padding:16px;background:#1e3a5f;border-radius:8px 8px 0 0">
                <h1 style="color:#fff;font-size:20px;margin:0">⚖️ ' . esc_html($site_name) . '</h1>
            </div>
            <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                <p>Bonjour ' . $safe_nom . ',</p>
                <div style="background:#f8fafc;border-left:4px solid #1e3a5f;padding:16px;border-radius:4px;margin:16px 0">
                    ' . $safe_msg . '
                </div>
                <p style="font-size:12px;color:#94a3b8;margin-top:24px;text-align:center">
                    Cet email a été envoyé par ' . esc_html($site_name) . '.<br>
                    Ne répondez pas directement à cet email.
                </p>
            </div>
        </div>';
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

        $this->log_audit($id, 'delegated', $delegate);

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
        $this->log_audit($id, 'sale_assigned', "sale_id:{$sale_id}");
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
        $this->log_audit($id, 'seller_assigned', "seller_id:{$seller_id}");
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
        foreach ($ids as $del_id) {
            $this->log_audit($del_id, 'deleted');
        }
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

        $token = wp_generate_password(32, false);
        $expiry = date('Y-m-d H:i:s', strtotime('+7 days'));

        $wpdb->replace($wpdb->prefix . 'lmd_magic_links', [
            'estimation_id' => $id,
            'token'         => $token,
            'email'         => $email,
            'expires_at'    => $expiry,
            'created_at'    => current_time('mysql'),
        ]);

        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'magic_link_email'   => $email,
            'magic_link_sent_at' => current_time('mysql'),
        ], ['id' => $id]);

        $magic_url = add_query_arg([
            'lmd_opinion' => 1,
            'token'       => $token,
        ], home_url('/'));

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
        $site_name = get_bloginfo('name') ?: 'Le Marteau Digital';

        $subject = "Demande d'avis expert — " . $nom . ' — ' . $site_name;
        $body = '
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="text-align:center;padding:20px;background:#faf5ff;border-radius:8px;margin-bottom:20px">
                <h1 style="color:#7c3aed;font-size:22px;margin:0">🟣 Demande de 2ème avis</h1>
                <p style="color:#64748b;font-size:14px;margin:8px 0 0">' . esc_html($site_name) . '</p>
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

        $this->log_audit($id, 'magic_link_sent', $sent ? "to:{$email}" : "FAILED:{$email}");

        if (!$sent) {
            wp_send_json_error('Erreur lors de l\'envoi de l\'email');
        }

        wp_send_json_success(['email' => $email, 'expires' => $expiry]);
    }

    /* ══════════════════════════════════════════════ */
    /* EXPORT CSV                                       */
    /* ══════════════════════════════════════════════ */
    public function lmd_export_csv() {
        $this->verify();
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';

        $filter = sanitize_text_field($_POST['filter'] ?? 'all');
        $where = "WHERE 1=1";
        switch ($filter) {
            case 'unread':    $where .= " AND status = 'new'"; break;
            case 'pending':   $where .= " AND status NOT IN ('responded','archived')"; break;
            case 'responded': $where .= " AND status = 'responded'"; break;
            case 'archived':  $where .= " AND status = 'archived'"; break;
            default:          $where .= " AND status != 'archived'"; break;
        }

        $rows = $wpdb->get_results("SELECT * FROM `{$table}` {$where} ORDER BY created_at DESC LIMIT 1000", ARRAY_A);

        $headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Description', 'Catégorie', 'Source',
                     'Statut', 'Intérêt', 'Estimation vendeur', 'Mode réponse', 'Délégué à',
                     'Vente ID', 'Vendeur ID', 'Analysé IA', 'Créé le', 'Répondu le'];

        $csv_lines = [];
        $csv_lines[] = implode(';', $headers);

        foreach ($rows as $r) {
            $csv_lines[] = implode(';', array_map(function($v) {
                $v = str_replace(["\r\n", "\n", "\r"], ' ', (string)$v);
                $v = str_replace('"', '""', $v);
                return '"' . $v . '"';
            }, [
                $r['id'] ?? '', $r['nom'] ?? '', $r['email'] ?? '', $r['telephone'] ?? '',
                mb_strimwidth($r['description'] ?? '', 0, 200, '…'), $r['object_category'] ?? '',
                $r['source'] ?? '', $r['status'] ?? '', $r['interest_level'] ?? '',
                $r['estimated_value'] ?? '', $r['response_mode'] ?? '', $r['delegate_to'] ?? '',
                $r['sale_id'] ?? '', $r['seller_id'] ?? '',
                $r['ai_analyzed_at'] ? 'Oui' : 'Non',
                $r['created_at'] ?? '', $r['responded_at'] ?? '',
            ]));
        }

        wp_send_json_success([
            'csv'      => implode("\n", $csv_lines),
            'filename' => 'estimations-' . date('Y-m-d') . '.csv',
            'count'    => count($rows),
        ]);
    }

    /* ══════════════════════════════════════════════ */
    /* SEARCH SIMILAR                                   */
    /* ══════════════════════════════════════════════ */
    public function lmd_search_similar() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $est = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id
        ));
        if (!$est) wp_send_json_error('Demande introuvable');

        $results = [];

        // Search by category
        if (!empty($est->object_category)) {
            $cat_matches = $wpdb->get_results($wpdb->prepare(
                "SELECT id, nom, description, interest_level, estimated_value, created_at
                 FROM {$wpdb->prefix}lmd_estimations
                 WHERE object_category = %s AND id != %d AND status != 'archived'
                 ORDER BY created_at DESC LIMIT 5",
                $est->object_category, $id
            ));
            foreach ($cat_matches as $m) {
                $results[] = [
                    'id'          => $m->id,
                    'nom'         => $m->nom,
                    'description' => mb_strimwidth($m->description ?? '', 0, 80, '…'),
                    'interest'    => $m->interest_level,
                    'value'       => $m->estimated_value,
                    'date'        => $m->created_at,
                    'match_type'  => 'category',
                ];
            }
        }

        // Search by keywords in description
        if (!empty($est->description)) {
            $words = array_filter(explode(' ', $est->description), function($w) {
                return mb_strlen($w) >= 4;
            });
            $words = array_slice($words, 0, 5);
            $existing_ids = array_column($results, 'id');
            $existing_ids[] = $id;

            foreach ($words as $word) {
                $like = '%' . $wpdb->esc_like($word) . '%';
                $kw_matches = $wpdb->get_results($wpdb->prepare(
                    "SELECT id, nom, description, interest_level, estimated_value, created_at
                     FROM {$wpdb->prefix}lmd_estimations
                     WHERE description LIKE %s AND id NOT IN (" . implode(',', array_map('intval', $existing_ids)) . ")
                       AND status != 'archived'
                     ORDER BY created_at DESC LIMIT 3",
                    $like
                ));
                foreach ($kw_matches as $m) {
                    if (in_array($m->id, $existing_ids)) continue;
                    $existing_ids[] = $m->id;
                    $results[] = [
                        'id'          => $m->id,
                        'nom'         => $m->nom,
                        'description' => mb_strimwidth($m->description ?? '', 0, 80, '…'),
                        'interest'    => $m->interest_level,
                        'value'       => $m->estimated_value,
                        'date'        => $m->created_at,
                        'match_type'  => 'keyword',
                        'keyword'     => $word,
                    ];
                }
                if (count($results) >= 10) break;
            }
        }

        wp_send_json_success(['results' => array_slice($results, 0, 10)]);
    }

    /* ── AI Analysis ── */
    public function lmd_run_ai() {
        $this->verify();
        global $wpdb;
        $id = absint($_POST['id']);
        $depth = sanitize_text_field($_POST['depth'] ?? 'full');
        $est = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}lmd_estimations WHERE id = %d", $id));
        if (!$est) wp_send_json_error('Demande introuvable');

        $triage = LMD_AI_Connector::triage((array)$est);
        if (isset($triage['error'])) wp_send_json_error($triage['error']);

        $analysis = $triage;

        $photos = json_decode($est->photo_urls ?: '[]', true);
        $lens = [];
        if (!empty($photos[0]) && filter_var($photos[0], FILTER_VALIDATE_URL)) {
            $lens = LMD_AI_Connector::google_lens($photos[0]);
            if (!isset($lens['error'])) {
                $analysis['lens_detection'] = $lens;
            }
        }

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

        if (!empty($lens['visualMatches']) || !empty($scraped)) {
            $synth = LMD_AI_Connector::synthesize($triage, $lens, $scraped);
            if (!isset($synth['error'])) {
                $analysis['market_insights'] = ($analysis['market_insights'] ?? '') . "\n\n" . $synth['synthesis'];
            }
        }

        $wpdb->update($wpdb->prefix . 'lmd_estimations', [
            'ai_analysis'    => wp_json_encode($analysis, JSON_UNESCAPED_UNICODE),
            'ai_analyzed_at' => current_time('mysql'),
            'interest_level' => $analysis['recommendation'] ?? $est->interest_level,
        ], ['id' => $id]);

        LMD_AI_Connector::log_usage('full_analysis', 'lovable_ai', 'gemini-flash+pro', 0, 0, 0.08, $id);
        $this->log_audit($id, 'ai_analysis', $depth);

        wp_send_json_success($analysis);
    }
}
