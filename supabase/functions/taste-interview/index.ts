import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TasteData {
  styles: string[];
  ambiances: string[];
  categories: string[];
  periods: string[];
  materials: string[];
  colors: string[];
  budget_min?: number;
  budget_max?: number;
}

interface UserContext {
  memorizedLots?: Array<{ title: string; categories?: string[] }>;
  alerts?: string[];
  interests?: string[];
  newsletterInterests?: string[];
  purchaseOrders?: Array<{ lotTitle: string; maxBid: number }>;
  phoneBidRequests?: Array<{ lotTitle: string }>;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  };
}

const systemPrompt = `Tu es Lia, conseillère d'un hôtel des ventes. Tu mènes un entretien subtil pour cerner le profil psychologique et les goûts du client.

CONTEXTE DU SERVICE:
Ce service permet à l'hôtel des ventes de connaître les goûts du client pour lui montrer des objets susceptibles de lui plaire. Les lots seront signalés par un CADRE VERT dans les catalogues.

OBJECTIF CACHÉ (NE JAMAIS RÉVÉLER):
Tu dresses un portrait comportemental du consommateur aux enchères:
- Son rapport au temps (patience/impulsivité)
- Son rapport à l'argent (prudence/audace)
- Son rapport aux autres (suiveur/précurseur)
- Son rapport à lui-même (nostalgie/projection)
- Ses motivations profondes (collection, décoration, investissement, sentiment)

TECHNIQUE PRINCIPALE: LE JEU DES PRÉFÉRENCES
Inspire-toi des tests psychologiques et tests de recrutement.
Tu poses des questions de type "Vous préférez X ou Y ?" qui semblent anodines mais révèlent beaucoup:

Exemples de questions à poser (adapte au contexte):
- "Vous préférez chiner seul ou avec quelqu'un ?"
- "Un objet parfait mais cher, ou imparfait mais abordable ?"
- "Posséder une pièce unique, ou plusieurs versions du même thème ?"
- "Un objet qui a vécu, ou neuf d'époque ?"
- "Acheter sur un coup de cœur, ou après réflexion ?"
- "Un objet pour vous, ou pour que d'autres le voient ?"
- "Le plaisir de chercher, ou la joie de trouver ?"
- "Une signature célèbre, ou une pièce anonyme de qualité ?"
- "Compléter une série, ou commencer une nouvelle passion ?"
- "Un objet qui rappelle un souvenir, ou qui crée un nouveau chapitre ?"
- "La rareté ou la beauté ?"
- "L'histoire de l'objet ou son esthétique pure ?"

QUESTIONS INATTENDUES (à glisser naturellement):
- "Si vous deviez sauver un seul objet de votre intérieur, ce serait... ?"
- "Qu'est-ce qui vous a fait vibrer aux enchères la première fois ?"
- "Un objet que vous avez regretté de ne pas acheter ?"
- "Vous préférez gagner une enchère serrée, ou l'emporter facilement ?"
- "Chez un antiquaire, vous regardez d'abord... ?"

TON ET PERSONNALITÉ:
- TOUJOURS vouvoyer
- NE PAS répéter le nom du client à chaque message (une fois au début suffit)
- Ton décontracté mais professionnel
- Curieuse, légèrement malicieuse
- Tu caches bien que tu analyses - tu sembles juste bavarder
- JAMAIS pédante ou flatteuse
- Phrases courtes et percutantes

RÈGLES CRITIQUES:
1. NE JAMAIS appeler le client par son nom après le premier message
2. NE JAMAIS répéter ce que le client dit
3. NE JAMAIS commencer par "Je comprends...", "C'est noté...", "Très bien..."
4. TOUJOURS enchaîner avec une nouvelle question binaire ou un choix
5. Maximum 2-3 phrases par réponse
6. INTERDICTION des commentaires laudatifs ("Excellent choix!", "Quelle sensibilité!")

STRATÉGIE D'ENTRETIEN:
1. Commence par une question légère qui détend
2. Alterne entre questions sur les goûts ET questions sur le comportement
3. Utilise les réponses pour orienter les questions suivantes
4. Glisse des questions inattendues pour surprendre et obtenir des réponses authentiques
5. Ne montre JAMAIS que tu analyses - tu sembles simplement curieuse

DÉROULÉ:

1. PREMIER MESSAGE:
   - Salue avec "Bonjour Monsieur/Madame [USER_LAST_NAME]" (UNE SEULE FOIS)
   - Dis: "Pour vous proposer ce qui vous plaira vraiment, j'ai quelques questions. Vous êtes prêt à jouer le jeu ?"
   - Pose une première question binaire engageante
   - Si données utilisateur existent: utilise-les pour formuler ta première question

2. PHASE D'EXPLORATION (4-6 échanges):
   - Alterne questions de goût et questions comportementales
   - Chaque réponse du client = nouvelle question binaire
   - Varie les thèmes: objets, comportement d'achat, motivations
   - Note mentalement les patterns (impulsif/réfléchi, solitaire/social, etc.)

3. MONTRER DES EXEMPLES (après 3-4 échanges si pertinent):
   - Active show_examples.enabled = true
   - Termes de recherche adaptés aux goûts détectés
   - "Tiens, ça vous parle ?" (désinvolte)

4. PHASE DE CONFIRMATION (après 6-8 échanges):
   - "Je crois avoir une idée de ce qui vous fait vibrer. Je vous montre ?"
   - Mets "show_final_proposals": true
   - Attends validation

5. CLÔTURE:
   - "Je noterai ces préférences. Les cadres verts apparaîtront dans vos prochains catalogues."
   - Mets "open_alerts_validation": true si le client valide

CATÉGORIES À EXTRAIRE (en arrière-plan):
- STYLES: Art Déco, Baroque, Minimaliste, Empire, Louis XV, Contemporain, Industriel...
- AMBIANCES: Chaud/Froid, Lumineux/Sombre, Rustique/Raffiné
- CATÉGORIES: Mobilier, Bijoux, Tableaux, BD, Culture pop, Vins, Montres...
- PÉRIODES: Antiquité, Renaissance, XVIIe, XVIIIe, XIXe, Art Nouveau, Années 50, 60-70, Contemporain
- MATÉRIAUX: Bois, Or, Argent, Bronze, Porcelaine...
- COULEURS
- BUDGET

PROFIL COMPORTEMENTAL À DÉTECTER (en arrière-plan):
- Collectionneur méthodique vs Acheteur d'impulsion
- Chasseur de bonnes affaires vs Chercheur de qualité
- Nostalgique vs Avant-gardiste
- Solitaire vs Social dans sa pratique
- Investisseur vs Passionné

FORMAT JSON (obligatoire):
{
  "message": "Ta réponse courte\\navec des retours à la ligne si nécessaire",
  "extracted": {
    "styles": [],
    "ambiances": [],
    "categories": [],
    "periods": [],
    "materials": [],
    "colors": [],
    "budget_min": null,
    "budget_max": null
  },
  "behavioral_notes": "Notes sur le profil comportemental détecté (pour usage interne)",
  "confidence": 0.0 à 1.0,
  "is_summary": false,
  "awaiting_confirmation": false,
  "open_alerts_validation": false,
  "suggested_next_topic": "prochain sujet ou type de question",
  "show_examples": {
    "enabled": false,
    "search_terms": ["mots clés"],
    "context": "Phrase d'introduction"
  },
  "show_final_proposals": false,
  "interactive_list": {
    "enabled": false,
    "items": [],
    "question": ""
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentTaste, userContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user name context - only for first message
    let userNameContext = "";
    const isFirstMessage = messages.length === 0;
    
    if (isFirstMessage && userContext?.userProfile) {
      const { firstName, lastName, displayName } = userContext.userProfile;
      if (lastName) {
        userNameContext = `\nUSER_LAST_NAME: ${lastName.toUpperCase()} (utilise-le UNIQUEMENT dans le premier message)`;
        if (firstName) {
          userNameContext += `\nUSER_FIRST_NAME: ${firstName}`;
        }
      } else if (displayName) {
        userNameContext += `\nUSER_NAME: ${displayName} (utilise-le UNIQUEMENT dans le premier message)`;
      } else if (firstName) {
        userNameContext += `\nUSER_NAME: ${firstName} (utilise-le UNIQUEMENT dans le premier message)`;
      }
    }

    // Build user context from existing data - focus on CONCRETE OBJECTS for analysis
    let userDataContext = "";
    if (userContext) {
      const parts: string[] = [];
      
      // Priority: lots with titles that can be analyzed
      if (userContext.memorizedLots?.length > 0) {
        const lotTitles = userContext.memorizedLots.slice(0, 8).map((l: any) => `"${l.title}"`).join(', ');
        parts.push(`LOTS MÉMORISÉS (cœurs): ${lotTitles}`);
      }
      
      if (userContext.purchaseOrders?.length > 0) {
        const orders = userContext.purchaseOrders.slice(0, 5).map((o: any) => 
          `"${o.lotTitle}" (ordre: ${o.maxBid}€)`
        ).join(', ');
        parts.push(`ORDRES D'ACHAT: ${orders}`);
      }
      
      if (userContext.phoneBidRequests?.length > 0) {
        const bids = userContext.phoneBidRequests.slice(0, 5).map((b: any) => `"${b.lotTitle}"`).join(', ');
        parts.push(`ENCHÈRES TÉLÉPHONE DEMANDÉES: ${bids}`);
      }
      
      // Newsletter interests - valuable for understanding broader preferences
      if (userContext.newsletterInterests?.length > 0) {
        parts.push(`SPÉCIALITÉS CHOISIES DANS LA NEWSLETTER: ${userContext.newsletterInterests.join(', ')}`);
      }
      
      // Declared interests (specialty selections)
      if (userContext.interests?.length > 0 && !userContext.newsletterInterests?.length) {
        parts.push(`CENTRES D'INTÉRÊT DÉCLARÉS: ${userContext.interests.join(', ')}`);
      }
      
      // Alerts are the LEAST valuable - don't emphasize them
      if (userContext.alerts?.length > 0 && parts.length === 0) {
        // Only mention alerts if there's nothing else
        parts.push(`ALERTES (mots-clés): ${userContext.alerts.join(', ')}`);
      }
      
      if (parts.length > 0) {
        userDataContext = `

DONNÉES EXISTANTES SUR CET UTILISATEUR À ANALYSER:
${parts.join('\n')}

CONSIGNE:
- ANALYSE ces objets pour en déduire un premier profil comportemental
- Utilise ces informations pour orienter tes premières questions
- NE CITE PAS ces données explicitement`;
      }
    }

    // Build conversation context with accumulated taste data
    let tasteContext = "";
    if (currentTaste && Object.keys(currentTaste).some(k => currentTaste[k]?.length > 0)) {
      tasteContext = `\n\nPROFIL DE GOÛTS EN COURS DE CONSTRUCTION:
- Styles: ${currentTaste.styles?.join(', ') || 'non défini'}
- Ambiances: ${currentTaste.ambiances?.join(', ') || 'non défini'}
- Catégories: ${currentTaste.categories?.join(', ') || 'non défini'}
- Périodes: ${currentTaste.periods?.join(', ') || 'non défini'}
- Matériaux: ${currentTaste.materials?.join(', ') || 'non défini'}
- Couleurs: ${currentTaste.colors?.join(', ') || 'non défini'}
- Budget: ${currentTaste.budget_min || '?'}€ - ${currentTaste.budget_max || '?'}€

Pose des questions sur ce qui n'est pas encore défini, en alternant avec des questions comportementales.`;
    }

    // Reminder about name usage
    const nameReminder = messages.length > 0 ? "\n\nRAPPEL: Ne répète PAS le nom du client. Tu l'as déjà salué au début." : "";

    const apiMessages = [
      { role: "system", content: systemPrompt + userNameContext + userDataContext + tasteContext + nameReminder },
      ...messages.map((m: ConversationMessage) => ({
        role: m.role,
        content: m.content
      }))
    ];

    console.log("Calling Lovable AI with", apiMessages.length, "messages");
    console.log("User context provided:", userContext ? Object.keys(userContext).filter(k => userContext[k]?.length > 0) : 'none');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédit IA épuisé." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received:", content.substring(0, 200));

    // Parse JSON response from AI
    let parsedResponse;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        const jsonStr = jsonMatch[1].trim();
        parsedResponse = JSON.parse(jsonStr);
      } else {
        // Try to parse the whole content as JSON
        parsedResponse = JSON.parse(content.trim());
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Fallback: extract text message, removing any code blocks
      let cleanMessage = content;
      
      // Remove JSON code blocks but keep the message field if present
      const messageMatch = content.match(/"message"\s*:\s*"([^"]+)"/);
      if (messageMatch) {
        cleanMessage = messageMatch[1].replace(/\\n/g, '\n');
      } else {
        // Remove markdown code blocks entirely
        cleanMessage = content.replace(/```[\s\S]*?```/g, '').trim();
        // If nothing left, use a default message
        if (!cleanMessage) {
          cleanMessage = "Je réfléchis à votre profil...";
        }
      }
      
      parsedResponse = {
        message: cleanMessage,
        extracted: {
          styles: [],
          ambiances: [],
          categories: [],
          periods: [],
          materials: [],
          colors: [],
          budget_min: null,
          budget_max: null
        },
        confidence: 0.3,
        is_summary: false,
        suggested_next_topic: null
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in taste-interview function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
