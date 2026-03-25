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

        // Return mailto data for the front-end to open
        $subject = "Demande d'estimation à examiner — " . $est->nom;
        $body = "Bonjour,\n\nJe vous transfère cette demande d'estimation pour avis.\n\n";
        $body .= "De : {$est->nom} ({$est->email})\n";
        if ($est->telephone) $body .= "Tél : {$est->telephone}\n";
        $body .= "Description : " . mb_substr($est->description, 0, 300) . "\n\n";
        $body .= "Merci de me faire part de votre analyse.\n\nCordialement";

        wp_send_json_success([
            'mailto' => 'mailto:?subject=' . rawurlencode($subject) . '&body=' . rawurlencode($body),
        ]);
    }

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
