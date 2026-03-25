<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Estimation_Manager {
    private static $instance = null;

    private static function row_value( $row, string $property, $default = '' ) {
        if ( ! is_object( $row ) || ! property_exists( $row, $property ) || $row->{$property} === null ) {
            return $default;
        }
        return $row->{$property};
    }

    const INTEREST_LEVELS = [
        'exceptionnel'       => [ 'label' => 'Exceptionnel',     'color' => '#8b5cf6', 'dot' => '#8b5cf6', 'bg' => '#faf5ff', 'border' => '#c084fc' ],
        'très_intéressant'   => [ 'label' => 'Très intéressant', 'color' => '#22c55e', 'dot' => '#22c55e', 'bg' => '#f0fdf4', 'border' => '#4ade80' ],
        'intéressant'        => [ 'label' => 'Intéressant',      'color' => '#10b981', 'dot' => '#10b981', 'bg' => '#ecfdf5', 'border' => '#34d399' ],
        'à_examiner'         => [ 'label' => 'À examiner',       'color' => '#f59e0b', 'dot' => '#f59e0b', 'bg' => '#fffbeb', 'border' => '#fbbf24' ],
        'peu_intéressant'    => [ 'label' => 'Peu intéressant',  'color' => '#f97316', 'dot' => '#f97316', 'bg' => '#fff7ed', 'border' => '#fb923c' ],
        'hors_spécialité'    => [ 'label' => 'Hors spécialité',  'color' => '#9ca3af', 'dot' => '#9ca3af', 'bg' => '#f9fafb', 'border' => '#d1d5db' ],
    ];

    public static function instance() {
        if ( null === self::$instance ) self::$instance = new self();
        return self::$instance;
    }

    public function render_page() {
        $view = sanitize_text_field( $_GET['view'] ?? 'list' );
        $id   = absint( $_GET['est_id'] ?? 0 );
        echo '<div class="wrap lmd-wrap">';
        if ( $view === 'detail' && $id > 0 ) {
            $this->render_detail( $id );
        } else {
            $this->render_list();
        }
        echo '</div>';
    }

    /* ─── LIST VIEW ─── */
    private function render_list() {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';

        if ( function_exists( 'lmd_maybe_repair_schema' ) ) {
            lmd_maybe_repair_schema();
        }

        if ( ! function_exists( 'lmd_table_exists' ) || ! lmd_table_exists( $table ) ) {
            echo '<div class="notice notice-error"><p>La table des estimations est absente. Réactivez le plugin pour lancer la migration.</p></div>';
            return;
        }

        $has_interest_level = function_exists( 'lmd_column_exists' )
            ? lmd_column_exists( $table, 'interest_level' )
            : (bool) $wpdb->get_var( "SHOW COLUMNS FROM `{$table}` LIKE 'interest_level'" );

        $has_nom = function_exists( 'lmd_column_exists' )
            ? lmd_column_exists( $table, 'nom' )
            : (bool) $wpdb->get_var( "SHOW COLUMNS FROM `{$table}` LIKE 'nom'" );

        $has_email = function_exists( 'lmd_column_exists' )
            ? lmd_column_exists( $table, 'email' )
            : (bool) $wpdb->get_var( "SHOW COLUMNS FROM `{$table}` LIKE 'email'" );

        $has_description = function_exists( 'lmd_column_exists' )
            ? lmd_column_exists( $table, 'description' )
            : (bool) $wpdb->get_var( "SHOW COLUMNS FROM `{$table}` LIKE 'description'" );

        $filter = sanitize_text_field( $_GET['filter'] ?? 'all' );
        $search = sanitize_text_field( $_GET['s'] ?? '' );

        $where = "WHERE 1=1";
        switch ( $filter ) {
            case 'unread':    $where .= " AND status = 'new'"; break;
            case 'pending':   $where .= " AND status NOT IN ('responded','archived')"; break;
            case 'overdue':   $where .= " AND status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)"; break;
            case 'responded': $where .= " AND status = 'responded'"; break;
            case 'all': default: $where .= " AND status != 'archived'"; break;
        }
        // Interest level filter
        if ( $has_interest_level && isset( self::INTEREST_LEVELS[ $filter ] ) ) {
            $where = "WHERE interest_level = '" . esc_sql($filter) . "' AND status != 'archived'";
        }
        if ( $search ) {
            $like = '%' . $wpdb->esc_like( $search ) . '%';
            $search_clauses = [];
            $search_values = [];
            if ( $has_nom ) {
                $search_clauses[] = 'nom LIKE %s';
                $search_values[] = $like;
            }
            if ( $has_email ) {
                $search_clauses[] = 'email LIKE %s';
                $search_values[] = $like;
            }
            if ( $has_description ) {
                $search_clauses[] = 'description LIKE %s';
                $search_values[] = $like;
            }
            if ( ! empty( $search_clauses ) ) {
                $where .= $wpdb->prepare( ' AND (' . implode( ' OR ', $search_clauses ) . ')', ...$search_values );
            }
        }

        $estimations = $wpdb->get_results("SELECT * FROM {$table} {$where} ORDER BY created_at DESC LIMIT 200");

        foreach ( $estimations as $est ) {
            $est->nom = (string) self::row_value( $est, 'nom', '' );
            $est->email = (string) self::row_value( $est, 'email', '' );
            $est->telephone = (string) self::row_value( $est, 'telephone', '' );
            $est->description = (string) self::row_value( $est, 'description', '' );
            $est->photo_urls = (string) self::row_value( $est, 'photo_urls', '[]' );
            $est->source = (string) self::row_value( $est, 'source', 'form' );
            $est->status = (string) self::row_value( $est, 'status', 'new' );
            $est->interest_level = (string) self::row_value( $est, 'interest_level', '' );
            $est->response_mode = (string) self::row_value( $est, 'response_mode', '' );
            $est->delegate_to = (string) self::row_value( $est, 'delegate_to', '' );
            $est->created_at = (string) self::row_value( $est, 'created_at', '' );
        }

        // Counts
        $counts = [
            'all'       => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status != 'archived'"),
            'unread'    => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status = 'new'"),
            'pending'   => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status NOT IN ('responded','archived')"),
            'overdue'   => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)"),
            'responded' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} WHERE status = 'responded'"),
        ];
        $interest_counts = [];
        foreach ( array_keys(self::INTEREST_LEVELS) as $key ) {
            if ( ! $has_interest_level ) {
                $interest_counts[$key] = 0;
                continue;
            }
            $interest_counts[$key] = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE interest_level = %s AND status != 'archived'",
                    $key
                )
            );
        }

        include LMD_PLUGIN_DIR . 'templates/estimation-list.php';
    }

    /* ─── DETAIL VIEW ─── */
    private function render_detail( int $id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';

        if ( function_exists( 'lmd_maybe_repair_schema' ) ) {
            lmd_maybe_repair_schema();
        }

        $est = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id));
        if ( ! $est ) {
            echo '<div class="notice notice-error"><p>Demande introuvable.</p></div>';
            return;
        }

        $est->nom = (string) self::row_value( $est, 'nom', '' );
        $est->email = (string) self::row_value( $est, 'email', '' );
        $est->telephone = (string) self::row_value( $est, 'telephone', '' );
        $est->description = (string) self::row_value( $est, 'description', '' );
        $est->photo_urls = (string) self::row_value( $est, 'photo_urls', '[]' );
        $est->estimated_value = (string) self::row_value( $est, 'estimated_value', '' );
        $est->status = (string) self::row_value( $est, 'status', 'new' );
        $est->interest_level = (string) self::row_value( $est, 'interest_level', '' );
        $est->response_mode = (string) self::row_value( $est, 'response_mode', '' );
        $est->response_message = (string) self::row_value( $est, 'response_message', '' );
        $est->delegate_to = (string) self::row_value( $est, 'delegate_to', '' );
        $est->auctioneer_notes = (string) self::row_value( $est, 'auctioneer_notes', '' );
        $est->second_opinion = (string) self::row_value( $est, 'second_opinion', '' );
        $est->created_at = (string) self::row_value( $est, 'created_at', '' );

        // Mark as read if new
        if ( $est->status === 'new' ) {
            $wpdb->update($table, ['status' => 'in_review'], ['id' => $id]);
            $est->status = 'in_review';
        }
        $ai = json_decode( $est->ai_analysis ?: '{}', true );
        include LMD_PLUGIN_DIR . 'templates/estimation-detail.php';
    }

    /* ─── Helpers ─── */
    public static function get_overdue_days( $created_at ) {
        if ( empty( $created_at ) || strtotime( $created_at ) === false ) {
            return 0;
        }
        $hours = ( time() - strtotime($created_at) ) / 3600;
        if ( $hours <= 48 ) return 0;
        return max(1, ceil(($hours - 48) / 24));
    }

    public static function get_interest_badge( $level ) {
        if ( ! $level || ! isset( self::INTEREST_LEVELS[$level] ) ) return '';
        $cfg = self::INTEREST_LEVELS[$level];
        return sprintf(
            '<span class="lmd-interest-badge" style="background:%s;color:%s;border-color:%s">
                <span class="lmd-interest-dot" style="background:%s"></span>%s
            </span>',
            $cfg['bg'], $cfg['color'], $cfg['border'], $cfg['dot'], esc_html($cfg['label'])
        );
    }
}
