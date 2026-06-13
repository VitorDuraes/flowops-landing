/* FlowOps — Tweaks panel. Drives the shared FlowTheme store (single source of truth). */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  theme: "light",
  accent: "violet",
  font: "a",
  density: "compact",
}; /*EDITMODE-END*/

const FLOW_ACCENTS = {
  emerald: "#10b981",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  amber: "#f59e0b",
};

function FlowTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Sync panel <-> shared store. Controls write to FlowTheme; FlowTheme emits;
  // we mirror back into the panel. No loop: this handler never calls FlowTheme.set.
  React.useEffect(() => {
    const FT = window.FlowTheme;
    if (!FT) return;
    setTweak(FT.get());
    return FT.subscribe((s) => setTweak(s));
  }, []);

  const set = (key) => (v) => window.FlowTheme && window.FlowTheme.set(key, v);
  const accentHex = FLOW_ACCENTS[t.accent] || FLOW_ACCENTS.emerald;

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Tema" />
      <TweakRadio
        label="Aparência"
        value={t.theme}
        options={[
          { value: "dark", label: "Escuro" },
          { value: "light", label: "Claro" },
        ]}
        onChange={set("theme")}
      />
      <TweakColor
        label="Cor de destaque"
        value={accentHex}
        options={Object.values(FLOW_ACCENTS)}
        onChange={(hex) => {
          const name =
            Object.keys(FLOW_ACCENTS).find((k) => FLOW_ACCENTS[k] === hex) ||
            "emerald";
          window.FlowTheme && window.FlowTheme.set("accent", name);
        }}
      />

      <TweakSection label="Tipografia & layout" />
      <TweakRadio
        label="Fonte dos títulos"
        value={t.font}
        options={[
          { value: "a", label: "Grotesk" },
          { value: "b", label: "Sora" },
        ]}
        onChange={set("font")}
      />
      <TweakRadio
        label="Densidade"
        value={t.density}
        options={[
          { value: "compact", label: "Compacto" },
          { value: "regular", label: "Padrão" },
          { value: "comfy", label: "Amplo" },
        ]}
        onChange={set("density")}
      />
    </TweaksPanel>
  );
}

(function mountFlowTweaks() {
  const el = document.createElement("div");
  el.id = "flow-tweaks-root";
  document.body.appendChild(el);
  ReactDOM.createRoot(el).render(<FlowTweaks />);
})();
