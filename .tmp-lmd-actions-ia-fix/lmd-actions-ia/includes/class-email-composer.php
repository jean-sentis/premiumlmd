<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_Email_Composer {

    const GREETING_SNIPPETS = [
        'bonjour'   => 'Bonjour %s,',
        'formel'    => 'Madame, Monsieur,',
    ];

    const INTENT_SNIPPETS = [
        'interessant'    => "Nous avons examiné votre objet avec attention. Il présente un réel intérêt et nous souhaiterions en discuter avec vous pour envisager une mise en vente.",
        'besoin_info'    => "Pour affiner notre analyse, nous aurions besoin de quelques informations complémentaires avant de pouvoir vous faire une proposition.",
        'a_suivre'       => "Votre pièce pourrait trouver sa place dans l'une de nos prochaines ventes thématiques. Nous revenons vers vous prochainement avec une proposition concrète.",
        'hors_cordes'    => "Après examen attentif, cet objet ne correspond pas à notre domaine d'expertise actuel ou aux conditions du marché. Nous vous conseillons de vous rapprocher d'un confrère spécialisé.",
    ];

    const CLOSING = "Nous restons à votre disposition pour tout complément d'information.\n\nCordialement,\nL'équipe";

    public static function get_snippets_config( $seller_name = '' ): array {
        $safe_name = trim( (string) $seller_name );
        return [
            'greetings' => array_map(function($tpl) use ($safe_name) {
                if ( strpos($tpl, '%s') !== false ) {
                    return $safe_name !== '' ? sprintf($tpl, $safe_name) : 'Bonjour,';
                }
                return $tpl;
            }, self::GREETING_SNIPPETS),
            'intents'  => self::INTENT_SNIPPETS,
            'closing'  => self::CLOSING,
        ];
    }

    public static function build_default( $est, $ai = [] ): string {
        $name = trim( (string) ( $est->nom ?? '' ) );
        $msg  = sprintf("Bonjour %s,\n\n", $name !== '' ? $name : 'Madame, Monsieur');
        $msg .= "Nous avons bien reçu votre demande et vous en remercions.\n\n";
        if (!empty($ai['questions_for_owner'])) {
            $msg .= "Pourriez-vous nous préciser :\n";
            foreach ($ai['questions_for_owner'] as $q) {
                $msg .= '— ' . trim((string) $q) . "\n";
            }
            $msg .= "\n";
        }
        $msg .= self::CLOSING;
        return $msg;
    }
}
