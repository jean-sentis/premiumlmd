<?php if ( ! defined( 'ABSPATH' ) ) exit;
$back_url = admin_url('admin.php?page=lmd-estimations');

$snippets = LMD_Email_Composer::get_snippets_config( $est->nom );
$default_email = LMD_Email_Composer::build_default( $est, $ai );
// Resolve photos (handles URLs, attachment IDs, relative paths)
$photos = LMD_Estimation_Manager::resolve_photos( $est->photo_urls );
$overdue_days = LMD_Estimation_Manager::get_overdue_days($est->created_at);
$interest_levels = LMD_Estimation_Manager::INTEREST_LEVELS;
$current_interest = $est->interest_level;
$lens_matches = $ai['lens_detection']['visualMatches'] ?? [];
$web_sources = $ai['web_sources'] ?? [];
$ai_questions = $ai['questions_for_owner'] ?? [];

// Nav strip — fetch all estimations for side navigation
global $wpdb;
$nav_filter = sanitize_text_field( $_GET['filter'] ?? 'all' );
$nav_where = "WHERE status != 'archived'";
$nav_estimations = $wpdb->get_results(
    "SELECT * FROM `{$wpdb->prefix}lmd_estimations` {$nav_where} ORDER BY created_at DESC LIMIT 60"
);

// Debug info
error_log("LMD Detail: Estimation #{$est->id}, photos raw: " . mb_substr($est->photo_urls, 0, 200));
error_log("LMD Detail: Resolved " . count($photos) . " photo URL(s)");
?>

<div class="lmd-detail-layout">
    <!-- ═══ Left Nav Strip ═══ -->
    <div class="lmd-nav-strip">
        <div class="lmd-nav-strip__header">
            <a href="<?php echo esc_url($back_url); ?>" class="lmd-nav-strip__back" title="Retour à la liste">← Liste</a>
        </div>
        <div class="lmd-nav-strip__list">
            <?php foreach ( $nav_estimations as $nav ) :
                $nav_id = (int) (property_exists($nav,'id') ? $nav->id : 0);
                $is_current = ( $nav_id === (int) $est->id );
                $nav_name = property_exists($nav,'nom') && $nav->nom !== null ? (string) $nav->nom : '';
                if ( $nav_name === '' ) {
                    $nav_name = property_exists($nav,'seller_name') && $nav->seller_name !== null ? (string) $nav->seller_name : '';
                }
                if ( $nav_name === '' ) {
                    $nav_name = property_exists($nav,'name') && $nav->name !== null ? (string) $nav->name : '';
                }
                $nav_photos = LMD_Estimation_Manager::resolve_photos(
                    property_exists($nav,'photo_urls') && $nav->photo_urls !== null ? (string) $nav->photo_urls : '[]'
                );
                $nav_status = property_exists($nav,'status') ? (string) $nav->status : '';
                $is_nav_responded = ($nav_status === 'responded');
                $detail_url = add_query_arg(['page'=>'lmd-estimations','view'=>'detail','est_id'=>$nav_id], admin_url('admin.php'));
            ?>
            <a href="<?php echo esc_url($detail_url); ?>"
               class="lmd-nav-strip__item <?php echo $is_current ? 'is-current' : ''; ?>">
                <div class="lmd-nav-strip__thumb">
                    <?php if ( ! empty($nav_photos[0]) ) : ?>
                        <img src="<?php echo esc_url($nav_photos[0]); ?>" alt=""
                             onerror="this.style.display='none'">
                    <?php else : ?>
                        <span class="dashicons dashicons-format-image" style="opacity:.2;font-size:20px;line-height:40px"></span>
                    <?php endif; ?>
                </div>
                <span class="lmd-nav-strip__name"><?php echo esc_html( $nav_name !== '' ? mb_strimwidth($nav_name, 0, 12, '…') : '—' ); ?></span>
                <?php if ( $nav_status === 'new' ) : ?>
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
            <h2 class="lmd-detail__name"><?php echo esc_html($est->nom ?: 'Sans nom'); ?></h2>
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
                        onclick="if(confirm('Archiver cette demande ?')) lmdArchive(<?php echo $est->id; ?>)">🗑️ Archiver</button>
            </div>

            <div class="lmd-detail__tags">
                <?php if ($est->status === 'responded') : ?>
                    <span class="lmd-tag lmd-tag--ok">Répondu</span>
                <?php elseif ($est->status === 'archived') : ?>
                    <span class="lmd-tag" style="background:#f1f5f9;color:#64748b;border-color:#d1d5db">Archivée</span>
                <?php else : ?>
                    <span class="lmd-tag lmd-tag--pending">En attente</span>
                <?php endif; ?>
                <?php if ($overdue_days > 0 && $est->status !== 'responded') : ?><span class="lmd-tag lmd-tag--danger">+<?php echo $overdue_days; ?>j</span><?php endif; ?>
                <?php echo LMD_Estimation_Manager::get_interest_badge($est->interest_level); ?>
                <?php if ($est->object_category) : ?>
                    <span class="lmd-tag lmd-tag--category"><?php echo esc_html(ucfirst(str_replace('_',' ',$est->object_category))); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <!-- ═══ COLOR LEGEND ═══ -->
        <div class="lmd-color-legend">
            <span class="lmd-color-legend__item"><span class="lmd-color-legend__dot lmd-color-legend__dot--ia"></span> IA</span>
            <span class="lmd-color-legend__item"><span class="lmd-color-legend__dot lmd-color-legend__dot--cp"></span> Commissaire-priseur</span>
            <span class="lmd-color-legend__item"><span class="lmd-color-legend__dot lmd-color-legend__dot--2a"></span> 2ème avis</span>
        </div>

        <!-- ═══ SALE & SELLER ASSIGNMENT ═══ -->
        <div class="lmd-assignment-bar">
            <div class="lmd-assignment-item">
                <label>🏷️ Vente :</label>
                <select id="assign-sale" onchange="lmdAssignSale(<?php echo $est->id; ?>, this.value)">
                    <option value="">— Aucune vente —</option>
                    <?php foreach ($all_sales as $s) : ?>
                        <option value="<?php echo (int)$s->id; ?>" <?php selected($est->sale_id, $s->id); ?>>
                            <?php echo esc_html(mb_strimwidth($s->title, 0, 40, '…')); ?>
                            <?php if ($s->sale_date) echo ' (' . esc_html(date_i18n('d/m/Y', strtotime($s->sale_date))) . ')'; ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php if ($current_sale) : ?>
                    <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-estimations', 'filter_sale' => $current_sale->id], admin_url('admin.php'))); ?>"
                       class="lmd-tag lmd-tag--info" style="margin-left:4px">Voir la vente</a>
                <?php endif; ?>
            </div>
            <div class="lmd-assignment-item">
                <label>👤 Vendeur :</label>
                <select id="assign-seller" onchange="lmdAssignSeller(<?php echo $est->id; ?>, this.value)">
                    <option value="">— Aucun vendeur —</option>
                    <?php foreach ($all_sellers as $sel) : ?>
                        <option value="<?php echo (int)$sel->id; ?>" <?php selected($est->seller_id, $sel->id); ?>>
                            <?php echo esc_html($sel->nom); ?>
                            <?php if ($sel->email) echo ' (' . esc_html($sel->email) . ')'; ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <?php if ($current_seller) : ?>
                    <a href="<?php echo esc_url(add_query_arg(['page' => 'lmd-estimations', 'filter_seller' => $current_seller->id], admin_url('admin.php'))); ?>"
                       class="lmd-tag lmd-tag--info" style="margin-left:4px">Voir ses demandes</a>
                <?php endif; ?>
            </div>
        </div>

        <!-- ═══ 3-COLUMN LAYOUT ═══ -->
        <div class="lmd-3col">
            <!-- ▸ COL 1: Client info + Photos -->
            <div class="lmd-3col__panel lmd-3col__panel--client">
                <h3 class="lmd-panel-title">👤 Client</h3>
                <div class="lmd-client-info">
                    <p><strong><?php echo esc_html($est->nom ?: 'Sans nom'); ?></strong></p>
                    <?php if ($est->email) : ?>
                        <p>📧 <a href="mailto:<?php echo esc_attr($est->email); ?>"><?php echo esc_html($est->email); ?></a></p>
                    <?php endif; ?>
                    <?php if ($est->telephone) : ?>
                        <p>📞 <a href="tel:<?php echo esc_attr($est->telephone); ?>"><?php echo esc_html($est->telephone); ?></a></p>
                    <?php endif; ?>
                    <?php if ($est->estimated_value) : ?>
                        <p>💰 Estimation vendeur : <strong><?php echo esc_html($est->estimated_value); ?></strong></p>
                    <?php endif; ?>
                    <?php if ($est->object_category) : ?>
                        <p>🏷️ Catégorie : <span class="lmd-tag lmd-tag--category"><?php echo esc_html(ucfirst(str_replace('_',' ',$est->object_category))); ?></span></p>
                    <?php endif; ?>
                    <?php if ($est->source && $est->source !== 'form') : ?>
                        <p>📥 Source : <span class="lmd-tag lmd-tag--source"><?php echo esc_html($est->source); ?></span></p>
                    <?php endif; ?>
                </div>

                <!-- Photos -->
                <?php if (!empty($photos)) : ?>
                <h4 class="lmd-panel-title" style="margin-top:16px">📷 Photos (<?php echo count($photos); ?>)</h4>
                <div class="lmd-photos-grid">
                    <?php foreach ($photos as $i => $url) : ?>
                        <a href="<?php echo esc_url($url); ?>" target="_blank" class="lmd-photo-thumb">
                            <img src="<?php echo esc_url($url); ?>" alt="Photo <?php echo $i+1; ?>"
                                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect fill=%22%23f1f5f9%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2245%22 text-anchor=%22middle%22 fill=%22%23cbd5e1%22 font-size=%2212%22>Erreur</text></svg>'">
                        </a>
                    <?php endforeach; ?>
                </div>
                <details style="margin-top:8px;font-size:10px;color:#94a3b8">
                    <summary>Debug photos</summary>
                    <pre style="white-space:pre-wrap;word-break:break-all;font-size:10px"><?php echo esc_html(mb_substr($est->photo_urls, 0, 500)); ?></pre>
                </details>
                <?php else : ?>
                <p class="description" style="margin-top:12px">Aucune photo</p>
                <?php endif; ?>

                <div class="lmd-description-box">
                    <h4>📝 Description</h4>
                    <p><?php echo nl2br(esc_html($est->description ?: 'Aucune description.')); ?></p>
                </div>
            </div>

            <!-- ▸ COL 2: Avis (tabs 1er/2ème) + Intérêt — BLUE/PURPLE -->
            <div class="lmd-3col__panel lmd-3col__panel--avis">
                <h3 class="lmd-panel-title lmd-panel-title--cp">⚖️ Avis expert</h3>

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

                <!-- Tabs: 1er Avis (BLUE/CP) / 2ème Avis (PURPLE) -->
                <div class="lmd-tabs" id="avis-tabs">
                    <button class="lmd-tab lmd-tab--cp is-active" data-tab="tab-1er-avis">🔵 1er Avis</button>
                    <button class="lmd-tab lmd-tab--2a" data-tab="tab-2eme-avis">🟣 2ème Avis</button>
                </div>
                <div class="lmd-tab-content lmd-tab-content--cp is-active" id="tab-1er-avis">
                    <h4 style="color:var(--lmd-blue)">Votre avis (Commissaire-priseur)</h4>
                    <textarea id="notes-textarea" class="lmd-textarea lmd-textarea--cp" rows="6"
                              placeholder="Vos observations, estimation, remarques (non visibles par le vendeur)…"><?php echo esc_textarea($est->auctioneer_notes); ?></textarea>
                    <button class="button lmd-save-btn lmd-save-btn--cp" onclick="lmdSaveNotes(<?php echo $est->id; ?>)">💾 Enregistrer</button>
                </div>
                <div class="lmd-tab-content lmd-tab-content--2a" id="tab-2eme-avis">
                    <h4 style="color:var(--lmd-purple)">2ème avis (Expert externe)</h4>
                    <textarea id="opinion-textarea" class="lmd-textarea lmd-textarea--2a" rows="6"
                              placeholder="Avis complémentaire, expertise externe…"><?php echo esc_textarea($est->second_opinion); ?></textarea>
                    <button class="button lmd-save-btn lmd-save-btn--2a" onclick="lmdSaveOpinion(<?php echo $est->id; ?>)">💾 Enregistrer</button>

                    <!-- Magic Link for 2nd opinion -->
                    <div class="lmd-magic-link-box">
                        <h5>🔗 Inviter un expert externe</h5>
                        <p style="font-size:11px;color:var(--lmd-gray);margin:0 0 8px">
                            Envoyez un lien sécurisé à un expert pour qu'il puisse donner son avis directement.
                        </p>
                        <div class="lmd-magic-link-input">
                            <input type="email" id="magic-link-email" placeholder="email@expert.com"
                                   value="<?php echo esc_attr($est->delegate_to ?: ''); ?>">
                            <button class="lmd-magic-link-btn" onclick="lmdSendMagicLink(<?php echo $est->id; ?>)">
                                📤 Envoyer le lien
                            </button>
                        </div>
                        <div id="magic-link-status" class="lmd-magic-link-status"></div>
                        <?php if (!empty($est->magic_link_sent_at)) : ?>
                            <p class="lmd-magic-link-status is-sent">
                                ✓ Lien envoyé le <?php echo esc_html(date_i18n('d/m/Y à H:i', strtotime($est->magic_link_sent_at))); ?>
                                à <?php echo esc_html($est->magic_link_email ?? ''); ?>
                            </p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- ▸ COL 3: Actions (Appeler / Email / Déléguer) -->
            <div class="lmd-3col__panel lmd-3col__panel--actions">
                <h3 class="lmd-panel-title" style="text-align:center">📨 Actions</h3>

                <?php if ($est->status === 'responded') : ?>
                    <div class="lmd-responded-badge">
                        ✅ <?php
                            echo esc_html($interest_levels[$est->interest_level]['label'] ?? 'Répondu');
                            if ($est->response_mode === 'phone') echo ' · Appelé';
                            elseif ($est->response_mode === 'email') echo ' · Emailé';
                            elseif ($est->response_mode === 'delegate') echo ' · Délégué → ' . esc_html($est->delegate_to);
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
                        <button class="button button-primary" style="width:100%" onclick="lmdMarkCalled(<?php echo $est->id; ?>)">
                            ✅ Marquer comme appelé
                        </button>
                    <?php else : ?>
                        <p class="description">Aucun numéro de téléphone renseigné.</p>
                    <?php endif; ?>
                </div>

                <!-- Email mode -->
                <div class="lmd-action-panel" id="panel-email" style="display:none">
                    <div class="lmd-email-toolbar">
                        <select id="email-snippet" onchange="lmdInsertSnippet()">
                            <option value="">+ Insérer un bloc…</option>
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
                            <optgroup label="IA — Questions suggérées">
                                <option value="<?php
                                    $q_text = "Pourriez-vous nous préciser :\n";
                                    foreach ($ai_questions as $q) $q_text .= "— " . trim((string) $q) . "\n";
                                    echo esc_attr($q_text . "\n");
                                ?>">Insérer les <?php echo count($ai_questions); ?> questions</option>
                            </optgroup>
                            <?php endif; ?>
                            <optgroup label="Fermeture">
                                <option value="<?php echo esc_attr($snippets['closing']); ?>">Formule de politesse</option>
                            </optgroup>
                        </select>
                    </div>
                    <textarea id="email-body" class="lmd-textarea lmd-textarea--mono" rows="12"><?php echo esc_textarea($default_email); ?></textarea>
                    <div class="lmd-email-footer">
                        <span>Envoi à : <strong><?php echo esc_html($est->email); ?></strong></span>
                        <button class="button button-primary" onclick="lmdSendEmail(<?php echo $est->id; ?>)">
                            📤 Envoyer
                        </button>
                    </div>
                </div>

                <!-- Delegate mode -->
                <div class="lmd-action-panel" id="panel-delegate" style="display:none">
                    <p class="description">Transférez cette demande à un collaborateur ou expert. Un email sera préparé.</p>
                    <input type="text" id="delegate-name" placeholder="Nom du collaborateur / expert…"
                           value="<?php echo esc_attr($est->delegate_to); ?>"
                           class="regular-text" style="width:100%">
                    <button class="button button-primary" style="margin-top:8px;width:100%"
                            onclick="lmdDelegate(<?php echo $est->id; ?>)">
                        👥 Confier
                    </button>
                </div>

                <!-- Existing response recall -->
                <?php if ($est->response_message && $est->response_mode === 'email') : ?>
                <div class="lmd-recall-box">
                    <h4>📋 Dernier message envoyé</h4>
                    <pre class="lmd-recall-pre"><?php echo esc_html($est->response_message); ?></pre>
                    <small class="description">
                        Envoyé le <?php echo $est->responded_at ? esc_html(date_i18n('d/m/Y à H:i', strtotime($est->responded_at))) : '—'; ?>
                    </small>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- ═══ AI ANALYSIS PANEL (full-width, expandable) — GREEN themed ═══ -->
        <div class="lmd-ai-section">
            <button class="lmd-ai-toggle" onclick="document.getElementById('ai-panel').classList.toggle('is-open')">
                🟢 Aide à la décision (I.A.)
                <span class="lmd-ai-toggle__arrow">▼</span>
            </button>

            <div id="ai-panel" class="lmd-ai-panel <?php echo !empty($ai) && !empty($ai['identified_object']) ? 'is-open' : ''; ?>">
                <?php if (empty($ai) || empty($ai['identified_object'])) : ?>
                    <!-- No analysis yet -->
                    <div class="lmd-ai-empty">
                        <p style="color:#94a3b8;font-size:14px">Aucune analyse IA effectuée pour cette demande.</p>
                        <button class="button button-primary button-hero" style="background:var(--lmd-green);border-color:var(--lmd-green)"
                                onclick="lmdRunAI(<?php echo $est->id; ?>, 'full')">
                            🚀 Lancer l'analyse complète
                        </button>
                        <p class="description" style="margin-top:8px">Identification + Google Lens + Recherche marché + Synthèse</p>
                    </div>
                <?php else : ?>
                    <!-- Analysis results -->
                    <div class="lmd-ai-results">
                        <!-- First impression block -->
                        <div class="lmd-ai-block lmd-ai-block--highlight">
                            <h4>🎯 Première impression</h4>
                            <p class="lmd-ai-object"><strong><?php echo esc_html($ai['identified_object'] ?? '—'); ?></strong></p>
                            <p><?php echo esc_html($ai['summary'] ?? ''); ?></p>
                            <?php if (!empty($ai['estimated_range'])) : ?>
                                <p class="lmd-ai-estimate">💰 Estimation : <strong><?php echo esc_html($ai['estimated_range']); ?></strong></p>
                            <?php endif; ?>
                            <?php if (isset($ai['confidence_score'])) : ?>
                                <span class="lmd-fiabilite-badge lmd-fiabilite-<?php echo (int)$ai['confidence_score']; ?>">
                                    Fiabilité <?php echo (int)$ai['confidence_score']; ?>/5
                                </span>
                            <?php endif; ?>
                            <?php if (!empty($ai['recommendation'])) : ?>
                                <div style="margin-top:8px">
                                    <?php echo LMD_Estimation_Manager::get_interest_badge($ai['recommendation']); ?>
                                </div>
                            <?php endif; ?>
                        </div>

                        <!-- 5 Chrome-style tabs -->
                        <div class="lmd-chrome-tabs" id="ai-chrome-tabs">
                            <button class="lmd-chrome-tab <?php echo !empty($ai['identity_biography']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-identity">🔍 IDENTITÉ</button>
                            <button class="lmd-chrome-tab <?php echo !empty($lens_matches) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-lens">🖼️ CORRESPONDANCES
                                <?php if (count($lens_matches)) : ?><span class="lmd-chrome-tab__count"><?php echo count($lens_matches); ?></span><?php endif; ?>
                            </button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai['market_insights']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-market">📊 MARCHÉ
                                <?php if (count($web_sources)) : ?><span class="lmd-chrome-tab__count"><?php echo count($web_sources); ?></span><?php endif; ?>
                            </button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai['condition_notes']) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-condition">🔬 ÉTAT</button>
                            <button class="lmd-chrome-tab <?php echo !empty($ai_questions) ? 'has-content' : ''; ?>"
                                    data-tab="ai-tab-questions">❓ QUESTIONS
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
                                        <a href="<?php echo esc_url($url); ?>" target="_blank">
                                            <img src="<?php echo esc_url($url); ?>" alt=""
                                                 onerror="this.style.display='none'">
                                        </a>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                            <?php if (!empty($lens_matches)) : ?>
                                <h5>Correspondances trouvées (<?php echo count($lens_matches); ?>)</h5>
                                <div class="lmd-lens-grid">
                                    <?php foreach ($lens_matches as $i => $match) : ?>
                                        <a href="<?php echo esc_url($match['link'] ?? '#'); ?>" target="_blank" class="lmd-lens-card" title="<?php echo esc_attr($match['title'] ?? ''); ?>">
                                            <span class="lmd-lens-num"><?php echo $i+1; ?></span>
                                            <?php if (!empty($match['thumbnail'])) : ?>
                                                <img src="<?php echo esc_url($match['thumbnail']); ?>" alt=""
                                                     onerror="this.style.display='none'">
                                            <?php else : ?>
                                                <span class="dashicons dashicons-format-image" style="opacity:.2;font-size:24px"></span>
                                            <?php endif; ?>
                                            <div class="lmd-lens-overlay">
                                                <span class="lmd-lens-title"><?php echo esc_html(mb_strimwidth($match['title'] ?? '', 0, 60, '…')); ?></span>
                                                <?php if (!empty($match['price'])) : ?>
                                                    <span class="lmd-lens-price"><?php echo esc_html($match['price']); ?></span>
                                                <?php endif; ?>
                                                <span class="lmd-lens-source"><?php echo esc_html($match['source'] ?? ''); ?></span>
                                            </div>
                                        </a>
                                    <?php endforeach; ?>
                                </div>
                            <?php else : ?>
                                <p class="description">Aucune correspondance trouvée. Lancez l'analyse pour rechercher.</p>
                            <?php endif; ?>
                        </div>
                        <div class="lmd-chrome-content" id="ai-tab-market" style="display:none">
                            <p><?php echo nl2br(esc_html($ai['market_insights'] ?? 'Pas d\'information marché.')); ?></p>
                            <?php if (!empty($web_sources)) : ?>
                                <h5>Sources web consultées</h5>
                                <ul class="lmd-sources-list">
                                    <?php foreach ($web_sources as $src) : ?>
                                        <li><a href="<?php echo esc_url($src['url'] ?? '#'); ?>" target="_blank"><?php echo esc_html(($src['title'] ?? '') ?: parse_url($src['url'] ?? '', PHP_URL_HOST)); ?></a></li>
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
                            <p class="lmd-ai-limitations">⚠️ <?php echo esc_html($ai['limitations']); ?></p>
                        <?php endif; ?>

                        <div class="lmd-ai-actions">
                            <button class="button" style="background:var(--lmd-green);color:#fff;border-color:var(--lmd-green)"
                                    onclick="lmdRunAI(<?php echo $est->id; ?>, 'full')">🔄 Ré-analyser</button>
                            <?php if (!empty($ai['ai_analyzed_at']) || !empty($est->ai_analyzed_at)) : ?>
                                <span class="description" style="margin-left:8px">
                                    Dernière analyse : <?php echo esc_html(date_i18n('d/m/Y à H:i', strtotime($est->ai_analyzed_at ?? ''))); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <div id="ai-loading" class="lmd-ai-loading" style="display:none">
                    <div class="lmd-spinner"></div>
                    <p style="font-size:13px;color:#64748b">Analyse en cours… Cela peut prendre 30 à 60 secondes.</p>
                    <div class="lmd-ai-stepper">
                        <div class="lmd-step" data-step="1">🔍 Identification…</div>
                        <div class="lmd-step" data-step="2">🖼️ Google Lens…</div>
                        <div class="lmd-step" data-step="3">📊 Recherche marché…</div>
                        <div class="lmd-step" data-step="4">🌐 Scraping…</div>
                        <div class="lmd-step" data-step="5">✨ Synthèse finale…</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
