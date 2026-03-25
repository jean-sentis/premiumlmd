<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class LMD_AI_Connector {

    /* ─── Triage via Lovable AI Gateway (Gemini Flash) ─── */
    public static function triage( array $data ): array {
        $api_key = get_option('lmd_lovable_api_key', '');
        if ( empty($api_key) ) return ['error' => 'Lovable AI Gateway non configurée'];

        $prompt = self::build_triage_prompt( $data );
        $body = [
            'model' => 'google/gemini-2.5-flash',
            'messages' => [
                ['role' => 'system', 'content' => "Tu es un expert en art et objets de collection. Tu analyses les demandes d'estimation pour un commissaire-priseur. Réponds en JSON structuré."],
                ['role' => 'user', 'content' => $prompt],
            ],
            'tools' => [[
                'type' => 'function',
                'function' => [
                    'name' => 'analyze_estimation',
                    'description' => "Analyse une demande d'estimation d'objet",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'identified_object' => ['type' => 'string', 'description' => "Identification précise de l'objet"],
                            'summary' => ['type' => 'string', 'description' => 'Synthèse en 2-3 phrases'],
                            'recommendation' => ['type' => 'string', 'enum' => array_keys(LMD_Estimation_Manager::INTEREST_LEVELS)],
                            'confidence_score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 5],
                            'estimated_range' => ['type' => 'string', 'description' => 'Fourchette de prix estimée'],
                            'identity_biography' => ['type' => 'string', 'description' => "Biographie de l'artiste/créateur si identifié"],
                            'condition_notes' => ['type' => 'string', 'description' => "Notes sur l'état visible"],
                            'market_insights' => ['type' => 'string', 'description' => 'Tendances marché pertinentes'],
                            'questions_for_owner' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Questions à poser au propriétaire'],
                            'limitations' => ['type' => 'string', 'description' => 'Limites de cette analyse'],
                        ],
                        'required' => ['identified_object', 'summary', 'recommendation', 'confidence_score'],
                        'additionalProperties' => false,
                    ],
                ],
            ]],
            'tool_choice' => ['type' => 'function', 'function' => ['name' => 'analyze_estimation']],
        ];

        // If photos exist, add them as image content
        $photos = json_decode($data['photo_urls'] ?? '[]', true);
        if (!empty($photos)) {
            $img_parts = [];
            foreach (array_slice($photos, 0, 3) as $url) {
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $img_parts[] = ['type' => 'image_url', 'image_url' => ['url' => $url]];
                }
            }
            if (!empty($img_parts)) {
                // Replace last message content with multimodal
                $text_content = $body['messages'][1]['content'];
                $body['messages'][1]['content'] = array_merge(
                    [['type' => 'text', 'text' => $text_content]],
                    $img_parts
                );
            }
        }

        $response = wp_remote_post('https://ai.gateway.lovable.dev/v1/chat/completions', [
            'timeout' => 60,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body' => wp_json_encode($body),
        ]);

        if ( is_wp_error($response) ) return ['error' => $response->get_error_message()];
        $code = wp_remote_retrieve_response_code($response);
        if ($code === 429) return ['error' => 'Limite de requêtes atteinte. Réessayez dans quelques instants.'];
        if ($code === 402) return ['error' => 'Crédits IA épuisés. Rechargez votre espace Lovable.'];
        if ($code >= 400) return ['error' => "Erreur API ($code)"];

        $result = json_decode(wp_remote_retrieve_body($response), true);
        $tool_call = $result['choices'][0]['message']['tool_calls'][0]['function']['arguments'] ?? null;
        if ($tool_call) {
            $parsed = json_decode($tool_call, true);
            if ($parsed) return $parsed;
        }

        return ['error' => 'Réponse IA invalide'];
    }

    /* ─── Google Lens via SerpAPI ─── */
    public static function google_lens( string $image_url ): array {
        $api_key = get_option('lmd_serpapi_key', '');
        if ( empty($api_key) ) return ['error' => 'SerpAPI non configurée'];

        $url = add_query_arg([
            'engine'  => 'google_lens',
            'url'     => $image_url,
            'api_key' => $api_key,
        ], 'https://serpapi.com/search.json');

        $response = wp_remote_get($url, ['timeout' => 30]);
        if ( is_wp_error($response) ) return ['error' => $response->get_error_message()];

        $data = json_decode(wp_remote_retrieve_body($response), true);
        $matches = $data['visual_matches'] ?? [];
        return [
            'visualMatches' => array_slice(array_map(function($m) {
                return [
                    'title'     => $m['title'] ?? '',
                    'link'      => $m['link'] ?? '',
                    'source'    => $m['source'] ?? '',
                    'thumbnail' => $m['thumbnail'] ?? '',
                    'price'     => $m['price']['value'] ?? ($m['price']['extracted_value'] ?? null),
                ];
            }, $matches), 0, 15),
            'total_matches' => count($matches),
        ];
    }

    /* ─── Firecrawl scraping ─── */
    public static function scrape_url( string $url ): array {
        $api_key = get_option('lmd_firecrawl_key', '');
        if ( empty($api_key) ) return ['error' => 'Firecrawl non configurée'];

        $response = wp_remote_post('https://api.firecrawl.dev/v1/scrape', [
            'timeout' => 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body' => wp_json_encode([
                'url' => $url,
                'formats' => ['markdown'],
                'onlyMainContent' => true,
            ]),
        ]);

        if ( is_wp_error($response) ) return ['error' => $response->get_error_message()];
        return json_decode(wp_remote_retrieve_body($response), true) ?: ['error' => 'Réponse vide'];
    }

    /* ─── Synthesis via Gemini Pro ─── */
    public static function synthesize( array $triage, array $lens, array $scraped ): array {
        $api_key = get_option('lmd_lovable_api_key', '');
        if ( empty($api_key) ) return ['error' => 'Lovable AI Gateway non configurée'];

        $context = "Résultats du triage :\n" . wp_json_encode($triage, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if (!empty($lens['visualMatches'])) {
            $context .= "\n\nCorrespondances Google Lens :\n" . wp_json_encode($lens['visualMatches'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
        if (!empty($scraped)) {
            $context .= "\n\nDonnées scrapées :\n" . wp_json_encode($scraped, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }

        $response = wp_remote_post('https://ai.gateway.lovable.dev/v1/chat/completions', [
            'timeout' => 90,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body' => wp_json_encode([
                'model' => 'google/gemini-2.5-pro',
                'messages' => [
                    ['role' => 'system', 'content' => "Tu es un expert en art. Synthétise les informations pour un commissaire-priseur. Format : texte structuré, prix en euros avec séparateurs de milliers. Mentionne les sources fiables (ventes confirmées > estimations > prix galerie). Si doute, utilise 'Sauf erreur...' et présente les hypothèses alternatives."],
                    ['role' => 'user', 'content' => "Synthétise ces résultats d'analyse :\n\n" . $context],
                ],
            ]),
        ]);

        if ( is_wp_error($response) ) return ['error' => $response->get_error_message()];
        $result = json_decode(wp_remote_retrieve_body($response), true);
        $content = $result['choices'][0]['message']['content'] ?? '';
        return ['synthesis' => $content];
    }

    /* ─── Log API usage ─── */
    public static function log_usage( string $action, string $provider, string $model, int $tokens_in, int $tokens_out, float $cost, int $ref_id = 0 ) {
        global $wpdb;
        $wpdb->insert("{$wpdb->prefix}lmd_ai_usage", [
            'service_slug' => 'aide-estimation',
            'action_type'  => $action,
            'provider'     => $provider,
            'model'        => $model,
            'tokens_in'    => $tokens_in,
            'tokens_out'   => $tokens_out,
            'cost_eur'     => $cost,
            'billed_eur'   => $cost * 3.5,
            'ref_id'       => $ref_id,
        ]);
    }

    private static function build_triage_prompt( array $data ): string {
        $desc = $data['description'] ?? 'Non renseignée';
        $cat  = $data['object_category'] ?? '';
        $val  = $data['estimated_value'] ?? '';
        $prompt = "Analyse cette demande d'estimation :\n";
        $prompt .= "Description : $desc\n";
        if ($cat) $prompt .= "Catégorie : $cat\n";
        if ($val) $prompt .= "Estimation vendeur : $val\n";
        $photos = json_decode($data['photo_urls'] ?? '[]', true);
        $prompt .= count($photos) . " photo(s) fournie(s).\n";
        $prompt .= "\nIdentifie l'objet, évalue son intérêt, et donne une fourchette de prix si possible.";
        return $prompt;
    }
}
