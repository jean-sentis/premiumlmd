(function($) {
    'use strict';

    /* ── Tabs (Avis + Chrome) ── */
    $(document).on('click', '.lmd-tab', function() {
        var $btn = $(this), tabId = $btn.data('tab');
        $btn.addClass('is-active').siblings().removeClass('is-active');
        $('#' + tabId).addClass('is-active').siblings('.lmd-tab-content').removeClass('is-active');
    });
    $(document).on('click', '.lmd-chrome-tab', function() {
        var $btn = $(this), tabId = $btn.data('tab');
        var wasActive = $btn.hasClass('is-active');
        $btn.closest('.lmd-ai-results').find('.lmd-chrome-tab').removeClass('is-active');
        $btn.closest('.lmd-ai-results').find('.lmd-chrome-content').hide();
        if (!wasActive) {
            $btn.addClass('is-active');
            $('#' + tabId).show();
        }
    });

    /* ── AJAX helpers ── */
    function lmdAjax(action, data, callback) {
        data.action = action;
        data.nonce = lmdAdmin.nonce;
        $.post(lmdAdmin.ajaxUrl, data, function(resp) {
            if (resp.success) {
                if (callback) callback(resp.data);
                else location.reload();
            } else {
                alert(resp.data || 'Erreur');
            }
        }).fail(function() { alert('Erreur réseau'); });
    }

    /* ── Global functions ── */
    window.lmdSetStatus = function(id, status) {
        lmdAjax('lmd_update_status', { id: id, status: status });
    };
    window.lmdArchive = function(id) {
        lmdAjax('lmd_archive', { id: id }, function() {
            window.location.href = lmdAdmin.ajaxUrl.replace('admin-ajax.php', 'admin.php?page=lmd-estimations');
        });
    };
    window.lmdSaveNotes = function(id) {
        lmdAjax('lmd_save_notes', { id: id, notes: $('#notes-textarea').val() }, function() {
            alert('Notes enregistrées ✓');
        });
    };
    window.lmdSaveOpinion = function(id) {
        lmdAjax('lmd_save_second_opinion', { id: id, opinion: $('#opinion-textarea').val() }, function() {
            alert('2ème avis enregistré ✓');
        });
    };
    window.lmdSetInterest = function(id, level) {
        lmdAjax('lmd_set_interest', { id: id, level: level });
    };
    window.lmdSendEmail = function(id) {
        var msg = $('#email-body').val();
        if (!msg.trim()) { alert('Rédigez un message'); return; }
        lmdAjax('lmd_send_response', { id: id, message: msg, interest: '' });
    };
    window.lmdMarkCalled = function(id) {
        lmdAjax('lmd_update_status', { id: id, status: 'responded' });
    };
    window.lmdDelegate = function(id) {
        var name = $('#delegate-name').val();
        if (!name.trim()) { alert('Entrez un nom'); return; }
        lmdAjax('lmd_delegate', { id: id, delegate_to: name }, function(data) {
            if (data && data.mailto) window.open(data.mailto, '_blank');
            location.reload();
        });
    };
    window.lmdInsertSnippet = function() {
        var val = $('#email-snippet').val();
        if (!val) return;
        var $ta = $('#email-body');
        var pos = $ta[0].selectionStart || $ta.val().length;
        var text = $ta.val();
        $ta.val(text.slice(0, pos) + val + text.slice(pos));
        $ta[0].selectionStart = $ta[0].selectionEnd = pos + val.length;
        $ta.focus();
        $('#email-snippet').val('');
    };
    window.lmdShowMode = function(mode) {
        $('.lmd-action-panel').hide();
        $('.lmd-action-btn').removeClass('is-active');
        $('#panel-' + mode).show();
        $('#btn-' + mode).addClass('is-active');
    };

    /* ── Assign sale / seller ── */
    window.lmdAssignSale = function(id, saleId) {
        lmdAjax('lmd_assign_sale', { id: id, sale_id: saleId || 0 }, function() {
            var $sel = $('#assign-sale');
            $sel.css('border-color', '#22c55e');
            setTimeout(function() { $sel.css('border-color', ''); }, 1500);
        });
    };
    window.lmdAssignSeller = function(id, sellerId) {
        lmdAjax('lmd_assign_seller', { id: id, seller_id: sellerId || 0 }, function() {
            var $sel = $('#assign-seller');
            $sel.css('border-color', '#22c55e');
            setTimeout(function() { $sel.css('border-color', ''); }, 1500);
        });
    };

    /* ══════════════════════════════════════════════ */
    /* MULTI-SELECT / BULK ACTIONS                     */
    /* ══════════════════════════════════════════════ */
    window.lmdUpdateBulkCount = function() {
        var $checked = $('.lmd-bulk-check:checked');
        var count = $checked.length;
        var $bar = $('#lmd-bulk-bar');

        if (count > 0) {
            $bar.show();
        } else {
            $bar.hide();
        }
        $('#lmd-bulk-count').text(count + ' sélectionné(s)');
        $('.lmd-bulk-num').text(count);

        // Visual feedback on selected cards
        $('.lmd-est-card-wrapper').each(function() {
            var $cb = $(this).find('.lmd-bulk-check');
            $(this).toggleClass('is-selected', $cb.is(':checked'));
        });
    };

    window.lmdToggleSelectAll = function(el) {
        var checked = el.checked;
        $('.lmd-bulk-check').prop('checked', checked);
        lmdUpdateBulkCount();
    };

    window.lmdBulkCancel = function() {
        $('.lmd-bulk-check').prop('checked', false);
        $('#lmd-selectall').prop('checked', false);
        lmdUpdateBulkCount();
    };

    window.lmdBulkAI = function() {
        var ids = [];
        $('.lmd-bulk-check:checked').each(function() { ids.push($(this).val()); });
        if (ids.length === 0) { alert('Sélectionnez au moins une demande'); return; }
        if (!confirm('Lancer l\'analyse IA sur ' + ids.length + ' demande(s) ?\n\nCela peut prendre plusieurs minutes.')) return;

        // Sequential AI launch
        var $bar = $('#lmd-bulk-bar');
        $bar.find('.lmd-bulk-btn--ai').prop('disabled', true).text('⏳ En cours…');
        var idx = 0;
        function nextAI() {
            if (idx >= ids.length) {
                alert('Analyse terminée pour ' + ids.length + ' demande(s) ✓');
                location.reload();
                return;
            }
            $('#lmd-bulk-count').text('Analyse ' + (idx + 1) + '/' + ids.length + '…');
            lmdAjax('lmd_run_ai', { id: ids[idx], depth: 'full' }, function() {
                idx++;
                nextAI();
            });
        }
        nextAI();
    };

    window.lmdBulkDelete = function() {
        var ids = [];
        $('.lmd-bulk-check:checked').each(function() { ids.push($(this).val()); });
        if (ids.length === 0) { alert('Sélectionnez au moins une demande'); return; }
        if (!confirm('⚠️ Supprimer définitivement ' + ids.length + ' demande(s) ?\n\nCette action est irréversible.')) return;
        if (!confirm('Êtes-vous vraiment sûr ? ' + ids.length + ' demande(s) seront supprimées.')) return;

        lmdAjax('lmd_bulk_delete', { ids: ids }, function() {
            alert(ids.length + ' demande(s) supprimée(s) ✓');
            location.reload();
        });
    };

    /* ══════════════════════════════════════════════ */
    /* MAGIC LINK (2nd opinion)                        */
    /* ══════════════════════════════════════════════ */
    window.lmdSendMagicLink = function(id) {
        var email = $('#magic-link-email').val().trim();
        if (!email || email.indexOf('@') === -1) {
            $('#magic-link-status').text('Veuillez saisir un email valide').removeClass('is-sent').addClass('is-error');
            return;
        }
        $('#magic-link-status').text('Envoi en cours…').removeClass('is-sent is-error');
        lmdAjax('lmd_send_magic_link', { id: id, email: email }, function(data) {
            $('#magic-link-status')
                .text('✓ Lien envoyé à ' + email)
                .addClass('is-sent')
                .removeClass('is-error');
        });
    };

    /* ══════════════════════════════════════════════ */
    /* AI analysis with stepper + progressive green    */
    /* ══════════════════════════════════════════════ */
    window.lmdRunAI = function(id, depth) {
        var $loading = $('#ai-loading');
        var $steps = $loading.find('.lmd-step');
        var $chromeTabs = $('#ai-chrome-tabs .lmd-chrome-tab');
        $loading.show();
        var stepIdx = 0;

        // Progressive green tinting thresholds (ms): ID, Matches, Marché, Scraping, Synthèse
        var thresholds = [5000, 13000, 25000, 45000, 85000];
        var startTime = Date.now();

        var timer = setInterval(function() {
            var elapsed = Date.now() - startTime;

            // Update steps
            if (stepIdx < $steps.length) {
                $steps.eq(stepIdx).addClass('is-active');
                if (stepIdx > 0) $steps.eq(stepIdx - 1).removeClass('is-active').addClass('is-done');
                stepIdx++;
            }

            // Progressive green tinting on chrome tabs
            for (var t = 0; t < thresholds.length; t++) {
                if (elapsed >= thresholds[t] && $chromeTabs.eq(t).length) {
                    $chromeTabs.eq(t)
                        .css('border-top', '3px solid #22c55e')
                        .addClass('has-content');
                }
            }

            // Show spinner on currently processing tab
            $chromeTabs.removeClass('is-loading');
            for (var u = thresholds.length - 1; u >= 0; u--) {
                if (elapsed >= thresholds[u] && u + 1 < thresholds.length && elapsed < thresholds[u + 1]) {
                    $chromeTabs.eq(u + 1).addClass('is-loading');
                    break;
                }
            }
            if (elapsed < thresholds[0] && $chromeTabs.eq(0).length) {
                $chromeTabs.eq(0).addClass('is-loading');
            }
        }, 1000);

        lmdAjax('lmd_run_ai', { id: id, depth: depth || 'full' }, function() {
            clearInterval(timer);
            location.reload();
        });
    };

    /* ══════════════════════════════════════════════ */
    /* CSV EXPORT                                       */
    /* ══════════════════════════════════════════════ */
    window.lmdExportCSV = function(filter) {
        lmdAjax('lmd_export_csv', { filter: filter || 'all' }, function(data) {
            var blob = new Blob(['\uFEFF' + data.csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = data.filename || 'estimations.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    /* ══════════════════════════════════════════════ */
    /* SEARCH SIMILAR                                   */
    /* ══════════════════════════════════════════════ */
    window.lmdSearchSimilar = function(id) {
        var $box = $('#lmd-similar-results');
        $box.html('<p style="color:#64748b">🔍 Recherche en cours…</p>').show();
        lmdAjax('lmd_search_similar', { id: id }, function(data) {
            if (!data.results || data.results.length === 0) {
                $box.html('<p style="color:#94a3b8">Aucune demande similaire trouvée.</p>');
                return;
            }
            var html = '<h4>🔗 Demandes similaires (' + data.results.length + ')</h4><ul class="lmd-similar-list">';
            data.results.forEach(function(r) {
                var url = lmdAdmin.ajaxUrl.replace('admin-ajax.php', 'admin.php?page=lmd-estimations&view=detail&est_id=' + r.id);
                html += '<li><a href="' + url + '">' + (r.nom || '#' + r.id) + '</a>';
                html += ' <span class="lmd-tag lmd-tag--category">' + r.match_type + '</span>';
                if (r.interest) html += ' ' + r.interest;
                html += '<br><small style="color:#94a3b8">' + (r.description || '') + '</small></li>';
            });
            html += '</ul>';
            $box.html(html);
        });
    };

})(jQuery);
