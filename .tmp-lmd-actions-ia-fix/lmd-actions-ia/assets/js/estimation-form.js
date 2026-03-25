(function($) {
    // Photo preview
    $(document).on('change', '#lmd-photos', function() {
        var $preview = $('#lmd-photo-preview').empty();
        var files = this.files;
        if (files.length > 5) { alert('Maximum 5 photos'); this.value = ''; return; }
        for (var i = 0; i < files.length; i++) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $preview.append('<img src="' + e.target.result + '">');
            };
            reader.readAsDataURL(files[i]);
        }
    });

    // Form submit
    $(document).on('submit', '#lmd-estimation-form', function(e) {
        e.preventDefault();
        var $form = $(this), $msg = $('#lmd-form-message');
        var formData = new FormData(this);
        formData.append('action', 'lmd_submit_estimation');
        formData.append('nonce', lmdEstForm.nonce);

        $form.find('button[type=submit]').prop('disabled', true).text('Envoi en cours…');

        $.ajax({
            url: lmdEstForm.ajaxUrl,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(resp) {
                if (resp.success) {
                    $msg.removeClass('is-error').addClass('is-success').text(resp.data.message).show();
                    $form[0].reset();
                    $('#lmd-photo-preview').empty();
                } else {
                    $msg.removeClass('is-success').addClass('is-error').text(resp.data || 'Erreur').show();
                }
            },
            error: function() {
                $msg.removeClass('is-success').addClass('is-error').text('Erreur réseau').show();
            },
            complete: function() {
                $form.find('button[type=submit]').prop('disabled', false).text('Envoyer ma demande');
            }
        });
    });
})(jQuery);
