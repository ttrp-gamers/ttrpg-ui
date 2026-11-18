import { evaluateFormula } from "../rulesets/formulaEngine";

function modifierLabel(value) {
  if (value === null || value === undefined) return "Invalid formula";
  return `${value >= 0 ? "+" : ""}${value}`;
}

export function AttributeInput({ field, value, values, onChange }) {
  const modifier = field.modifier ? evaluateFormula(field.modifier, values) : null;
  return (
    <div className="col-6 col-md-4">
      <div className="p-2 border rounded bg-light">
        <label className="form-label mb-1 fw-bold">{field.label}</label>
        {field.type === "text" || field.model === "text" ? (
          <textarea
            className="form-control form-control-sm"
            rows={field.rows || 3}
            value={value ?? ""}
            onChange={(event) => onChange(field.id, event.target.value)}
          />
        ) : field.type === "select" ? (
          <select
            className="form-select form-select-sm"
            value={value}
            onChange={(event) => onChange(field.id, event.target.value)}
          >
            {field.options?.map((option) => <option key={option}>{option}</option>)}
          </select>
        ) : (
          <input
            type="number"
            className="form-control form-control-sm text-center fw-bold"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={value}
            onChange={(event) => onChange(field.id, Number(event.target.value))}
          />
        )}
        {field.model === "percentile" && (
          <small className="text-muted d-block mt-1">
            Half: {Math.floor(Number(value) / 2)} · Fifth: {Math.floor(Number(value) / 5)}
          </small>
        )}
        {modifier !== null && (
          <small className="text-muted d-block mt-1">Modifier: {modifierLabel(modifier)}</small>
        )}
        {field.description && <small className="text-muted">{field.description}</small>}
      </div>
    </div>
  );
}

export function RulesetAttributeSections({ ruleset, values, onChange }) {
  return (ruleset.sections || []).map((section) => (
    <section key={section.id} className="mb-4">
      <h6 className="text-uppercase text-secondary fw-bold mb-3">{section.title}</h6>
      <div className="row g-2">
        {(section.fields || []).map((field) => (
          <AttributeInput
            key={field.id}
            field={field}
            value={values[field.id] ?? field.defaultValue ?? (field.type === "text" || field.model === "text" ? "" : 0)}
            values={values}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  ));
}

export function RulesetResources({ resources, values, onChange, className = "" }) {
  if (!resources?.length) return null;
  return (
    <section className={`mb-4 ${className}`}>
      <h6 className="text-uppercase text-secondary fw-bold mb-3">Resources</h6>
      <div className="row g-2">
        {resources.map((resource) => (
          <div className="col-6 col-md-4" key={resource.id}>
            <label className="form-label">{resource.label}</label>
            <input
              type="number"
              className="form-control"
              value={values[resource.id] ?? resource.defaultValue ?? 0}
              onChange={(event) => onChange(resource.id, Number(event.target.value))}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
