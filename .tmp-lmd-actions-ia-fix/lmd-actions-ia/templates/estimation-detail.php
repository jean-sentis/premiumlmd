<?php if ( ! defined( 'ABSPATH' ) ) exit;
$back_url = admin_url('admin.php?page=lmd-estimations');
$rowv = static function( $row, string $prop, $default = '' ) {
    if ( ! is_object( $row ) || ! property_exists( $row, $prop ) || $row->{$prop} === null ) {
        return $default;
    }
    return $row->{$prop};
};

// Harden against legacy rows with missing columns
$est->nom = (string) $rowv( $est, 'nom', '' );
$est->email = (string) $rowv( $est, 'email', '' );
$est->telephone = (string) $rowv( $est, 'telephone', '' );
$est->description = (string) $rowv( $est, 'description', '' );
$est->photo_urls = (string) $rowv( $est, 'photo_urls', '[]' );
$est->estimated_value = (string) $rowv( $est, 'estimated_value', '' );
$est->status = (string) $rowv( $est, 'status', 'new' );
$est->interest_level = (string) $rowv( $est, 'interest_level', '' );
$est->response_mode = (string) $rowv( $est, 'response_mode', '' );
$est->response_message = (string) $rowv( $est, 'response_message', '' );
$est->delegate_to = (string) $rowv( $est, 'delegate_to', '' );
$est->created_at = (string) $rowv( $est, 'created_at', '' );

$snippets = LMD_Email_Composer::get_snippets_config( $est->nom );
$default_email = LMD_Email_Composer::build_default( $est, $ai );
$photos = json_decode( $est->photo_urls ?: '[]', true );
if ( ! is_array( $photos ) ) $photos = [];
$overdue_days = LMD_Estimation_Manager::get_overdue_days($est->created_at);
$interest_levels = LMD_Estimation_Manager::INTEREST_LEVELS;
$current_interest = $est->interest_level;
$lens_matches = $ai['lens_detection']['visualMatches'] ?? [];
$web_sources = $ai['web_sources'] ?? [];
$ai_questions = $ai['questions_for_owner'] ?? [];

// Nav strip
global $wpdb;
$nav_filter = sanitize_text_field( $_GET['filter'] ?? 'all' );
$nav_where = "WHERE status != 'archived'";
$nav_estimations = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}lmd_estimations {$nav_where} ORDER BY created_at DESC LIMIT 60"
);
?>

<div class="lmd-detail-layout">
    <!-- ═══ Left Nav Strip ═══ -->
    <div class="lmd-nav-strip">
        <div class="lmd-nav-strip__header">
            <a href="<?php echo esc_url($back_url); ?>" class="lmd-nav-strip__back" title="Retour à la liste">← Liste</a>
        </div>
        <div class="lmd-nav-strip__list">
            <?php foreach ( $nav_estimations as $nav ) :
                $is_current = ( (int) $rowv( $nav, 'id', 0 ) === (int) $rowv( $est, 'id', 0 ) );
                $nav_name = (string) $rowv( $nav, 'nom', '' );
                $nav_photos = json_decode((string) $rowv( $nav, 'photo_urls', '[]' ), true);
                if ( ! is_array( $nav_photos ) ) $nav_photos = [];
                $is_nav_responded = ((string) $rowv( $nav, 'status', '' ) === 'responded');
                $detail_url = add_query_arg(['page'=>'lmd-estimations','view'=>'detail','est_id'=>(int) $rowv( $nav, 'id', 0 )], admin_url('admin.php'));
            ?>
            <a href="<?php echo esc_url($detail_url); ?>"
               class="lmd-nav-strip__item <?php echo $is_current ? 'is-current' : ''; ?>">
                <div class="lmd-nav-strip__thumb">
                    <?php if ( ! empty($nav_photos[0]) ) : ?>
                        <img src="<?php echo esc_url($nav_photos[0]); ?>" alt="">
                    <?php else : ?>
                        <span class="dashicons dashicons-format-image" style="opacity:.2;font-size:20px;line-height:40px"></span>
                    <?php endif; ?>
                </div>
                <span class="lmd-nav-strip__name"><?php echo esc_html( mb_strimwidth($nav_name, 0, 12, '…') ); ?></span>
                <?php if ( ! $is_nav_responded ) : ?>
                    <span class="lmd-nav-strip__dot"></span>
                <?php endif; ?>
            </a>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- ═══ Main Detail ═══ -->
    <div class="lmd-detail">
        <!-- Header -->
        <div class="lmd-detail__header">
            <a href="<?php echo esc_url($back_url); ?>" class="lmd-detail__back">← Retour</a>
            <h2 class="lmd-detail__name"><?php echo esc_html($est->nom); ?></h2>
            <span class="lmd-detail__date"><?php echo $est->created_at ? esc_html( date_i18n('d M Y · H:i', strtotime($est->created_at)) ) : '—'; ?></span>

            <div class="lmd-detail__status-bar">
                <?php if ($est->status !== 'new') : ?>
                    <button class="lmd-status-btn" onclick="lmdSetStatus(<?php echo $est->id; ?>, 'new')">📩 Non lu</button>
                <?php else : ?>
                    <button class="lmd-status-btn" onclick="lmdSetStatus(<?php echo $est->id; ?>, 'in_review')">📭 Lu</button>
                <?php endif; ?>
                <span class="lmd-sep"></span>
                <button class="lmd-status-btn <?php echo $est->status === 'responded' ? 'is-active' : ''; ?>"
                        onclick="lmdSetStatus(<?php echo $est->id; ?>, 'responded')">✅ Répondu</button>
                <button class="lmd-status-btn lmd-status-btn--danger"
                        onclick="if(confirm('Supprimer ?')) lmdArchive(<?php echo $est->id; ?>)">🗑</button>
            </div>

            <div class="lmd-detail__tags">
                <?php if ($est->status === 'responded') : ?>
                    <span class="lmd-tag lmd-tag--ok">Répondu</span>
                <?php else : ?>
                    <span class="lmd-tag lmd-tag--pending">En attente</span>
                <?php endif; ?>
                <?php if ($overdue_days > 0) : ?><span class="lmd-tag lmd-tag--danger">+<?php echo $overdue_days; ?>j</span><?php endif; ?>
                <?php echo LMD_Estimation_Manager::get_interest_badge($est->interest_level); ?>
            </div>
        </div>

        <!-- ═══ 3-COLUMN LAYOUT ═══ -->
        <div class="lmd-3col">
            <!-- COL 1: Client info -->
            <div class="lmd-3col__panel lmd-3col__panel--client">
                <h3 class="lmd-panel-title">Client</h3>
                <div class="lmd-client-info">
                    <p><strong><?php echo esc_html($est->nom); ?></strong></p>
                    <p><a href="mailto:<?php echo esc_attr($est->email); ?>"><?php echo esc_html($est->email); ?></a></p>
                    <?php if ($est->telephone) : ?>
                        <p><a href="tel:<?php echo esc_attr($est->telephone); ?>"><?php echo esc_html($est->telephone); ?></a></p>
                    <?php endif; ?>
                    <?php if ($est->estimated_value) : ?>
                        <p>Estimation vendeur : <strong><?php echo esc_html($est->estimated_value); ?></strong></p>
                    <?php endif; ?>
                </div>

                <?php if (!empty($photos)) : ?>
                <div class="lmd-photos-grid">
                    <?php foreach ($photos as $i => $url) : ?>
                        <a href="<?php echo esc_url($url); ?>" target="_blank" class="lmd-photo-thumb">
                            <img src="<?php echo esc_url($url); ?>" alt="Photo <?php echo $i+1; ?>">
                        </a>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <div class="lmd-description-box">
                    <h4>Description</h4>
                    <p><?php echo nl2br(esc_html($est->description)); ?></p>
                </div>
            </div>

            <!-- COL 2: Avis (tabs 1er/2ème) + Intérêt -->
            <div class="lmd-3col__panel lmd-3col__panel--avis">
                <!-- Interest selector -->
                <div class="lmd-interest-selector">
                    <?php foreach ($interest_levels as $key => $cfg) : ?>
                        <button class="lmd-interest-pill <?php echo $current_interest === $key ? 'is-selected' : ''; ?>"
                                style="<?php echo $current_interest === $key ? "background:{$cfg['bg']};color:{$cfg['color']};border-color:{$cfg['border']}" : ''; ?>"
                                onclick="lmdSetInterest(<?php echo $est->id; ?>, '<?php echo esc_js($key); ?>')">
                            <span class="lmd-interest-dot" style="background:<?php echo $cfg['dot']; ?>"></span>
                            <?php echo esc_html($cfg['label']); ?>
                        </button>
                    <?php endforeach; ?>
                </div>

                <!-- Tabs -->
                <div class="lmd-tabs" id="avis-tabs">
                    <button class="lmd-tab is-active" data-tab="tab-1er-avis">1er Avis</button>
                    <button class="lmd-tab" data-tab="tab-2eme-avis">2ème Avis</button>
                </div>
                <div class="lmd-tab-content is-active" id="tab-1er-avis">
                    <h4>Votre avis</h4>
                    <textarea id="notes-textarea" class="lmd-textarea" rows="6"
                              placeholder="Vos observations, estimation, remarques (non visibles par le vendeur)…"><?php echo esc_textarea($est->auctioneer_notes ?? ''); ?></textarea>
                    <button class="button lmd-save-btn" onclick="lmdSaveNotes(<?php echo $est->id; ?>)">Enregistrer</button>
                </div>
                <div class="lmd-tab-content" id="tab-2eme-avis">
                    <h4>2ème avis</h4>
                    <textarea id="opinion-textarea" class="lmd-textarea" rows="6"
                              placeholder="Avis complémentaire, expertise externe…"><?php echo esc_textarea($est->second_opinion ?? ''); ?></textarea>
                    <button class="button lmd-save-btn" onclick="lmdSaveOpinion(<?php echo $est->id; ?>)">Enregistrer</button>
                </div>
            </div>

            <!-- COL 3: Actions (Appeler / Email / Déléguer) -->
            <div class="lmd-3col__panel lmd-3col__panel--actions">
                <h3 class="lmd-panel-title" style="text-align:center">Actions</h3>

                <?php if ($est->status === 'responded') : ?>
                    <div class="lmd-responded-badge">
                        ✅ <?php
                            echo esc_html(($interest_levels[$est->interest_level]['label'] ?? 'Répondu'));
                            if ($est->response_mode === 'phone') echo ' · Appelé';
                            elseif ($est->response_mode === 'email') echo ' · Emailé';
                            elseif ($est->response_mode === 'delegate') echo ' · Délégué';
                        ?>
                    </div>
                <?php endif; ?>

                <div class="lmd-action-buttons">
                    <button class="button lmd-action-btn" id="btn-phone" onclick="lmdShowMode('phone')"
                            <?php echo !$est->telephone ? 'disabled title="Pas de numéro"' : ''; ?>>
                        📞 Appeler
                    </button>
                    <button class="button lmd-action-btn" id="btn-email" onclick="lmdShowMode('email')">
                        ✉️ Email
                    </button>
                    <button class="button lmd-action-btn" id="btn-delegate" onclick="lmdShowMode('delegate')">
                        👥 Déléguer
                    </button>
                </div>

                <!-- Phone mode -->
                <div class="lmd-action-panel" id="panel-phone" style="display:none">
                    <?php if ($est->telephone) : ?>
                        <div class="lmd-phone-box">
                            <a href="tel:<?php echo esc_attr($est->telephone); ?>" class="lmd-phone-link">
                                📞 <?php echo esc_html($est->telephone); ?>
                            </a>
                        </div>
                        <button class="button button-primary" onclick="lmdMarkCalled(<?php echo $est->id; ?>)">
                            Marquer comme appelé
                        </button>
                    <?php endif; ?>
                </div>

                <!-- Email mode -->
                <div class="lmd-action-panel" id="panel-email" style="display:none">
                    <div class="lmd-email-toolbar">
                        <select id="email-snippet" onchange="lmdInsertSnippet()">
                            <option value="">+ Insérer…</option>
                            <optgroup label="Salutations">
                                <?php foreach ($snippets['greetings'] as $key => $text) : ?>
                                    <option value="<?php echo esc_attr($text . "\n\n"); ?>"><?php echo esc_html($key); ?></option>
                                <?php endforeach; ?>
                            </optgroup>
                            <optgroup label="Intentions">
                                <?php foreach ($snippets['intents'] as $key => $text) : ?>
                                    <option value="<?php echo esc_attr($text . "\n\n"); ?>"><?php echo esc_html($key); ?></option>
                                <?php endforeach; ?>
                            </optgroup>
                            <?php if (!empty($ai_questions)) : ?>
                            <optgroup label="IA">
                                <option value="<?php
                                    $q_text = "Pourriez-vous nous préciser :\n";
                                    foreach ($ai_questions as $q) $q_text .= "— $q\n";
                                    echo esc_attr($q_text . "\n");
                                ?>">Questions suggérées (<?php echo count($ai_questions); ?>)</option>
                            </optgroup>
                            <?php endif; ?>
                            <optgroup label="Fermeture">
                                <option value="<?php echo esc_attr($snippets['closing']); ?>">Formule de politesse</option>
                            </optgroup>
                        </select>
                    </div>
                    <textarea id="email-body" class="lmd-textarea lmd-textarea--mono" rows="12"><?php echo esc_textarea($default_email); ?></textarea>
                    <div class="lmd-email-footer">
                        <span>Envoi à : <?php echo esc_html($est->email); ?></span>
                        <button class="button button-primary" onclick="lmdSendEmail(<?php echo $est->id; ?>)">
                            📤 Envoyer
                        </button>
                    </div>
                </div>

                <!-- Delegate mode -->
                <div class="lmd-action-panel" id="panel-delegate" style="display:none">
                    <p class="description">Un email sera ouvert pour envoi au collaborateur.</p>
                    <input type="text" id="delegate-name" placeholder="Nom du collaborateur / expert…" class="regular-text" style="width:100%">
                    <button class="button button-primary" style="margin-top:8px;width:100%"
                            onclick="lmdDelegate(<?php echo $est->id; ?>)">
                        👥 Confier
                    </button>
                </div>

                <!-- Existing response recall -->
                <?php if ($est->response_message && $est->response_mode === 'email') : ?>
                <div class="lmd-recall-box">
                    <h4>Message envoyé</h4>
                    <pre class="lmd-recall-pre"><?php echo esc_html($est->response_message); ?></pre>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- ═══ AI ANALYSIS PANEL (full-width, expandable) ═══ -->
        <div class="lmd-ai-section">
            <button class="lmd-ai-toggle" onclick="document.getElementById('ai-panel').classList.toggle('is-open')">
                ✨ Aide à la décision
                <span class="lmd-ai-toggle__arrow">▼</span>
            </button>

            <div id="ai-panel" class="lmd-ai-panel <?php echo !empty($ai) ? 'is-open' : ''; ?>">
                <?php if (empty($ai) || empty($ai['identified_object'])) : ?>
                    <!-- No analysis yet -->
                    <div class="lmd-ai-empty">
                        <p>Aucune analyse IA effectuée.</p>
                        <button class="button button-primary button-hero" onclick="lmdRunAI(<?php echo $est->id; ?>, 'full')">
                            🚀 Lancer l'analyse complète
                        </button>
                    </div>
                <?php else : ?>
                    <!-- Analysis results -->
                    <div class="lmd-ai-results">
                        <!-- First impression -->
                        <div class="lmd-ai-block lmd-ai-block--highlight">
                            <h4>Première impression</h4>
                            <p class="lmd-ai-object"><strong><?php echo esc_html($ai['identified_object'] ?? '—'); ?></strong></p>
                            <p><?php echo esc_html($ai['summary'] ?? ''); ?></p>
                            <?php if (!empty($ai['estimated_range'])) : ?>
                                <p class="lmd-ai-estimate">Estimation : <strong><?php echo esc_html($ai['estimated_range']); ?></strong></p>
                            <?php endif; ?>
                            <?php if (isset($ai['confidence_score'])) : ?>
                                <span class="lmd-fiabilite-badge lmd-fiabilite-<?php echo (int)$ai['confidence_score']; ?>">
                                    Fiabilité <?php echo (int)$ai['confidence_score']; ?>/5
                                </span>
                            <?php endif; ?>
                        </div>

                        <!-- 5 Chrome-style tabs -->
                        <div class="lmd-chrome-tabs" id="ai-chrome-tabs">
                            <button class="lmd-chrome-tab <?php echo !empty($ai['identity_biography']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-identity">IDENTITÉ</button>
                            <button class="lmd-chrome-tab <?php echo !empty($lens_matches) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-lens">CORRESPONDANCES
                                <?php if (count($lens_matches)) : ?><span class="lmd-chrome-tab__count"><?php echo count($lens_matches); ?></span><?php endif; ?>
                            </button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai['market_insights']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-market">MARCHÉ
                                <?php if (count($web_sources)) : ?><span class="lmd-chrome-tab__count"><?php echo count($web_sources); ?></span><?php endif; ?>
                            </button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai['condition_notes']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-condition">ÉTAT</button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai_questions) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-questions">QUESTIONS
                                <?php if (count($ai_questions)) : ?><span class="lmd-chrome-tab__count"><?php echo count($ai_questions); ?></span><?php endif; ?>
                            </button>
                        </div>

                        <!-- Tab contents -->
                        <div class="lmd-chrome-content" id="ai-tab-identity" style="display:none">
                            <p><?php echo nl2br(esc_html($ai['identity_biography'] ?? 'Pas d\'information disponible.')); ?></p>
                        </div>
                        <div class="lmd-chrome-content" id="ai-tab-lens" style="display:none">
                            <?php if (!empty($photos)) : ?>
                                <h5>Objet à expertiser</h5>
                                <div class="lmd-lens-seller-photos">
                                    <?php foreach (array_slice($photos, 0, 2) as $url) : ?>
                                        <a href="<?php echo esc_url($url); ?>" target="_blank"><img src="<?php echo esc_url($url); ?>" alt=""></a>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                            <?php if (!empty($lens_matches)) : ?>
                                <h5>Correspondances trouvées (<?php echo count($lens_matches); ?>)</h5>
                                <div class="lmd-lens-grid">
                                    <?php foreach ($lens_matches as $i => $match) : ?>
                                        <a href="<?php echo esc_url($match['link']); ?>" target="_blank" class="lmd-lens-card" title="<?php echo esc_attr($match['title']); ?>">
                                            <span class="lmd-lens-num"><?php echo $i+1; ?></span>
                                            <?php if (!empty($match['thumbnail'])) : ?>
                                                <img src="<?php echo esc_url($match['thumbnail']); ?>" alt="">
                                            <?php else : ?>
                                                <span class="dashicons dashicons-format-image" style="opacity:.2;font-size:24px"></span>
                                            <?php endif; ?>
                                            <div class="lmd-lens-overlay">
                                                <span class="lmd-lens-title"><?php echo esc_html(mb_strimwidth($match['title'], 0, 60, '…')); ?></span>
                                                <?php if (!empty($match['price'])) : ?>
                                                    <span class="lmd-lens-price"><?php echo esc_html($match['price']); ?></span>
                                                <?php endif; ?>
                                                <span class="lmd-lens-source"><?php echo esc_html($match['source']); ?></span>
                                            </div>
                                        </a>
                                    <?php endforeach; ?>
                                </div>
                            <?php else : ?>
                                <p class="description">Aucune correspondance trouvée.</p>
                            <?php endif; ?>
                        </div>
                        <div class="lmd-chrome-content" id="ai-tab-market" style="display:none">
                            <p><?php echo nl2br(esc_html($ai['market_insights'] ?? 'Pas d\'information marché.')); ?></p>
                            <?php if (!empty($web_sources)) : ?>
                                <h5>Sources</h5>
                                <ul class="lmd-sources-list">
                                    <?php foreach ($web_sources as $src) : ?>
                                        <li><a href="<?php echo esc_url($src['url']); ?>" target="_blank"><?php echo esc_html($src['title'] ?: parse_url($src['url'], PHP_URL_HOST)); ?></a></li>
                                    <?php endforeach; ?>
                                </ul>
                            <?php endif; ?>
                        </div>
                        <div class="lmd-chrome-content" id="ai-tab-condition" style="display:none">
                            <p><?php echo nl2br(esc_html($ai['condition_notes'] ?? 'Pas de notes sur l\'état.')); ?></p>
                        </div>
                        <div class="lmd-chrome-content" id="ai-tab-questions" style="display:none">
                            <?php if (!empty($ai_questions)) : ?>
                                <ol class="lmd-questions-list">
                                    <?php foreach ($ai_questions as $q) : ?>
                                        <li><?php echo esc_html($q); ?></li>
                                    <?php endforeach; ?>
                                </ol>
                            <?php else : ?>
                                <p class="description">Aucune question suggérée.</p>
                            <?php endif; ?>
                        </div>

                        <?php if (!empty($ai['limitations'])) : ?>
                            <p class="lmd-ai-limitations"><?php echo esc_html($ai['limitations']); ?></p>
                        <?php endif; ?>

                        <div class="lmd-ai-actions">
                            <button class="button" onclick="lmdRunAI(<?php echo $est->id; ?>, 'full')">🔄 Ré-analyser</button>
                        </div>
                    </div>
                <?php endif; ?>
                <div id="ai-loading" class="lmd-ai-loading" style="display:none">
                    <div class="lmd-spinner"></div>
                    <div class="lmd-ai-stepper">
                        <div class="lmd-step" data-step="1">Identification…</div>
                        <div class="lmd-step" data-step="2">Google Lens…</div>
                        <div class="lmd-step" data-step="3">Recherche marché…</div>
                        <div class="lmd-step" data-step="4">Scraping…</div>
                        <div class="lmd-step" data-step="5">Synthèse finale…</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
