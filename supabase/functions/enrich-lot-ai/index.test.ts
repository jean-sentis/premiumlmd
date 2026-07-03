// Suite de tests de l'analyse de lot (enrich-lot-ai).
//
// Objectif : vérifier, sur des lots exemples, que l'explication en 2 paragraphes
// respecte les règles métier :
//   §1 = valeur ajoutée (pas de paraphrase de la description)
//   §2 = contexte (biographie du créateur OU rattachement à des mouvements)
//   + aucune invention de faits, aucune estimation de prix.
//
// Chaque lot est passé au pipeline réel déployé (génération), puis l'analyse
// produite est soumise au juge qualité (LLM-as-judge). Les tests échouent si
// le juge détecte une violation.
//
// Prérequis : la fonction enrich-lot-ai doit être déployée.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  EXAMPLE_LOTS,
  type AnalysisResult,
  type JudgeVerdict,
  type LotInput,
} from "./prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FN_URL = `${SUPABASE_URL}/functions/v1/enrich-lot-ai`;

async function callFunction(payload: Record<string, unknown>) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Réponse non JSON (${res.status}): ${text.slice(0, 300)}`);
  }
  return { status: res.status, json };
}

async function generate(lot: LotInput): Promise<AnalysisResult> {
  const { status, json } = await callFunction({
    test_lot: lot,
    dry_run: true,
    analyze_images: false,
  });
  assertEquals(status, 200, `génération HTTP ${status}: ${JSON.stringify(json)}`);
  assert(json.success, `génération échouée: ${json.error}`);
  assert(json.analysis?.explanation, "explanation manquante");
  return json.analysis as AnalysisResult;
}

async function judge(lot: LotInput, analysis: AnalysisResult): Promise<JudgeVerdict> {
  const { status, json } = await callFunction({ mode: "judge", test_lot: lot, analysis });
  assertEquals(status, 200, `juge HTTP ${status}: ${JSON.stringify(json)}`);
  assert(json.success, `juge échoué: ${json.error}`);
  return json.verdict as JudgeVerdict;
}

// Le juge est un LLM : sur les critères subjectifs (paraphrase / valeur ajoutée)
// une réponse isolée peut être bruitée. On vote à la majorité sur 3 verdicts
// pour un résultat stable et reproductible.
const BOOLEAN_RULES: (keyof JudgeVerdict)[] = [
  "has_two_paragraphs",
  "p1_adds_value",
  "p1_not_paraphrase",
  "p2_is_context",
  "creator_info_consistent",
  "no_invented_facts",
  "no_price_estimate",
];

async function judgeMajority(
  lot: LotInput,
  analysis: AnalysisResult,
): Promise<{ verdict: Record<string, boolean>; reasons: string[] }> {
  const verdicts = await Promise.all([
    judge(lot, analysis),
    judge(lot, analysis),
    judge(lot, analysis),
  ]);
  const verdict: Record<string, boolean> = {};
  for (const rule of BOOLEAN_RULES) {
    const trueCount = verdicts.filter((v) => v[rule] === true).length;
    verdict[rule] = trueCount >= 2; // majorité sur 3
  }
  const reasons = verdicts.map((v) => v.reasons).filter(Boolean);
  return { verdict, reasons };
}

// Nombre de paragraphes réellement présents dans le texte.
function paragraphCount(text: string): number {
  const byBlank = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (byBlank.length >= 2) return byBlank.length;
  return text.split(/\n/).map((p) => p.trim()).filter(Boolean).length;
}

for (const example of EXAMPLE_LOTS) {
  Deno.test(`lot "${example.id}" — ${example.note}`, async () => {
    const analysis = await generate(example.lot);

    // 1) Vérification structurelle rapide (heuristique, sans IA)
    const paras = paragraphCount(analysis.explanation);
    assert(
      paras === 2,
      `explanation doit contenir 2 paragraphes, trouvé ${paras}:\n${analysis.explanation}`,
    );

    // Pas d'estimation de prix évidente (garde-fou rapide)
    assert(
      !/\b\d[\d\s.,]*\s?(€|eur|euros?)\b/i.test(analysis.explanation),
      `estimation de prix détectée:\n${analysis.explanation}`,
    );

    // Cohérence creator_info selon le cas
    if (example.expectCreatorInfo) {
      assert(
        analysis.creator_info && analysis.creator_info.trim().length > 0,
        `creator_info attendu pour "${example.id}" mais absent`,
      );
    } else {
      assert(
        analysis.creator_info === null,
        `creator_info devait être null pour "${example.id}", reçu: ${analysis.creator_info}`,
      );
    }

    // 2) Évaluation sémantique par le juge (IA), vote majoritaire sur 3 verdicts
    const { verdict: v, reasons } = await judgeMajority(example.lot, analysis);
    const detail = `\nVerdict (majorité/3): ${JSON.stringify(v, null, 2)}\nRaisons juges: ${JSON.stringify(reasons, null, 2)}\n\nAnalyse:\n${analysis.explanation}`;

    assert(v.has_two_paragraphs, `§ deux paragraphes non respecté${detail}`);
    assert(v.p1_adds_value, `§1 n'apporte pas de valeur ajoutée${detail}`);
    assert(v.p1_not_paraphrase, `§1 paraphrase la description${detail}`);
    assert(v.p2_is_context, `§2 ne fournit pas de contexte${detail}`);
    assert(v.creator_info_consistent, `creator_info incohérent${detail}`);
    assert(v.no_invented_facts, `faits inventés détectés${detail}`);
    assert(v.no_price_estimate, `estimation de prix détectée${detail}`);
  });
}
