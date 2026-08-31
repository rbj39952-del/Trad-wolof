export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { text, sourceLabel, targetLabel } = req.body || {};

  if (!text || !sourceLabel || !targetLabel) {
    return res.status(400).json({ error: "Paramètres manquants (text, sourceLabel, targetLabel)." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY absente des variables d'environnement du serveur.",
    });
  }

  const prompt = `Tu es un traducteur expert du wolof, avec une attention particulière aux nuances culturelles sénégalaises et aux expressions idiomatiques.

Traduis ce texte du ${sourceLabel} vers le ${targetLabel} :
"${text}"

Réponds uniquement avec un objet JSON valide, rien avant, rien après, pas de bloc de code, format exact :
{"translation": "...", "note": "..."}

Le champ "note" contient une courte remarque sur une nuance ou une expression idiomatique si pertinent, sinon une chaîne vide.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `L'API Claude a répondu avec le code ${response.status}.`,
      });
    }
    if (!data) {
      return res.status(502).json({ error: "Réponse illisible de l'API Claude." });
    }

    const raw = (data.content || [])
      .map((b) => b.text || "")
      .join("")
      .trim();

    if (!raw) {
      return res.status(502).json({ error: "Réponse vide de l'API Claude." });
    }

    let parsed;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      parsed = { translation: raw, note: "" };
    }

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erreur serveur inconnue." });
  }
}
