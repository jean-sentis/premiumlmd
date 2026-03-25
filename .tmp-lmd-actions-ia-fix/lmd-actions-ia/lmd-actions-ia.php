<?php
/**
 * Plugin Name: LMD Actions I.A.
 * Plugin URI:  https://lemarteaudigital.fr
 * Description: Plateforme modulaire de services IA pour commissaires-priseurs — Module principal : Aide à l'estimation.
 * Version:     3.0.0
 * Author:      Le Marteau Digital
 * License:     GPL-2.0+
 * Text Domain: lmd-actions-ia
 */
if ( ! defined( 'ABSPATH' ) ) exit;

define( 'LMD_VERSION',    '3.0.0' );
define( 'LMD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LMD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/* ─── Autoload ─── */
require_once LMD_PLUGIN_DIR . 'includes/class-admin-menu.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ajax-handler.php';
require_once LMD_PLUGIN_DIR . 'includes/class-estimation-manager.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ai-connector.php';
require_once LMD_PLUGIN_DIR . 'includes/class-email-composer.php';
require_once LMD_PLUGIN_DIR . 'includes/class-shortcode-estimation.php';

/* ─── Boot ─── */
add_action( 'plugins_loaded', function() {
    LMD_Admin_Menu::instance();
    LMD_Ajax_Handler::instance();
    LMD_Shortcode_Estimation::instance();
});

/* ─── Activation : create tables ─── */
register_activation_hook( __FILE__, 'lmd_activate' );
function lmd_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    /* ── Services catalog ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}lmd_services (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slug        VARCHAR(80)  NOT NULL UNIQUE,
        label       VARCHAR(255) NOT NULL,
        description TEXT,
        icon        VARCHAR(80)  DEFAULT 'dashicons-admin-generic',
        is_active   TINYINT(1)   DEFAULT 0,
        sort_order  INT          DEFAULT 0,
        config      LONGTEXT     DEFAULT '{}',
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) {$charset};");

    /* ── Estimation requests ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}lmd_estimations (
        id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nom             VARCHAR(255) NOT NULL,
        email           VARCHAR(255) NOT NULL,
        telephone       VARCHAR(40),
        description     TEXT NOT NULL,
        photo_urls      LONGTEXT DEFAULT '[]',
        estimated_value VARCHAR(100),
        object_category VARCHAR(100),
        source          VARCHAR(50) DEFAULT 'form',
        status          VARCHAR(30) DEFAULT 'new',
        interest_level  VARCHAR(50),
        auctioneer_notes TEXT,
        second_opinion  TEXT,
        ai_analysis     LONGTEXT,
        ai_analyzed_at  DATETIME,
        decided_at      DATETIME,
        response_message TEXT,
        response_mode    VARCHAR(30),
        responded_at    DATETIME,
        delegate_to     VARCHAR(255),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_status (status),
        KEY idx_created (created_at)
    ) {$charset};");

    /* ── AI usage log ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}lmd_ai_usage (
        id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        service_slug   VARCHAR(80),
        action_type    VARCHAR(80),
        provider       VARCHAR(80),
        model          VARCHAR(120),
        tokens_in      INT DEFAULT 0,
        tokens_out     INT DEFAULT 0,
        cost_eur       DECIMAL(8,4) DEFAULT 0,
        billed_eur     DECIMAL(8,4) DEFAULT 0,
        ref_id         BIGINT UNSIGNED,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    ) {$charset};");

    /* ── Seed default services ── */
    $services = [
        [ 1, 'aide-estimation',    "Aide à l'estimation",     "Réception, triage et analyse des demandes d'estimation.", 'dashicons-search',      1, 1 ],
        [ 2, 'visibilite-google',  'Visibilité Google (SEO)', 'Enrichissement SEO automatique des lots.',                'dashicons-visibility',  0, 2 ],
        [ 3, 'experience-acheteur','Expérience acheteur',     'Alertes personnalisées, Q&R 24/7.',                       'dashicons-groups',      0, 3 ],
        [ 4, 'super-acheteurs',    'Super acheteurs',         'Profilage comportemental des acheteurs.',                 'dashicons-star-filled', 0, 4 ],
    ];
    foreach ( $services as $s ) {
        $wpdb->replace("{$wpdb->prefix}lmd_services", [
            'id' => $s[0], 'slug' => $s[1], 'label' => $s[2],
            'description' => $s[3], 'icon' => $s[4], 'is_active' => $s[5], 'sort_order' => $s[6],
        ]);
    }
    update_option( 'lmd_version', LMD_VERSION );
}
