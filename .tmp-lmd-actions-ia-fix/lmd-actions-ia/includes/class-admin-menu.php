<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Admin_Menu {
    private static $instance = null;
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

        add_menu_page(
            'LMD Actions I.A.', 'Actions I.A.', 'manage_options',
            $parent_slug, [ $this, 'render_dashboard' ],
            'dashicons-superhero-alt', 26
        );
        add_submenu_page(
            $parent_slug, 'Tableau de bord', 'Tableau de bord',
            'manage_options', $parent_slug, [ $this, 'render_dashboard' ]
        );
        add_submenu_page(
            $parent_slug, "Aide à l'estimation", "📋 Aide à l'estimation",
            'manage_options', 'lmd-estimations',
            [ LMD_Estimation_Manager::instance(), 'render_page' ]
        );
        add_submenu_page(
            $parent_slug, 'Réglages', '⚙️ Réglages',
            'manage_options', 'lmd-settings', [ $this, 'render_settings' ]
        );
    }

    public function enqueue_assets( $hook ) {
        // Match any page containing lmd- in the hook
        if ( strpos( $hook, 'lmd-' ) === false
          && strpos( $hook, 'lmd_' ) === false
          && strpos( $hook, 'actions-i-a' ) === false ) {
            return;
        }

        wp_enqueue_style(
            'lmd-admin-css',
            LMD_PLUGIN_URL . 'assets/css/admin.css',
            [],
            LMD_VERSION
        );

        wp_enqueue_script(
            'lmd-admin-js',
            LMD_PLUGIN_URL . 'assets/js/admin.js',
            [ 'jquery' ],
            LMD_VERSION,
            true
        );

        wp_localize_script( 'lmd-admin-js', 'lmdAdmin', [
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'lmd_nonce' ),
        ]);
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
}
