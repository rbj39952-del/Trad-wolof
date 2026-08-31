import { useState } from "react";
import { ArrowLeftRight, Loader2, Volume2, Copy, Check, AlertCircle } from "lucide-react";

const LANGS = [
  { code: "wo", label: "Wolof", tag: "WO" },
  { code: "fr", label: "Français", tag: "FR" },
  { code: "en", label: "English", tag: "EN" },
  { code: "es", label: "Español", tag: "ES" },
  { code: "it", label: "Italiano", tag: "IT" },
];
const LANG_LABEL = Object.fromEntries(LANGS.map((l) => [l.code, l.label]));
const WATERMARK_WORDS = ["jërëjëf", "dalal ak diam", "nanga def", "baat", "kaay", "nanga def", "jërëjëf", "teranga"];

export default function App() {
  const [source, setSource] = useState("fr");
  const [target, setTarget] = useState("wo");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const swap = () => {
    setSource(target);
    setTarget(source);
    setInput(output);
    setOutput(input);
    setNote("");
    setError("");
  };

  const translate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    setNote("");
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          sourceLabel: LANG_LABEL[source],
          targetLabel: LANG_LABEL[target],
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.error || `code ${response.status}`);
      }
      if (data.error) throw new Error(data.error);
      setOutput(data.translation || "");
      setNote(data.note || "");
    } catch (e) {
      setError(`La traduction a échoué — ${e.message || "erreur inconnue"}.`);
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") translate();
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        .baat-ph::placeholder { color: #9C8B67; }
        .baat-select:focus-visible, .baat-textarea:focus-visible, .baat-btn:focus-visible, .baat-icon:focus-visible {
          outline: 2px solid #A63D2E;
          outline-offset: 2px;
        }
        .baat-select { appearance: none; -webkit-appearance: none; }
        @keyframes baat-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .baat-spin { animation: none !important; } }
      `}</style>

      <div style={styles.watermarkLayer} aria-hidden="true">
        {WATERMARK_WORDS.map((w, i) => (
          <span key={i} style={styles.watermarkWord}>{w}</span>
        ))}
      </div>

      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.wordmarkRow}>
            <span style={styles.wordmark}>Baat</span>
            <span style={styles.scriptNote}>baat, n. — mot, parole</span>
          </div>
          <p style={styles.tagline}>
            Un traducteur pensé pour le wolof — écrit une fois en latin,
            une fois en wolofal, une fois en garay. Ici, en latin.
          </p>
        </header>

        <div style={styles.card}>
          <div style={styles.langRow}>
            <div style={styles.selectWrap}>
              <span style={styles.selectTag}>{LANGS.find((l) => l.code === source).tag}</span>
              <select className="baat-select" value={source} onChange={(e) => setSource(e.target.value)} style={styles.select} aria-label="Langue source">
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <button className="baat-icon" onClick={swap} aria-label="Inverser les langues" style={styles.swapBtn}>
              <ArrowLeftRight size={15} />
            </button>
            <div style={styles.selectWrap}>
              <span style={styles.selectTag}>{LANGS.find((l) => l.code === target).tag}</span>
              <select className="baat-select" value={target} onChange={(e) => setTarget(e.target.value)} style={styles.select} aria-label="Langue cible">
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <textarea
            className="baat-textarea baat-ph"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Écris en ${LANG_LABEL[source]}…`}
            rows={4}
            style={styles.textarea}
          />

          <button
            className="baat-btn"
            onClick={translate}
            disabled={loading || !input.trim()}
            style={{ ...styles.translateBtn, background: loading || !input.trim() ? "#DCD0B4" : "#1B2A4A", cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}
          >
            {loading ? (<><Loader2 size={16} className="baat-spin" style={{ animation: "baat-spin 0.9s linear infinite" }} />Traduction…</>) : "Traduire"}
          </button>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {output && (
            <div style={styles.resultBox}>
              <div style={styles.resultTop}>
                <p style={styles.resultText}>{output}</p>
                <div style={styles.resultActions}>
                  <button className="baat-icon" onClick={copyOutput} aria-label="Copier" style={styles.iconBtn}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button className="baat-icon" disabled title="Audio — prochaine étape" aria-label="Écouter (bientôt disponible)" style={{ ...styles.iconBtn, opacity: 0.32, cursor: "not-allowed" }}>
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
              {note && <p style={styles.resultNote}>{note}</p>}
            </div>
          )}
        </div>

        <p style={styles.footnote}>
          Moteur : Claude, appelé depuis une fonction serveur (clé API jamais exposée au navigateur).
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Work Sans', sans-serif", background: "#F8F3E9", minHeight: "100vh", padding: "40px 18px 32px", display: "flex", justifyContent: "center", position: "relative", overflow: "hidden" },
  watermarkLayer: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: "28px 40px", padding: "60px 24px", opacity: 0.05 },
  watermarkWord: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 28, color: "#1B2A4A", whiteSpace: "nowrap" },
  shell: { width: "100%", maxWidth: 560, position: "relative" },
  header: { marginBottom: 26 },
  wordmarkRow: { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 },
  wordmark: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 40, color: "#1B2A4A", letterSpacing: "-0.01em" },
  scriptNote: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#A63D2E", letterSpacing: "0.01em" },
  tagline: { color: "#6B5D45", fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: 460 },
  card: { background: "#FFFFFF", border: "1px solid #E7DBBE", borderRadius: 16, padding: "20px", boxShadow: "0 1px 2px rgba(27,42,74,0.04)" },
  langRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  selectWrap: { flex: 1, position: "relative", border: "1px solid #E7DBBE", borderRadius: 9, background: "#FBF8F1", display: "flex", alignItems: "center", padding: "0 6px 0 10px" },
  selectTag: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#A99A7C", marginRight: 6 },
  select: { flex: 1, fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: "#2A2318", background: "transparent", border: "none", padding: "9px 4px", cursor: "pointer" },
  swapBtn: { background: "#1B2A4A", border: "none", borderRadius: 8, width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F8F3E9" },
  textarea: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 16, color: "#2A2318", background: "#FBF8F1", border: "1px solid #E7DBBE", borderRadius: 11, padding: "13px 14px", resize: "vertical", marginBottom: 12 },
  translateBtn: { width: "100%", color: "#F8F3E9", border: "none", borderRadius: 11, padding: "12px 0", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  errorBox: { display: "flex", gap: 8, alignItems: "flex-start", color: "#A63D2E", fontSize: 13.5, marginTop: 12, lineHeight: 1.4 },
  resultBox: { marginTop: 16, paddingTop: 16, borderTop: "1px solid #EFE6CE" },
  resultTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  resultText: { fontFamily: "'Fraunces', serif", fontSize: 21, color: "#1B2A4A", margin: 0, lineHeight: 1.4 },
  resultActions: { display: "flex", gap: 6, flexShrink: 0, paddingTop: 3 },
  iconBtn: { background: "#FBF8F1", border: "1px solid #E7DBBE", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#1B2A4A" },
  resultNote: { marginTop: 10, paddingLeft: 12, borderLeft: "2px solid #C98A2B", color: "#6B5D45", fontSize: 13.5, lineHeight: 1.5 },
  footnote: { marginTop: 22, fontSize: 12, color: "#A99A7C", lineHeight: 1.6, textAlign: "center" },
};
