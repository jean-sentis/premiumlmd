<?php if ( ! defined( 'ABSPATH' ) ) exit;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('lmd_settings')) {
    update_option('lmd_lovable_api_key', sanitize_text_field($_POST['lmd_lovable_api_key'] ?? ''));
    update_option('lmd_serpapi_key',     sanitize_text_field($_POST['lmd_serpapi_key'] ?? ''));
    update_option('lmd_firecrawl_key',   sanitize_text_field($_POST['lmd_firecrawl_key'] ?? ''));
    echo '<div class="notice notice-success"><p>Réglages enregistrés.</p></div>';
}
?>
<div class="wrap lmd-wrap">
    <h1>Réglages — LMD Actions I.A.</h1>
    <form method="post">
        <?php wp_nonce_field('lmd_settings'); ?>
        <div class="lmd-settings-card">
            <h2>Clés API</h2>
            <p class="description">Configurez vos clés pour activer les services d'analyse IA.</p>
            <table class="form-table">
                <tr>
                    <th>Lovable AI Gateway</th>
                    <td>
                        <input type="password" name="lmd_lovable_api_key" value="<?php echo esc_attr(get_option('lmd_lovable_api_key','')); ?>" class="regular-text" autocomplete="off">
                        <p class="description">Clé pour Gemini Flash & Pro (triage + synthèse)</p>
                    </td>
                </tr>
                <tr>
                    <th>SerpAPI</th>
                    <td>
                        <input type="password" name="lmd_serpapi_key" value="<?php echo esc_attr(get_option('lmd_serpapi_key','')); ?>" class="regular-text" autocomplete="off">
                        <p class="description">Google Lens & recherche web (optionnel)</p>
                    </td>
                </tr>
                <tr>
                    <th>Firecrawl</th>
                    <td>
                        <input type="password" name="lmd_firecrawl_key" value="<?php echo esc_attr(get_option('lmd_firecrawl_key','')); ?>" class="regular-text" autocomplete="off">
                        <p class="description">Scraping approfondi des résultats (optionnel)</p>
                    </td>
                </tr>
            </table>
        </div>
        <?php submit_button('Enregistrer les réglages'); ?>
    </form>
</div>
