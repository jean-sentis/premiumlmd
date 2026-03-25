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

        $this->hook_suffixes[] = add_menu_page(
            'LMD Actions I.A.', 'Actions I.A.', 'manage_options',
            $parent_slug, [ $this, 'render_dashboard' ],
            'dashicons-superhero-alt', 26
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, 'Tableau de bord', 'Tableau de bord',
            'manage_options', $parent_slug, [ $this, 'render_dashboard' ]
        );
        $this->hook_suffixes[] = add_submenu_page(
            $parent_slug, "Aide à l'estimation", "📋 Aide à l'estimation",
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
            $parent_slug, 'Réglages', '⚙️ Réglages',
            'manage_options', 'lmd-settings', [ $this, 'render_settings' ]
        );
    }

    public function enqueue_assets( $hook ) {
        // Method 1: exact hook match
        $is_our_page = in_array( $hook, $this->hook_suffixes, true );

        // Method 2: fallback string search (covers edge cases)
        if ( ! $is_our_page ) {
            $is_our_page = (
                strpos( $hook, 'lmd-actions-ia' ) !== false ||
                strpos( $hook, 'lmd-estimations' ) !== false ||
                strpos( $hook, 'lmd-sales' ) !== false ||
                strpos( $hook, 'lmd-sellers' ) !== false ||
                strpos( $hook, 'lmd-settings' ) !== false ||
                strpos( $hook, 'lmd_' ) !== false ||
                strpos( $hook, 'actions-i-a' ) !== false
            );
        }

        // Method 3: check current page parameter
        if ( ! $is_our_page && isset( $_GET['page'] ) ) {
            $page = sanitize_text_field( $_GET['page'] );
            $is_our_page = in_array( $page, ['lmd-actions-ia', 'lmd-estimations', 'lmd-sales', 'lmd-sellers', 'lmd-settings'], true );
        }

        if ( ! $is_our_page ) return;

        error_log( "LMD: Loading assets on hook: {$hook}" );

        wp_enqueue_style(
            'lmd-admin-css',
            LMD_PLUGIN_URL . 'assets/css/admin.css',
            [],
            LMD_VERSION . '.' . time()
        );

        wp_enqueue_script(
            'lmd-admin-js',
            LMD_PLUGIN_URL . 'assets/js/admin.js',
            [ 'jquery' ],
            LMD_VERSION . '.' . time(),
            true
        );

        wp_localize_script( 'lmd-admin-js', 'lmdAdmin', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'lmd_nonce' ),
        ]);

        // Also enqueue WordPress media library if on detail view
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
}
