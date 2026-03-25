<?php
/**
 * Plugin Name: LMD Actions I.A.
 * Plugin URI:  https://lemarteaudigital.fr
 * Description: Plateforme modulaire de services IA pour commissaires-priseurs — Module principal : Aide à l'estimation.
 * Version:     3.1.0
 * Author:      Le Marteau Digital
 * License:     GPL-2.0+
 * Text Domain: lmd-actions-ia
 */
if ( ! defined( 'ABSPATH' ) ) exit;

define( 'LMD_VERSION',    '3.1.0' );
define( 'LMD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LMD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/* ─── Autoload ─── */
require_once LMD_PLUGIN_DIR . 'includes/class-admin-menu.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ajax-handler.php';
require_once LMD_PLUGIN_DIR . 'includes/class-estimation-manager.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ai-connector.php';
require_once LMD_PLUGIN_DIR . 'includes/class-email-composer.php';
require_once LMD_PLUGIN_DIR . 'includes/class-shortcode-estimation.php';

/* ─── Schema helpers (SHOW COLUMNS — universal MySQL/MariaDB compat) ─── */

function lmd_table_exists( $table ) {
    global $wpdb;
    $result = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
    return ! empty( $result );
}

function lmd_column_exists( $table, $column ) {
    global $wpdb;
    if ( ! lmd_table_exists( $table ) ) return false;
    $row = $wpdb->get_row( $wpdb->prepare(
        "SHOW COLUMNS FROM `{$table}` WHERE Field = %s", $column
    ) );
    return ! empty( $row );
}

function lmd_add_column_if_missing( $table, $column, $definition ) {
    global $wpdb;
    if ( ! lmd_column_exists( $table, $column ) ) {
        $wpdb->query( "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}" );
        error_log( "LMD: Added column {$column} to {$table}" );
    }
}

function lmd_index_exists( $table, $index_name ) {
    global $wpdb;
    $row = $wpdb->get_row( $wpdb->prepare( "SHOW INDEX FROM `{$table}` WHERE Key_name = %s", $index_name ) );
    return ! empty( $row );
}

function lmd_add_index_if_missing( $table, $index_name, $index_sql ) {
    global $wpdb;
    if ( ! lmd_index_exists( $table, $index_name ) ) {
        $wpdb->query( "ALTER TABLE `{$table}` ADD {$index_sql}" );
    }
}

function lmd_backfill_column( $table, $target, $source ) {
    global $wpdb;
    if ( lmd_column_exists( $table, $target ) && lmd_column_exists( $table, $source ) ) {
        $wpdb->query(
            "UPDATE `{$table}` SET `{$target}` = `{$source}`
             WHERE (`{$target}` IS NULL OR `{$target}` = '')
               AND `{$source}` IS NOT NULL AND `{$source}` != ''"
        );
    }
}

function lmd_seed_default_services() {
    global $wpdb;
    $t = $wpdb->prefix . 'lmd_services';
    if ( ! lmd_table_exists( $t ) ) return;
    $rows = [
        [ 1, 'aide-estimation',    "Aide à l'estimation",     "Réception, triage et analyse des demandes d'estimation.", 'dashicons-search',      1, 1 ],
        [ 2, 'visibilite-google',  'Visibilité Google (SEO)', 'Enrichissement SEO automatique des lots.',                'dashicons-visibility',  0, 2 ],
        [ 3, 'experience-acheteur','Expérience acheteur',     'Alertes personnalisées, Q&R 24/7.',                       'dashicons-groups',      0, 3 ],
        [ 4, 'super-acheteurs',    'Super acheteurs',         'Profilage comportemental des acheteurs.',                 'dashicons-star-filled', 0, 4 ],
    ];
    foreach ( $rows as $s ) {
        $wpdb->replace( $t, [
            'id' => $s[0], 'slug' => $s[1], 'label' => $s[2], 'description' => $s[3],
            'icon' => $s[4], 'is_active' => $s[5], 'sort_order' => $s[6], 'config' => '{}',
        ] );
    }
}

/* ─── Activation / Migration ─── */
register_activation_hook( __FILE__, 'lmd_activate' );
function lmd_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    $services_table    = $wpdb->prefix . 'lmd_services';
    $estimations_table = $wpdb->prefix . 'lmd_estimations';
    $usage_table       = $wpdb->prefix . 'lmd_ai_usage';

    /* ── Services catalog ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$services_table} (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slug        VARCHAR(80)  NOT NULL UNIQUE,
        label       VARCHAR(255) NOT NULL,
        description TEXT,
        icon        VARCHAR(80)  DEFAULT 'dashicons-admin-generic',
        is_active   TINYINT(1)   DEFAULT 0,
        sort_order  INT          DEFAULT 0,
        config      LONGTEXT,
        created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) {$charset};");

    /* ── Estimation requests ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$estimations_table} (
        id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nom             VARCHAR(255) NOT NULL DEFAULT '',
        email           VARCHAR(255) NOT NULL DEFAULT '',
        telephone       VARCHAR(40)  DEFAULT '',
        description     TEXT,
        photo_urls      LONGTEXT,
        estimated_value VARCHAR(100) DEFAULT '',
        object_category VARCHAR(100) DEFAULT '',
        source          VARCHAR(50)  DEFAULT 'form',
        status          VARCHAR(30)  DEFAULT 'new',
        interest_level  VARCHAR(50)  DEFAULT '',
        auctioneer_notes TEXT,
        second_opinion  TEXT,
        ai_analysis     LONGTEXT,
        ai_analyzed_at  DATETIME     NULL,
        decided_at      DATETIME     NULL,
        response_message TEXT,
        response_mode    VARCHAR(30)  DEFAULT '',
        responded_at    DATETIME     NULL,
        delegate_to     VARCHAR(255) DEFAULT '',
        created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_status (status),
        KEY idx_created (created_at)
    ) {$charset};");

    /* ── AI usage log ── */
    $wpdb->query("CREATE TABLE IF NOT EXISTS {$usage_table} (
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

    /* ── Ensure every required column exists (handles legacy tables) ── */
    lmd_ensure_estimations_columns( $estimations_table );
    lmd_seed_default_services();
    update_option( 'lmd_version', LMD_VERSION );
}

function lmd_ensure_estimations_columns( $table ) {
    if ( ! lmd_table_exists( $table ) ) return;

    $columns = [
        'nom'              => "VARCHAR(255) NOT NULL DEFAULT ''",
        'email'            => "VARCHAR(255) NOT NULL DEFAULT ''",
        'telephone'        => "VARCHAR(40) DEFAULT ''",
        'description'      => 'TEXT NULL',
        'photo_urls'       => 'LONGTEXT NULL',
        'estimated_value'  => "VARCHAR(100) DEFAULT ''",
        'object_category'  => "VARCHAR(100) DEFAULT ''",
        'source'           => "VARCHAR(50) DEFAULT 'form'",
        'status'           => "VARCHAR(30) DEFAULT 'new'",
        'interest_level'   => "VARCHAR(50) DEFAULT ''",
        'auctioneer_notes' => 'TEXT NULL',
        'second_opinion'   => 'TEXT NULL',
        'ai_analysis'      => 'LONGTEXT NULL',
        'ai_analyzed_at'   => 'DATETIME NULL',
        'decided_at'       => 'DATETIME NULL',
        'response_message' => 'TEXT NULL',
        'response_mode'    => "VARCHAR(30) DEFAULT ''",
        'responded_at'     => 'DATETIME NULL',
        'delegate_to'      => "VARCHAR(255) DEFAULT ''",
        'created_at'       => 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        'updated_at'       => 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];

    foreach ( $columns as $col => $def ) {
        lmd_add_column_if_missing( $table, $col, $def );
    }

    lmd_add_index_if_missing( $table, 'idx_status',  'KEY `idx_status` (`status`)' );
    lmd_add_index_if_missing( $table, 'idx_created', 'KEY `idx_created` (`created_at`)' );

    // Legacy column mappings
    lmd_backfill_column( $table, 'nom', 'seller_name' );
    lmd_backfill_column( $table, 'nom', 'name' );
    lmd_backfill_column( $table, 'interest_level', 'auctioneer_decision' );

    global $wpdb;
    $wpdb->query( "UPDATE `{$table}` SET `photo_urls` = '[]' WHERE `photo_urls` IS NULL OR `photo_urls` = ''" );
    $wpdb->query( "UPDATE `{$table}` SET `nom`    = '' WHERE `nom` IS NULL" );
    $wpdb->query( "UPDATE `{$table}` SET `email`  = '' WHERE `email` IS NULL" );
    $wpdb->query( "UPDATE `{$table}` SET `status` = 'new' WHERE `status` IS NULL OR `status` = ''" );
}

/* ─── Boot ─── */
add_action( 'plugins_loaded', function() {
    $estimations_table = $GLOBALS['wpdb']->prefix . 'lmd_estimations';
    // Always ensure schema is correct on every load
    if ( lmd_table_exists( $estimations_table ) ) {
        lmd_ensure_estimations_columns( $estimations_table );
    }

    if ( get_option( 'lmd_version' ) !== LMD_VERSION ) {
        lmd_activate();
    }

    LMD_Admin_Menu::instance();
    LMD_Ajax_Handler::instance();
    LMD_Shortcode_Estimation::instance();
});
