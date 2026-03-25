<?php
/**
 * Plugin Name: LMD Actions I.A.
 * Plugin URI:  https://lemarteaudigital.fr
 * Description: Plateforme modulaire de services IA pour commissaires-priseurs — Module principal : Aide à l'estimation.
 * Version:     3.0.2
 * Author:      Le Marteau Digital
 * License:     GPL-2.0+
 * Text Domain: lmd-actions-ia
 */
if ( ! defined( 'ABSPATH' ) ) exit;

define( 'LMD_VERSION',    '3.0.2' );
define( 'LMD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LMD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/* ─── Autoload ─── */
require_once LMD_PLUGIN_DIR . 'includes/class-admin-menu.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ajax-handler.php';
require_once LMD_PLUGIN_DIR . 'includes/class-estimation-manager.php';
require_once LMD_PLUGIN_DIR . 'includes/class-ai-connector.php';
require_once LMD_PLUGIN_DIR . 'includes/class-email-composer.php';
require_once LMD_PLUGIN_DIR . 'includes/class-shortcode-estimation.php';

function lmd_table_exists( $table ) {
    global $wpdb;
    $exists = $wpdb->get_var(
        $wpdb->prepare(
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s',
            $table
        )
    );
    return (int) $exists > 0;
}

function lmd_column_exists( $table, $column ) {
    global $wpdb;
    $exists = $wpdb->get_var(
        $wpdb->prepare(
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s',
            $table,
            $column
        )
    );
    return (int) $exists > 0;
}

function lmd_get_missing_columns( $table, array $required_columns ) {
    $missing = [];
    foreach ( $required_columns as $column ) {
        if ( ! lmd_column_exists( $table, $column ) ) {
            $missing[] = $column;
        }
    }
    return $missing;
}

function lmd_add_column_if_missing( $table, $column, $definition ) {
    global $wpdb;
    if ( ! lmd_column_exists( $table, $column ) ) {
        $wpdb->query( "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}" );
    }
}

function lmd_index_exists( $table, $index_name ) {
    global $wpdb;
    return (bool) $wpdb->get_var( $wpdb->prepare( "SHOW INDEX FROM `{$table}` WHERE Key_name = %s", $index_name ) );
}

function lmd_add_index_if_missing( $table, $index_name, $index_sql ) {
    global $wpdb;
    if ( ! lmd_index_exists( $table, $index_name ) ) {
        $wpdb->query( "ALTER TABLE `{$table}` ADD {$index_sql}" );
    }
}

function lmd_backfill_column_from_legacy( $table, $target, $source ) {
    global $wpdb;
    if ( lmd_column_exists( $table, $target ) && lmd_column_exists( $table, $source ) ) {
        $wpdb->query(
            "UPDATE `{$table}`
             SET `{$target}` = `{$source}`
             WHERE (`{$target}` IS NULL OR `{$target}` = '')
               AND `{$source}` IS NOT NULL
               AND `{$source}` != ''"
        );
    }
}

function lmd_seed_default_services() {
    global $wpdb;
    $services_table = $wpdb->prefix . 'lmd_services';
    $services = [
        [ 1, 'aide-estimation',    "Aide à l'estimation",     "Réception, triage et analyse des demandes d'estimation.", 'dashicons-search',      1, 1 ],
        [ 2, 'visibilite-google',  'Visibilité Google (SEO)', 'Enrichissement SEO automatique des lots.',                'dashicons-visibility',  0, 2 ],
        [ 3, 'experience-acheteur','Expérience acheteur',     'Alertes personnalisées, Q&R 24/7.',                       'dashicons-groups',      0, 3 ],
        [ 4, 'super-acheteurs',    'Super acheteurs',         'Profilage comportemental des acheteurs.',                 'dashicons-star-filled', 0, 4 ],
    ];

    foreach ( $services as $s ) {
        $wpdb->replace( $services_table, [
            'id' => $s[0],
            'slug' => $s[1],
            'label' => $s[2],
            'description' => $s[3],
            'icon' => $s[4],
            'is_active' => $s[5],
            'sort_order' => $s[6],
            'config' => '{}',
        ] );
    }
}

function lmd_maybe_repair_schema() {
    global $wpdb;

    $services_table    = $wpdb->prefix . 'lmd_services';
    $estimations_table = $wpdb->prefix . 'lmd_estimations';
    $usage_table       = $wpdb->prefix . 'lmd_ai_usage';

    $needs_repair = ! lmd_table_exists( $services_table )
        || ! lmd_table_exists( $estimations_table )
        || ! lmd_table_exists( $usage_table );

    if ( ! $needs_repair ) {
        $required_estimations_columns = [
            'nom', 'email', 'telephone', 'description', 'photo_urls',
            'status', 'interest_level', 'auctioneer_notes', 'second_opinion',
            'response_message', 'response_mode', 'responded_at', 'delegate_to',
            'created_at', 'updated_at',
        ];

        $required_services_columns = [ 'slug', 'label', 'config', 'is_active', 'sort_order' ];

        $missing_estimations = lmd_get_missing_columns( $estimations_table, $required_estimations_columns );
        $missing_services    = lmd_get_missing_columns( $services_table, $required_services_columns );

        $needs_repair = ! empty( $missing_estimations ) || ! empty( $missing_services );
    }

    if ( $needs_repair ) {
        lmd_activate();
    }
}

/* ─── Activation / Migration ─── */
register_activation_hook( __FILE__, 'lmd_activate' );
function lmd_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $services_table = $wpdb->prefix . 'lmd_services';
    $estimations_table = $wpdb->prefix . 'lmd_estimations';
    $usage_table = $wpdb->prefix . 'lmd_ai_usage';

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
        nom             VARCHAR(255) NOT NULL,
        email           VARCHAR(255) NOT NULL,
        telephone       VARCHAR(40),
        description     TEXT NOT NULL,
        photo_urls      LONGTEXT,
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

    // Ensure required columns exist even on legacy/broken installs
    if ( lmd_table_exists( $services_table ) ) {
        lmd_add_column_if_missing( $services_table, 'config', 'LONGTEXT NULL' );
        $wpdb->query( "UPDATE `{$services_table}` SET `config` = '{}' WHERE `config` IS NULL OR `config` = ''" );
    }

    if ( lmd_table_exists( $estimations_table ) ) {
        lmd_add_column_if_missing( $estimations_table, 'nom', 'VARCHAR(255) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'email', 'VARCHAR(255) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'telephone', 'VARCHAR(40) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'description', 'TEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'photo_urls', 'LONGTEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'estimated_value', 'VARCHAR(100) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'object_category', 'VARCHAR(100) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'source', "VARCHAR(50) DEFAULT 'form'" );
        lmd_add_column_if_missing( $estimations_table, 'status', "VARCHAR(30) DEFAULT 'new'" );
        lmd_add_column_if_missing( $estimations_table, 'interest_level', 'VARCHAR(50) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'auctioneer_notes', 'TEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'second_opinion', 'TEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'ai_analysis', 'LONGTEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'ai_analyzed_at', 'DATETIME NULL' );
        lmd_add_column_if_missing( $estimations_table, 'decided_at', 'DATETIME NULL' );
        lmd_add_column_if_missing( $estimations_table, 'response_message', 'TEXT NULL' );
        lmd_add_column_if_missing( $estimations_table, 'response_mode', 'VARCHAR(30) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'responded_at', 'DATETIME NULL' );
        lmd_add_column_if_missing( $estimations_table, 'delegate_to', 'VARCHAR(255) NULL' );
        lmd_add_column_if_missing( $estimations_table, 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP' );
        lmd_add_column_if_missing( $estimations_table, 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' );

        lmd_add_index_if_missing( $estimations_table, 'idx_status', 'KEY `idx_status` (`status`)' );
        lmd_add_index_if_missing( $estimations_table, 'idx_created', 'KEY `idx_created` (`created_at`)' );

        // Legacy mappings
        lmd_backfill_column_from_legacy( $estimations_table, 'nom', 'seller_name' );
        lmd_backfill_column_from_legacy( $estimations_table, 'nom', 'name' );
        lmd_backfill_column_from_legacy( $estimations_table, 'interest_level', 'auctioneer_decision' );

        $wpdb->query( "UPDATE `{$estimations_table}` SET `photo_urls` = '[]' WHERE `photo_urls` IS NULL OR `photo_urls` = ''" );
        $wpdb->query( "UPDATE `{$estimations_table}` SET `nom` = COALESCE(`nom`, '')" );
        $wpdb->query( "UPDATE `{$estimations_table}` SET `email` = COALESCE(`email`, '')" );
        $wpdb->query( "UPDATE `{$estimations_table}` SET `description` = COALESCE(`description`, '')" );
        $wpdb->query( "UPDATE `{$estimations_table}` SET `status` = 'new' WHERE `status` IS NULL OR `status` = ''" );
    }

    lmd_seed_default_services();
    update_option( 'lmd_version', LMD_VERSION );
}

/* ─── Boot ─── */
add_action( 'plugins_loaded', function() {
    lmd_maybe_repair_schema();

    if ( get_option( 'lmd_version' ) !== LMD_VERSION ) {
        lmd_activate();
    }

    LMD_Admin_Menu::instance();
    LMD_Ajax_Handler::instance();
    LMD_Shortcode_Estimation::instance();
});
