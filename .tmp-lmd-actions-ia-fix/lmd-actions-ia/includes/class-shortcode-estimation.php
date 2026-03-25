<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Shortcode_Estimation {
    private static $instance = null;
    public static function instance() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }
    private function __construct() {
        add_shortcode('lmd_estimation_form', [$this, 'render']);
        add_action('wp_ajax_nopriv_lmd_submit_estimation', [$this, 'handle_submit']);
        add_action('wp_ajax_lmd_submit_estimation', [$this, 'handle_submit']);
    }

    public function render($atts) {
        wp_enqueue_style('lmd-estimation-form', LMD_PLUGIN_URL . 'assets/css/estimation-form.css', [], LMD_VERSION);
        wp_enqueue_script('lmd-estimation-form', LMD_PLUGIN_URL . 'assets/js/estimation-form.js', ['jquery'], LMD_VERSION, true);
        wp_localize_script('lmd-estimation-form', 'lmdEstForm', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('lmd_estimation_nonce'),
            'maxFiles'=> 5,
        ]);

        ob_start();
        include LMD_PLUGIN_DIR . 'templates/estimation-form-public.php';
        return ob_get_clean();
    }

    public function handle_submit() {
        check_ajax_referer('lmd_estimation_nonce', 'nonce');
        global $wpdb;

        $photo_urls = [];
        if (!empty($_FILES['photos'])) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
            foreach ($_FILES['photos']['name'] as $i => $name) {
                if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                $file = [
                    'name'     => $name,
                    'type'     => $_FILES['photos']['type'][$i],
                    'tmp_name' => $_FILES['photos']['tmp_name'][$i],
                    'error'    => $_FILES['photos']['error'][$i],
                    'size'     => $_FILES['photos']['size'][$i],
                ];
                $_FILES['upload_photo'] = $file;
                $attachment_id = media_handle_upload('upload_photo', 0);
                if (!is_wp_error($attachment_id)) {
                    $photo_urls[] = wp_get_attachment_url($attachment_id);
                }
            }
        }

        $wpdb->insert($wpdb->prefix . 'lmd_estimations', [
            'nom'             => sanitize_text_field($_POST['nom']),
            'email'           => sanitize_email($_POST['email']),
            'telephone'       => sanitize_text_field($_POST['telephone'] ?? ''),
            'description'     => sanitize_textarea_field($_POST['description']),
            'estimated_value' => sanitize_text_field($_POST['estimated_value'] ?? ''),
            'object_category' => sanitize_text_field($_POST['object_category'] ?? ''),
            'photo_urls'      => wp_json_encode($photo_urls),
            'source'          => 'form',
            'status'          => 'new',
        ]);

        wp_send_json_success(['message' => 'Votre demande a bien été envoyée. Nous vous répondrons dans les meilleurs délais.']);
    }
}
