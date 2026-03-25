<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Admin_Menu {
    private static $instance = null;
    private $hook_suffixes = [];

    public static function instance() {
        if ( null === self::$instance ) self::$instance = new self();
        return self::$instance;
    }
    private function __construct() {
        add_action( 'admin_menu',            [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    public function register_menus() {
        $parent_slug = 'lmd-actions-ia';

        // Get badge count for new estimations
        $new_count = LMD_Notifications::get_new_count();
        $badge = $new_count > 0
            ? ' <span class="update-plugins count-' . $new_count . '"><span class="plugin-count">' . $new_count . '</span></span>'
            : '';
        $est_badge = $badge; // same badge for estimations submenu

        $this->hook_suffixes[] = add_menu_page(
            'LMD Actions I.A.', 'Actions I.A.' . $badge, 'manage_options',
            $parent_slug, [ $this, 'render_dashboard' ],
            'dashicons-superhero-alt', 26
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Tableau de bord', '📊 Tableau de bord',
            'manage_options', $parent_slug, [ $this, 'render_dashboard' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, "Aide à l'estimation", "📋 Aide à l'estimation" . $est_badge,
            'manage_options', 'lmd-estimations',
            [ LMD_Estimation_Manager::instance(), 'render_page' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Ventes', '🏷️ Ventes',
            'manage_options', 'lmd-sales',
            [ $this, 'render_sales' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Vendeurs', '👤 Vendeurs',
            'manage_options', 'lmd-sellers',
            [ $this, 'render_sellers' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Crédits IA', '🤖 Crédits IA',
            'manage_options', 'lmd-credits',
            [ $this, 'render_credits' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Journal', '📜 Journal',
            'manage_options', 'lmd-audit',
            [ $this, 'render_audit' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Réglages', '⚙️ Réglages',
            'manage_options', 'lmd-settings', [ $this, 'render_settings' ]
        );
    }

    public function enqueue_assets( $hook ) {
        $is_our_page = in_array( $hook, $this->hook_suffixes, true );
        if ( ! $is_our_page ) {
            $is_our_page = (
                strpos( $hook, 'lmd-actions-ia' ) !== false ||
                strpos( $hook, 'lmd-estimations' ) !== false ||
                strpos( $hook, 'lmd-sales' ) !== false ||
                strpos( $hook, 'lmd-sellers' ) !== false ||
                strpos( $hook, 'lmd-settings' ) !== false ||
                strpos( $hook, 'lmd-credits' ) !== false ||
                strpos( $hook, 'lmd-audit' ) !== false ||
                strpos( $hook, 'lmd_' ) !== false ||
                strpos( $hook, 'actions-i-a' ) !== false
            );
        }
        if ( ! $is_our_page && isset( $_GET['page'] ) ) {
            $page = sanitize_text_field( $_GET['page'] );
            $is_our_page = in_array( $page, [
                'lmd-actions-ia', 'lmd-estimations', 'lmd-sales', 'lmd-sellers',
                'lmd-settings', 'lmd-credits', 'lmd-audit'
            ], true );
        }
        if ( ! $is_our_page ) return;

        wp_enqueue_style( 'lmd-admin-css', LMD_PLUGIN_URL . 'assets/css/admin.css', [], LMD_VERSION . '.' . time() );
        wp_enqueue_script( 'lmd-admin-js', LMD_PLUGIN_URL . 'assets/js/admin.js', [ 'jquery' ], LMD_VERSION . '.' . time(), true );
        wp_localize_script( 'lmd-admin-js', 'lmdAdmin', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'lmd_nonce' ),
        ]);

        if ( isset( $_GET['view'] ) && $_GET['view'] === 'detail' ) {
            wp_enqueue_media();
        }
    }

    public function render_dashboard() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/dashboard.php';
        echo '</div>';
    }
    public function render_settings() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/settings.php';
        echo '</div>';
    }
    public function render_sales() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/sales.php';
        echo '</div>';
    }
    public function render_sellers() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/sellers.php';
        echo '</div>';
    }
    public function render_credits() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/credits.php';
        echo '</div>';
    }
    public function render_audit() {
        echo '<div class="wrap lmd-wrap">';
        include LMD_PLUGIN_DIR . 'templates/audit.php';
        echo '</div>';
    }
}
