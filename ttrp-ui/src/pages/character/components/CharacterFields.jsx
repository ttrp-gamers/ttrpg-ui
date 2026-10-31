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
        {field.type === "select" ? (
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
