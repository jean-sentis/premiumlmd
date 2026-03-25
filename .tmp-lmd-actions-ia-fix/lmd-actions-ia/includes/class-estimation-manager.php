<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Estimation_Manager {
    private static $instance = null;

    private static function rv( $row, string $prop, $default = '' ) {
        if ( ! is_object( $row ) ) return $default;
        return property_exists( $row, $prop ) && $row->{$prop} !== null ? $row->{$prop} : $default;
    }

    const INTEREST_LEVELS = [
        'exceptionnel'       => [ 'label' => 'Exceptionnel',     'color' => '#8b5cf6', 'dot' => '#8b5cf6', 'bg' => '#faf5ff', 'border' => '#c084fc' ],
        'très_intéressant'   => [ 'label' => 'Très intéressant', 'color' => '#22c55e', 'dot' => '#22c55e', 'bg' => '#f0fdf4', 'border' => '#4ade80' ],
        'intéressant'        => [ 'label' => 'Intéressant',      'color' => '#10b981', 'dot' => '#10b981', 'bg' => '#ecfdf5', 'border' => '#34d399' ],
        'à_examiner'         => [ 'label' => 'À examiner',       'color' => '#f59e0b', 'dot' => '#f59e0b', 'bg' => '#fffbeb', 'border' => '#fbbf24' ],
        'peu_intéressant'    => [ 'label' => 'Peu intéressant',  'color' => '#f97316', 'dot' => '#f97316', 'bg' => '#fff7ed', 'border' => '#fb923c' ],
        'hors_spécialité'    => [ 'label' => 'Hors spécialité',  'color' => '#9ca3af', 'dot' => '#9ca3af', 'bg' => '#f9fafb', 'border' => '#d1d5db' ],
    ];

    const OBJECT_CATEGORIES = [
        'tableaux'      => 'Tableaux',
        'mobilier'      => 'Mobilier',
        'bijoux'        => 'Bijoux & Montres',
        'ceramiques'    => 'Céramiques',
        'argenterie'    => 'Argenterie',
        'objets_art'    => "Objets d'art",
        'livres'        => 'Livres & Manuscrits',
        'sculptures'    => 'Sculptures',
        'photographies' => 'Photographies',
        'estampes'      => 'Estampes',
        'tapis'         => 'Tapis & Textiles',
        'militaria'     => 'Militaria',
        'vins'          => 'Vins & Spiritueux',
        'voitures'      => 'Voitures de collection',
        'autre'         => 'Autre',
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

    /* ═══════════════════════════════════════════ */
    /* LIST VIEW                                    */
    /* ═══════════════════════════════════════════ */
    private function render_list() {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';

        // Ensure schema
        if ( function_exists( 'lmd_ensure_estimations_columns' ) ) {
            lmd_ensure_estimations_columns( $table );
        }

        if ( ! function_exists( 'lmd_table_exists' ) || ! lmd_table_exists( $table ) ) {
            echo '<div class="notice notice-error"><p>La table des estimations est absente. Réactivez le plugin.</p></div>';
            return;
        }

        // Check which columns exist
        $cols_exist = [];
        foreach ( ['interest_level','nom','email','description','object_category','source','delegate_to','photo_urls','telephone','responded_at','auctioneer_decision'] as $c ) {
            $cols_exist[$c] = function_exists('lmd_column_exists') ? lmd_column_exists($table, $c) : true;
        }

        // ── Filter ──
        $filter = sanitize_text_field( $_GET['filter'] ?? 'all' );
        $search = sanitize_text_field( $_GET['s'] ?? '' );

        // ── Sort ──
        $sort_by  = sanitize_text_field( $_GET['sort'] ?? 'created_at' );
        $sort_dir = strtoupper( sanitize_text_field( $_GET['dir'] ?? 'DESC' ) );
        if ( ! in_array( $sort_dir, ['ASC','DESC'] ) ) $sort_dir = 'DESC';

        $allowed_sorts = ['created_at' => 'created_at', 'nom' => 'nom', 'status' => 'status'];
        if ( $cols_exist['interest_level'] ) $allowed_sorts['interest_level'] = 'interest_level';
        if ( ! isset( $allowed_sorts[$sort_by] ) ) $sort_by = 'created_at';
        $order_col = $allowed_sorts[$sort_by];

        // ── WHERE ──
        $where = "WHERE 1=1";
        $interest_col = $cols_exist['interest_level'] ? 'interest_level' : ($cols_exist['auctioneer_decision'] ? 'auctioneer_decision' : '');

        switch ( $filter ) {
            case 'unread':    $where .= " AND status = 'new'"; break;
            case 'pending':   $where .= " AND status NOT IN ('responded','archived')"; break;
            case 'overdue':   $where .= " AND status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)"; break;
            case 'responded': $where .= " AND status = 'responded'"; break;
            case 'archived':  $where .= " AND status = 'archived'"; break;
            case 'all':
                $where .= " AND status != 'archived'";
                break;
            default:
                // Interest level filter
                if ( $interest_col && isset( self::INTEREST_LEVELS[$filter] ) ) {
                    $where .= $wpdb->prepare( " AND `{$interest_col}` = %s AND status != 'archived'", $filter );
                } else {
                    $where .= " AND status != 'archived'";
                }
                break;
        }

        // ── Search ──
        if ( $search ) {
            $like = '%' . $wpdb->esc_like( $search ) . '%';
            $clauses = [];
            $vals = [];
            foreach ( ['nom','email','description','telephone'] as $sc ) {
                if ( $cols_exist[$sc] ?? false ) {
                    $clauses[] = "`{$sc}` LIKE %s";
                    $vals[] = $like;
                }
            }
            if ( ! empty( $clauses ) ) {
                $where .= $wpdb->prepare( ' AND (' . implode( ' OR ', $clauses ) . ')', ...$vals );
            }
        }

        $estimations = $wpdb->get_results(
            "SELECT * FROM `{$table}` {$where} ORDER BY `{$order_col}` {$sort_dir} LIMIT 200"
        );

        if ( $wpdb->last_error ) {
            error_log( "LMD SQL Error: " . $wpdb->last_error );
        }

        // Normalize rows
        foreach ( $estimations as $est ) {
            $est->nom            = (string) self::rv( $est, 'nom', '' );
            $est->email          = (string) self::rv( $est, 'email', '' );
            $est->telephone      = (string) self::rv( $est, 'telephone', '' );
            $est->description    = (string) self::rv( $est, 'description', '' );
            $est->photo_urls     = (string) self::rv( $est, 'photo_urls', '[]' );
            $est->source         = (string) self::rv( $est, 'source', 'form' );
            $est->status         = (string) self::rv( $est, 'status', 'new' );
            // Support both column names
            $est->interest_level = (string) ( self::rv( $est, 'interest_level', '' ) ?: self::rv( $est, 'auctioneer_decision', '' ) );
            $est->object_category= (string) self::rv( $est, 'object_category', '' );
            $est->response_mode  = (string) self::rv( $est, 'response_mode', '' );
            $est->delegate_to    = (string) self::rv( $est, 'delegate_to', '' );
            $est->created_at     = (string) self::rv( $est, 'created_at', '' );
        }

        // ── Counts ──
        $counts = [
            'all'       => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status != 'archived'"),
            'unread'    => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status = 'new'"),
            'pending'   => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status NOT IN ('responded','archived')"),
            'overdue'   => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)"),
            'responded' => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status = 'responded'"),
            'archived'  => (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status = 'archived'"),
        ];
        $interest_counts = [];
        foreach ( array_keys(self::INTEREST_LEVELS) as $key ) {
            if ( ! $interest_col ) {
                $interest_counts[$key] = 0;
                continue;
            }
            $interest_counts[$key] = (int) $wpdb->get_var(
                $wpdb->prepare("SELECT COUNT(*) FROM `{$table}` WHERE `{$interest_col}` = %s AND status != 'archived'", $key)
            );
        }

        // Category counts
        $category_counts = [];
        if ( $cols_exist['object_category'] ) {
            $cat_rows = $wpdb->get_results("SELECT object_category, COUNT(*) as cnt FROM `{$table}` WHERE status != 'archived' AND object_category IS NOT NULL AND object_category != '' GROUP BY object_category");
            foreach ( $cat_rows as $cr ) {
                $category_counts[$cr->object_category] = (int) $cr->cnt;
            }
        }

        include LMD_PLUGIN_DIR . 'templates/estimation-list.php';
    }

    /* ═══════════════════════════════════════════ */
    /* DETAIL VIEW                                  */
    /* ═══════════════════════════════════════════ */
    private function render_detail( int $id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';

        if ( function_exists( 'lmd_ensure_estimations_columns' ) ) {
            lmd_ensure_estimations_columns( $table );
        }

        $est = $wpdb->get_row( $wpdb->prepare("SELECT * FROM `{$table}` WHERE id = %d", $id) );
        if ( ! $est ) {
            echo '<div class="notice notice-error"><p>Demande introuvable.</p></div>';
            return;
        }

        // Normalize
        $est->nom              = (string) self::rv( $est, 'nom', '' );
        $est->email            = (string) self::rv( $est, 'email', '' );
        $est->telephone        = (string) self::rv( $est, 'telephone', '' );
        $est->description      = (string) self::rv( $est, 'description', '' );
        $est->photo_urls       = (string) self::rv( $est, 'photo_urls', '[]' );
        $est->estimated_value  = (string) self::rv( $est, 'estimated_value', '' );
        $est->object_category  = (string) self::rv( $est, 'object_category', '' );
        $est->status           = (string) self::rv( $est, 'status', 'new' );
        $est->interest_level   = (string) ( self::rv( $est, 'interest_level', '' ) ?: self::rv( $est, 'auctioneer_decision', '' ) );
        $est->response_mode    = (string) self::rv( $est, 'response_mode', '' );
        $est->response_message = (string) self::rv( $est, 'response_message', '' );
        $est->delegate_to      = (string) self::rv( $est, 'delegate_to', '' );
        $est->auctioneer_notes = (string) self::rv( $est, 'auctioneer_notes', '' );
        $est->second_opinion   = (string) self::rv( $est, 'second_opinion', '' );
        $est->created_at       = (string) self::rv( $est, 'created_at', '' );

        // Mark as read
        if ( $est->status === 'new' ) {
            $wpdb->update( $table, ['status' => 'in_review'], ['id' => $id] );
            $est->status = 'in_review';
        }

        $ai = json_decode( self::rv($est, 'ai_analysis', '{}'), true );
        if ( ! is_array($ai) ) $ai = [];

        include LMD_PLUGIN_DIR . 'templates/estimation-detail.php';
    }

    /* ═══════════════════════════════════════════ */
    /* HELPERS                                      */
    /* ═══════════════════════════════════════════ */
    public static function get_overdue_days( $created_at ) {
        if ( empty( $created_at ) || strtotime( $created_at ) === false ) return 0;
        $hours = ( time() - strtotime( $created_at ) ) / 3600;
        if ( $hours <= 48 ) return 0;
        return max( 1, ceil( ($hours - 48) / 24 ) );
    }

    public static function get_interest_badge( $level ) {
        if ( ! $level || ! isset( self::INTEREST_LEVELS[$level] ) ) return '';
        $cfg = self::INTEREST_LEVELS[$level];
        return sprintf(
            '<span class="lmd-interest-badge" style="background:%s;color:%s;border-color:%s"><span class="lmd-interest-dot" style="background:%s"></span>%s</span>',
            $cfg['bg'], $cfg['color'], $cfg['border'], $cfg['dot'], esc_html($cfg['label'])
        );
    }

    /**
     * Resolve photo URLs — handles:
     * 1. Direct HTTP(S) URLs
     * 2. WordPress attachment IDs (numeric)
     * 3. Relative paths (prepends uploads baseurl)
     * 4. Comma-separated values
     * 5. JSON arrays
     */
    public static function resolve_photos( string $json_or_csv ): array {
        $json_or_csv = trim( $json_or_csv );
        if ( $json_or_csv === '' || $json_or_csv === '[]' || $json_or_csv === 'null' ) return [];

        $items = [];

        // Try JSON array first
        $decoded = json_decode( $json_or_csv, true );
        if ( is_array( $decoded ) ) {
            $items = $decoded;
        } else {
            // Try comma-separated
            $items = explode( ',', $json_or_csv );
        }

        $urls = [];
        foreach ( $items as $item ) {
            $item = trim( (string) $item );
            if ( $item === '' ) continue;

            // Numeric = WordPress attachment ID
            if ( is_numeric( $item ) && function_exists('wp_get_attachment_url') ) {
                $url = wp_get_attachment_url( (int) $item );
                if ( $url ) {
                    $urls[] = $url;
                    continue;
                }
                // If attachment not found, try to build URL from metadata
                if ( function_exists('get_attached_file') ) {
                    $file = get_attached_file( (int) $item );
                    if ( $file && file_exists( $file ) ) {
                        $upload_dir = wp_upload_dir();
                        $rel = str_replace( $upload_dir['basedir'], '', $file );
                        $urls[] = $upload_dir['baseurl'] . $rel;
                        continue;
                    }
                }
                // Last resort: skip missing attachment
                error_log("LMD: Attachment ID {$item} not found");
                continue;
            }

            // Full URL
            if ( strpos($item, 'http://') === 0 || strpos($item, 'https://') === 0 ) {
                $urls[] = $item;
                continue;
            }

            // Data URI (base64 encoded)
            if ( strpos($item, 'data:image/') === 0 ) {
                $urls[] = $item;
                continue;
            }

            // Relative path — prepend uploads base URL
            if ( strpos($item, '/') !== false || strpos($item, '.') !== false ) {
                if ( function_exists('wp_upload_dir') ) {
                    $upload_dir = wp_upload_dir();
                    $urls[] = $upload_dir['baseurl'] . '/' . ltrim($item, '/');
                }
                continue;
            }
        }

        return $urls;
    }
}