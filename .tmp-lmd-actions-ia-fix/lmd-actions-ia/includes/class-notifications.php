<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Admin notifications: menu badges + daily digest email.
 */
class LMD_Notifications {
    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        // Daily digest scheduling
        add_action('init', [$this, 'schedule_digest']);
        add_action('lmd_daily_digest', [$this, 'send_daily_digest']);
    }

    /**
     * Get the count of new (unread) estimations for menu badges.
     */
    public static function get_new_count(): int {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';
        if ( ! LMD_Schema_Helpers::table_exists($table) ) return 0;
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM `{$table}` WHERE status = 'new'");
    }

    /**
     * Get the count of overdue estimations (>48h without response).
     */
    public static function get_overdue_count(): int {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';
        if ( ! LMD_Schema_Helpers::table_exists($table) ) return 0;
        return (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$table}` WHERE status NOT IN ('responded','archived') AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)"
        );
    }

    /**
     * Schedule daily digest if not already scheduled.
     */
    public function schedule_digest() {
        if ( ! wp_next_scheduled('lmd_daily_digest') ) {
            // Schedule at 8:00 AM local time
            $timestamp = strtotime('tomorrow 08:00:00');
            wp_schedule_event($timestamp, 'daily', 'lmd_daily_digest');
        }
    }

    /**
     * Send the daily digest email to admin.
     */
    public function send_daily_digest() {
        global $wpdb;
        $table = $wpdb->prefix . 'lmd_estimations';
        if ( ! LMD_Schema_Helpers::table_exists($table) ) return;

        $admin_email = get_option('admin_email');
        if ( ! $admin_email ) return;

        // Stats for the last 24 hours
        $new_24h = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$table}` WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );
        $responded_24h = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$table}` WHERE responded_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );
        $total_pending = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$table}` WHERE status NOT IN ('responded','archived')"
        );
        $overdue = self::get_overdue_count();
        $ai_24h = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$wpdb->prefix}lmd_ai_usage` WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );

        // Skip if nothing happened
        if ($new_24h === 0 && $responded_24h === 0 && $total_pending === 0) return;

        // Recent unread estimations
        $recent_unread = $wpdb->get_results(
            "SELECT id, nom, description, created_at FROM `{$table}` WHERE status = 'new' ORDER BY created_at DESC LIMIT 5"
        );

        $site_name = get_bloginfo('name') ?: 'Le Marteau Digital';
        $dashboard_url = admin_url('admin.php?page=lmd-estimations');

        $subject = "[{$site_name}] Résumé quotidien — ";
        if ($new_24h > 0) $subject .= "{$new_24h} nouvelle(s), ";
        if ($overdue > 0) $subject .= "{$overdue} en retard, ";
        $subject .= "{$total_pending} en attente";

        $body = "
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px'>
            <div style='text-align:center;padding:16px;background:#1e3a5f;border-radius:8px 8px 0 0'>
                <h1 style='color:#fff;font-size:20px;margin:0'>📊 Résumé quotidien</h1>
                <p style='color:#93c5fd;font-size:13px;margin:6px 0 0'>" . esc_html($site_name) . " — " . esc_html(date_i18n('d M Y')) . "</p>
            </div>
            <div style='padding:24px;border:1px solid #e2e8f0;border-top:none'>
                <table style='width:100%;border-collapse:collapse;margin-bottom:20px'>
                    <tr>
                        <td style='padding:12px;text-align:center;background:#f0fdf4;border-radius:6px'>
                            <div style='font-size:28px;font-weight:bold;color:#16a34a'>{$new_24h}</div>
                            <div style='font-size:11px;color:#64748b;margin-top:4px'>NOUVELLES (24H)</div>
                        </td>
                        <td style='width:8px'></td>
                        <td style='padding:12px;text-align:center;background:#eff6ff;border-radius:6px'>
                            <div style='font-size:28px;font-weight:bold;color:#2563eb'>{$responded_24h}</div>
                            <div style='font-size:11px;color:#64748b;margin-top:4px'>RÉPONDUES (24H)</div>
                        </td>
                        <td style='width:8px'></td>
                        <td style='padding:12px;text-align:center;background:" . ($overdue > 0 ? '#fef2f2' : '#f9fafb') . ";border-radius:6px'>
                            <div style='font-size:28px;font-weight:bold;color:" . ($overdue > 0 ? '#dc2626' : '#64748b') . "'>{$overdue}</div>
                            <div style='font-size:11px;color:#64748b;margin-top:4px'>EN RETARD</div>
                        </td>
                        <td style='width:8px'></td>
                        <td style='padding:12px;text-align:center;background:#faf5ff;border-radius:6px'>
                            <div style='font-size:28px;font-weight:bold;color:#7c3aed'>{$ai_24h}</div>
                            <div style='font-size:11px;color:#64748b;margin-top:4px'>APPELS IA</div>
                        </td>
                    </tr>
                </table>

                <p style='font-size:14px;color:#334155'><strong>{$total_pending}</strong> demande(s) en attente de traitement.</p>
        ";

        if (!empty($recent_unread)) {
            $body .= "<h3 style='font-size:14px;color:#1e3a5f;margin:20px 0 10px'>📩 Demandes non lues</h3>";
            $body .= "<table style='width:100%;border-collapse:collapse'>";
            foreach ($recent_unread as $r) {
                $detail_url = add_query_arg(['page' => 'lmd-estimations', 'view' => 'detail', 'est_id' => $r->id], admin_url('admin.php'));
                $body .= "<tr style='border-bottom:1px solid #f1f5f9'>";
                $body .= "<td style='padding:8px 0'><a href='" . esc_url($detail_url) . "' style='color:#2563eb;text-decoration:none'><strong>" . esc_html($r->nom ?: 'Sans nom') . "</strong></a></td>";
                $body .= "<td style='padding:8px 0;color:#64748b;font-size:12px'>" . esc_html(mb_strimwidth($r->description ?? '', 0, 50, '…')) . "</td>";
                $body .= "<td style='padding:8px 0;color:#94a3b8;font-size:11px;text-align:right'>" . esc_html(date_i18n('d/m H:i', strtotime($r->created_at))) . "</td>";
                $body .= "</tr>";
            }
            $body .= "</table>";
        }

        $body .= "
                <div style='text-align:center;margin:24px 0'>
                    <a href='" . esc_url($dashboard_url) . "' style='display:inline-block;padding:12px 28px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;font-weight:600'>
                        📋 Voir toutes les demandes
                    </a>
                </div>
            </div>
            <p style='font-size:11px;color:#94a3b8;text-align:center;margin-top:12px'>
                Ce résumé est envoyé chaque jour à 8h. Désactivable dans Réglages.
            </p>
        </div>";

        wp_mail($admin_email, $subject, $body, ['Content-Type: text/html; charset=UTF-8']);
    }

    /**
     * Unschedule digest on deactivation.
     */
    public static function deactivate() {
        wp_clear_scheduled_hook('lmd_daily_digest');
    }
}
