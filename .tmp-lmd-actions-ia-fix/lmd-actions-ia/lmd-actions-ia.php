<?php
/**
 * Plugin Name: LMD Actions I.A.
 * Plugin URI:  https://lemarteaudigital.fr
 * Description: Plateforme modulaire de services IA pour commissaires-priseurs — Module principal : Aide à l'estimation.
 * Version:     3.3.0
 * Author:      Le Marteau Digital
 * License:     GPL-2.0+
 * Text Domain: lmd-actions-ia
 */
if ( ! defined( 'ABSPATH' ) ) exit;

define( 'LMD_VERSION',    '3.3.0' );
define( 'LMD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LMD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/* ─── Autoload ─── */
require_once LMD_PLUGIN_DIR . 'includes/class-admin-menu.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ajax-handler.php';
require_once LMD_PLUGIN_DIR . 'includes/class-estimation-manager.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ai-connector.php';
require_once LMD_PLUGIN_DIR . 'includes/class-email-composer.php';
require_once LMD_PLUGIN_DIR . 'includes/class-shortcode-estimation.php';
require_once LMD_PLUGIN_DIR . 'includes/class-schema-helpers.php';

/* ═══════════════════════════════════════════ */
/* ACTIVATION / MIGRATION                       */
/* ═══════════════════════════════════════════ */

register_activation_hook( __FILE__, 'lmd_activate' );

function lmd_activate() {
    LMD_Schema_Helpers::create_all_tables();
    LMD_Schema_Helpers::seed_default_services();
    update_option( 'lmd_version', LMD_VERSION );
}

/* ═══════════════════════════════════════════ */
/* BOOT                                         */
/* ═══════════════════════════════════════════ */

add_action( 'plugins_loaded', function() {
    // Auto-repair schema on every admin load
    if ( is_admin() ) {
        LMD_Schema_Helpers::ensure_all_columns();
    }

    // Run full activation if version mismatch
    if ( get_option( 'lmd_version' ) !== LMD_VERSION ) {
        lmd_activate();
    }

    LMD_Admin_Menu::instance();
    LMD_Ajax_Handler::instance();
    LMD_Shortcode_Estimation::instance();
});
