import { useState } from "react";

function namedFields(ruleset) {
  const seenNames = new Map();
  return new Map(
    (ruleset.sections || []).flatMap((section) => section.fields || []).map((field) => {
      const baseName = String(field.label || field.id || "Attribute").trim() || "Attribute";
      const occurrence = (seenNames.get(baseName) || 0) + 1;
      seenNames.set(baseName, occurrence);
      return [field.id, occurrence === 1 ? baseName : `${baseName} (${occurrence})`];
    }),
  );
}

function replaceFormulaNames(formula, ruleset, direction) {
  const namesById = namedFields(ruleset);
  const replacements = direction === "display"
    ? [...namesById.entries()].map(([id, name]) => [id, name])
    : [...namesById.entries()].map(([id, name]) => [name, id]);
  return replacements.sort(([left], [right]) => right.length - left.length).reduce((result, [from, to]) => {
    const escaped = String(from).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return result.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), to);
  }, String(formula || ""));
}

export default function CustomRulesetBuilder({
  ruleset,
  className = "",
  onRulesetChange,
  onFieldAdd,
  onFieldChange,
  onFieldRemove,
  onFormulaAdd,
  onFormulaChange,
  onFormulaRemove,
  onResourceAdd,
  onResourceChange,
  onResourceRemove,
  onImport,
  onExport,
}) {
  const fields = (ruleset.sections || []).flatMap((section) => section.fields || []);
  const [showHelp, setShowHelp] = useState(false);
  return (
    <section className={`border rounded p-3 mb-4 ${className}`}>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <h6 className="text-uppercase text-secondary fw-bold mb-0">Custom Ruleset Builder</h6>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
            style={{ width: "1.75rem", height: "1.75rem" }}
            title="How to use the custom ruleset builder"
            aria-label="Usage instructions"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((visible) => !visible)}
          >
            ?
          </button>
        </div>
        <div className="btn-group btn-group-sm">
          {onImport && <button type="button" className="btn btn-outline-secondary" onClick={onImport}>Import JSON</button>}
          {onExport && <button type="button" className="btn btn-outline-secondary" onClick={onExport}>Export JSON</button>}
        </div>
      </div>
      {showHelp && (
        <div className="alert alert-light border small mt-3 mb-0 w-100">
          <strong>Getting started</strong>
          <ol className="mb-2 ps-3">
            <li>Name the ruleset, then use <strong>Add Attribute</strong> to add fields for your system.</li>
            <li>Choose a model: <code>Text / Traits</code>, <code>Raw Number</code>, <code>Score + Mod</code>, <code>Percentile</code>, or <code>Pool</code>.</li>
            <li>Add derived formulas to calculate stats. Use attribute labels as variables, for example <code>floor((Strength - 10) / 2)</code>.</li>
            <li>Add primary resources for trackable pools such as Mana, Sanity, Rage, or Luck.</li>
          </ol>
          <div>
            Formula functions include <code>floor</code>, <code>ceil</code>, <code>round</code>, <code>min</code>, <code>max</code>, and <code>abs</code>.
            Duplicate attribute labels are numbered automatically in formulas.
          </div>
        </div>
      )}
      <div className="row g-2 mt-2">
        <div className="col-md-6">
          <label className="form-label">Ruleset Name</label>
          <input className="form-control form-control-sm" value={ruleset.name} onChange={(event) => onRulesetChange({ name: event.target.value })} />
        </div>
      </div>
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <strong>Attributes</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onFieldAdd}>+ Add Attribute</button>
      </div>
      {fields.map((field) => (
        <div className="row g-2 mt-1 align-items-end" key={field.id}>
          <div className="col-7">
            <label className="small">Label</label>
            <input className="form-control form-control-sm" value={field.label} onChange={(event) => onFieldChange(field.id, { label: event.target.value })} />
          </div>
          <div className="col-3">
            <label className="small">Model</label>
            <select className="form-select form-select-sm" value={field.model || "raw"}
              onChange={(event) => onFieldChange(field.id, {
                model: event.target.value,
                type: event.target.value === "text" ? "text" : "number",
              })}>
              <option value="text">Text / Traits</option>
              <option value="raw">Raw Number</option>
              <option value="score">Score + Mod</option>
              <option value="percentile">Percentile</option>
              <option value="pool">Pool</option>
            </select>
          </div>
          <div className="col-2">
            <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => onFieldRemove(field.id)}>Remove</button>
          </div>
        </div>
      ))}
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <strong>Derived formulas</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onFormulaAdd}>+ Add Formula</button>
      </div>
      {(ruleset.derivedStats || []).map((stat) => (
        <div className="row g-2 mt-1" key={stat.id}>
          <div className="col-4">
            <input className="form-control form-control-sm" value={stat.label} onChange={(event) => onFormulaChange(stat.id, { label: event.target.value })} />
          </div>
          <div className="col-6">
            <input className="form-control form-control-sm font-monospace"
              value={replaceFormulaNames(stat.formula, ruleset, "display")}
              onChange={(event) => onFormulaChange(stat.id, { formula: replaceFormulaNames(event.target.value, ruleset, "storage") })}
              placeholder="floor((Constitution + Size) / 10)" />
          </div>
          <div className="col-2">
            <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => onFormulaRemove(stat.id)}>Remove</button>
          </div>
        </div>
      ))}
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <strong>Primary resources</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onResourceAdd}>+ Add Resource</button>
      </div>
      {(ruleset.resources || []).map((resource) => (
        <div className="row g-2 mt-1" key={resource.id}>
          <div className="col-5">
            <input className="form-control form-control-sm" value={resource.label} onChange={(event) => onResourceChange(resource.id, { label: event.target.value })} />
          </div>
          <div className="col-5">
            <input type="number" className="form-control form-control-sm" value={resource.defaultValue ?? 0}
              onChange={(event) => onResourceChange(resource.id, { defaultValue: Number(event.target.value) })} />
          </div>
          <div className="col-2">
            <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => onResourceRemove(resource.id)}>Remove</button>
          </div>
        </div>
      ))}
    </section>
  );
}
