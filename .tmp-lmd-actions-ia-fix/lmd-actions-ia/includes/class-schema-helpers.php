<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Database schema management — extracted from main plugin file.
 * Handles table creation, column checks, migrations, and seeding.
 */
class LMD_Schema_Helpers {

    /* ─── Low-level helpers ─── */

    public static function table_exists( $table ) {
        global $wpdb;
        return ! empty( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) );
    }

    public static function column_exists( $table, $column ) {
        global $wpdb;
        if ( ! self::table_exists( $table ) ) return false;
        $row = $wpdb->get_row( $wpdb->prepare(
            "SHOW COLUMNS FROM `{$table}` WHERE Field = %s", $column
        ) );
        return ! empty( $row );
    }

    public static function add_column_if_missing( $table, $column, $definition ) {
        if ( ! self::column_exists( $table, $column ) ) {
            global $wpdb;
            $wpdb->query( "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}" );
            error_log( "LMD: Added column {$column} to {$table}" );
        }
    }

    public static function index_exists( $table, $index_name ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare( "SHOW INDEX FROM `{$table}` WHERE Key_name = %s", $index_name ) );
        return ! empty( $row );
    }

    public static function add_index_if_missing( $table, $index_name, $index_sql ) {
        if ( ! self::index_exists( $table, $index_name ) ) {
            global $wpdb;
            $wpdb->query( "ALTER TABLE `{$table}` ADD {$index_sql}" );
        }
    }

    public static function backfill_column( $table, $target, $source ) {
        global $wpdb;
        if ( self::column_exists( $table, $target ) && self::column_exists( $table, $source ) ) {
            $wpdb->query(
                "UPDATE `{$table}` SET `{$target}` = `{$source}`
                 WHERE (`{$target}` IS NULL OR `{$target}` = '')
                   AND `{$source}` IS NOT NULL AND `{$source}` != ''"
            );
        }
    }

    /* ═══════════════════════════════════════════ */
    /* CREATE ALL TABLES                            */
    /* ═══════════════════════════════════════════ */

    public static function create_all_tables() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $est = $wpdb->prefix . 'lmd_estimations';
        $svc = $wpdb->prefix . 'lmd_services';
        $use = $wpdb->prefix . 'lmd_ai_usage';
        $sal = $wpdb->prefix . 'lmd_sales';
        $sel = $wpdb->prefix . 'lmd_sellers';

        /* ── Services ── */
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$svc} (
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

        /* ── Ventes (Sales) ── */
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$sal} (
            id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title       VARCHAR(255) NOT NULL,
            sale_date   DATETIME     NULL,
            location    VARCHAR(255) DEFAULT '',
            specialty   VARCHAR(100) DEFAULT '',
            description TEXT,
            status      VARCHAR(30)  DEFAULT 'planned',
            lot_count   INT          DEFAULT 0,
            created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_sale_date (sale_date),
            KEY idx_status (status)
        ) {$charset};");

        /* ── Vendeurs (Sellers) ── */
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$sel} (
            id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nom              VARCHAR(255) NOT NULL DEFAULT '',
            email            VARCHAR(255) DEFAULT '',
            telephone        VARCHAR(40)  DEFAULT '',
            address          TEXT,
            city             VARCHAR(100) DEFAULT '',
            notes            TEXT,
            estimation_count INT          DEFAULT 0,
            created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
            updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_email (email),
            KEY idx_nom (nom)
        ) {$charset};");

        /* ── Estimations ── */
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$est} (
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
            sale_id         BIGINT UNSIGNED NULL,
            seller_id       BIGINT UNSIGNED NULL,
            created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_status (status),
            KEY idx_created (created_at),
            KEY idx_sale_id (sale_id),
            KEY idx_seller_id (seller_id)
        ) {$charset};");

        /* ── AI Usage ── */
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$use} (
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

        self::ensure_estimations_columns( $est );
    }

    /* ═══════════════════════════════════════════ */
    /* ENSURE ALL COLUMNS (auto-repair)             */
    /* ═══════════════════════════════════════════ */

    public static function ensure_all_columns() {
        global $wpdb;
        $est = $wpdb->prefix . 'lmd_estimations';
        if ( self::table_exists( $est ) ) {
            self::ensure_estimations_columns( $est );
        }
    }

    public static function ensure_estimations_columns( $table ) {
        if ( ! self::table_exists( $table ) ) return;

        $cols = [
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
            'sale_id'          => 'BIGINT UNSIGNED NULL',
            'seller_id'        => 'BIGINT UNSIGNED NULL',
        ];

        foreach ( $cols as $col => $def ) {
            self::add_column_if_missing( $table, $col, $def );
        }

        self::add_index_if_missing( $table, 'idx_status',    'KEY `idx_status` (`status`)' );
        self::add_index_if_missing( $table, 'idx_created',   'KEY `idx_created` (`created_at`)' );
        self::add_index_if_missing( $table, 'idx_interest',  'KEY `idx_interest` (`interest_level`)' );
        self::add_index_if_missing( $table, 'idx_sale_id',   'KEY `idx_sale_id` (`sale_id`)' );
        self::add_index_if_missing( $table, 'idx_seller_id', 'KEY `idx_seller_id` (`seller_id`)' );

        // Backfill from legacy column names
        self::backfill_column( $table, 'nom', 'seller_name' );
        self::backfill_column( $table, 'nom', 'name' );
        self::backfill_column( $table, 'interest_level', 'auctioneer_decision' );

        // Defaults for nulls
        global $wpdb;
        $wpdb->query( "UPDATE `{$table}` SET `photo_urls` = '[]' WHERE `photo_urls` IS NULL OR `photo_urls` = ''" );
        $wpdb->query( "UPDATE `{$table}` SET `nom`    = '' WHERE `nom` IS NULL" );
        $wpdb->query( "UPDATE `{$table}` SET `email`  = '' WHERE `email` IS NULL" );
        $wpdb->query( "UPDATE `{$table}` SET `status` = 'new' WHERE `status` IS NULL OR `status` = ''" );
    }

    /* ═══════════════════════════════════════════ */
    /* SEED                                         */
    /* ═══════════════════════════════════════════ */

    public static function seed_default_services() {
        global $wpdb;
        $t = $wpdb->prefix . 'lmd_services';
        if ( ! self::table_exists( $t ) ) return;
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
}
