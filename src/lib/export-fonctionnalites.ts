type Feature = {
  name: string;
  description: string;
  tags?: string[];
  scope: "generic" | "specific";
  specificDetail?: string;
};

type Section = {
  title: string;
  icon: string;
  features: Feature[];
};

function tagClass(t: string): string {
  if (t === "Auto Sync") return "tag-auto-sync";
  if (t === "Auto IA") return "tag-auto-ia";
  if (t === "SEO") return "tag-seo";
  if (t === "Marketing") return "tag-marketing";
  return "tag-default";
}

function buildSectionHTML(section: Section, scopeFilter: string): string {
  const filtered = section.features.filter(f => scopeFilter === "all" || f.scope === scopeFilter);
  if (filtered.length === 0) return "";

  const rows = filtered.map(f => {
    const dotCls = f.scope === "specific" ? "dot-specific" : "dot-generic";
    const detail = f.specificDetail
      ? '<div class="specific-detail">' + f.specificDetail + "</div>"
      : "";
    const tags = (f.tags || [])
      .map(t => '<span class="tag ' + tagClass(t) + '">' + t + "</span>")
      .join(" ");
    return [
      "<tr>",
      '<td><span class="dot ' + dotCls + '"></span></td>',
      "<td><strong>" + f.name + "</strong></td>",
      "<td>" + f.description + detail + "</td>",
      "<td>" + tags + "</td>",
      "</tr>",
    ].join("\n");
  });

  return [
    '<div class="section-header"><span>' + section.icon + "</span> " + section.title + ' <span class="count">(' + filtered.length + ")</span></div>",
    "<table>",
    '<thead><tr><th style="width:4%"></th><th style="width:25%">Fonctionnalité</th><th>Description</th><th style="width:15%">Tags</th></tr></thead>',
    "<tbody>",
    ...rows,
    "</tbody></table>",
  ].join("\n");
}

export function exportFonctionnalitesHTML(
  sections: Section[],
  totalFeatures: number,
  scopeFilter: string
) {
  const css = [
    "* { margin: 0; padding: 0; box-sizing: border-box; }",
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; max-width: 1100px; margin: 0 auto; padding: 40px 24px; }",
    "h1 { font-size: 28px; margin-bottom: 6px; }",
    ".subtitle { color: #666; font-size: 16px; margin-bottom: 30px; }",
    ".badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }",
    ".badge { font-size: 12px; border: 1px solid #ddd; border-radius: 999px; padding: 4px 12px; }",
    ".section-header { font-size: 20px; font-weight: 600; margin: 28px 0 10px; display: flex; align-items: center; gap: 8px; }",
    ".section-header .count { font-size: 13px; font-weight: 400; color: #888; }",
    "table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #e5e5e5; }",
    "th { text-align: left; padding: 8px 12px; background: #f5f5f5; font-size: 13px; color: #666; border-bottom: 1px solid #e5e5e5; }",
    "td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }",
    "tr:nth-child(even) td { background: #fafafa; }",
    ".dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }",
    ".dot-generic { background: #cbd5e1; }",
    ".dot-specific { background: #fbbf24; }",
    '.specific-detail { margin-top: 6px; font-size: 12px; color: #92400e; background: #fffbeb; border-left: 2px solid #fbbf24; padding: 4px 8px; border-radius: 3px; }',
    ".tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; display: inline-block; margin: 1px 2px; }",
    ".tag-auto-sync { background: #dbeafe; color: #1e40af; }",
    ".tag-auto-ia { background: #f3e8ff; color: #7c3aed; }",
    ".tag-seo { background: #dcfce7; color: #166534; }",
    ".tag-marketing { background: #fef3c7; color: #92400e; }",
    ".tag-default { background: #f1f5f9; color: #475569; }",
    ".legend { margin-top: 40px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fafafa; }",
    ".legend h3 { font-size: 15px; margin-bottom: 10px; }",
    ".legend-item { display: flex; align-items: start; gap: 8px; margin-bottom: 6px; font-size: 13px; }",
    ".footer-note { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }",
    "@media print { body { padding: 20px; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } }",
  ].join("\n  ");

  const sectionsHTML = sections.map(s => buildSectionHTML(s, scopeFilter)).join("\n");
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const html = [
    "<!DOCTYPE html>",
    '<html lang="fr">',
    "<head>",
    '<meta charset="UTF-8">',
    "<title>Fonctionnalités du projet — 12 pages &amp; associés</title>",
    "<style>",
    "  " + css,
    "</style>",
    "</head>",
    "<body>",
    "<h1>Fonctionnalités du projet</h1>",
    '<p class="subtitle">' + sections.length + " sections · " + totalFeatures + " fonctionnalités · 19 tables · 17 Edge Functions</p>",
    '<div class="badges">',
    '  <span class="badge">🏠 ~45 pages/vues</span>',
    '  <span class="badge">🔄 Auto Sync Interenchères</span>',
    '  <span class="badge">🤖 IA Gemini intégrée</span>',
    '  <span class="badge">📈 SEO natif</span>',
    "</div>",
    sectionsHTML,
    '<div class="legend">',
    "  <h3>Légende</h3>",
    '  <div class="legend-item"><span class="dot dot-generic"></span> <span><strong>🏛 Générique SVV</strong> — Réutilisable tel quel pour un autre hôtel des ventes.</span></div>',
    '  <div class="legend-item"><span class="dot dot-specific"></span> <span><strong>✦ Spécifique 12 pages</strong> — Contenu ou configuration propre à 12 pages &amp; associés.</span></div>',
    "</div>",
    '<p class="footer-note">Exporté le ' + dateStr + " — Projet 12 pages &amp; associés</p>",
    "</body></html>",
  ].join("\n");

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fonctionnalites-12pages-" + new Date().toISOString().slice(0, 10) + ".html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
