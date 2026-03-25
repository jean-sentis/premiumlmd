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
            // No reload, just confirm
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

    /* ── AI analysis with stepper ── */
    window.lmdRunAI = function(id, depth) {
        var $loading = $('#ai-loading');
        var $steps = $loading.find('.lmd-step');
        $loading.show();
        var stepIdx = 0;
        var timer = setInterval(function() {
            if (stepIdx < $steps.length) {
                $steps.eq(stepIdx).addClass('is-active');
                if (stepIdx > 0) $steps.eq(stepIdx - 1).removeClass('is-active').addClass('is-done');
                stepIdx++;
            }
        }, 5000);

        lmdAjax('lmd_run_ai', { id: id, depth: depth || 'full' }, function() {
            clearInterval(timer);
            location.reload();
        });
    };

})(jQuery);
