import "./Character.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CharacterService } from "../../services/CharacterService";
import { useAuth } from "../auth/AuthContext";
import { evaluateDerivedStats, evaluateFormula } from "./rulesets/formulaEngine";
import { getAllFields, RULESET_PRESETS } from "./rulesets/index.js";

const DEFAULT_HIT_DIE = 8;
const DND_HIT_DICE = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6,
};

function hitDieFor(rulesetKey, archetype) {
  return rulesetKey === "DND_5E" ? DND_HIT_DICE[archetype] || 8 : DEFAULT_HIT_DIE;
}

function valuesForRuleset(ruleset, existing = {}) {
  return Object.fromEntries(getAllFields(ruleset).map((field) => [
    field.id,
    existing[field.id] ?? field.defaultValue ?? (field.type === "text" ? "" : 0),
  ]));
}

function createInitialForm() {
  const ruleset = RULESET_PRESETS.DND_5E;
  return {
    name: "",
    rulesetKey: "DND_5E",
    archetype: ruleset.archetypes[4],
    customArchetype: "",
    level: 1,
    hitDie: hitDieFor("DND_5E", ruleset.archetypes[4]),
    values: valuesForRuleset(ruleset),
    resources: {},
    autoCalculateHp: true,
    maxHp: 10,
    currentHp: 10,
    customRuleset: RULESET_PRESETS.CUSTOM,
  };
}

function displayNumber(value) {
  return value === null || value === undefined ? "—" : value;
}

function modifierLabel(value) {
  if (value === null || value === undefined) return "Invalid formula";
  return `${value >= 0 ? "+" : ""}${value}`;
}

function rulesetFileName(name) {
  const safeName = String(name || "custom-ruleset")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safeName || "custom-ruleset"}.json`;
}

function namedFields(ruleset) {
  const seenNames = new Map();
  return new Map(
    getAllFields(ruleset).map((field) => {
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

  return replacements
    .sort(([left], [right]) => right.length - left.length)
    .reduce((result, [from, to]) => {
      const escaped = String(from).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), to);
    }, String(formula || ""));
}

function formulaForDisplay(formula, ruleset) {
  return replaceFormulaNames(formula, ruleset, "display");
}

function formulaForStorage(formula, ruleset) {
  return replaceFormulaNames(formula, ruleset, "storage");
}

function rulesetForCharacter(character) {
  if (character.attributes?.rulesetKey === "CUSTOM" && character.attributes?.rulesetSchema) {
    return character.attributes.rulesetSchema;
  }
  const preset = Object.values(RULESET_PRESETS).find((ruleset) => ruleset.name === character.ruleset);
  return preset || RULESET_PRESETS.CUSTOM;
}

function hpForCharacter(character) {
  const ruleset = rulesetForCharacter(character);
  const attributes = character.attributes || {};
  const calculatedHp = evaluateDerivedStats(
    ruleset,
    attributes.values || {},
    character.level,
    attributes.hitDie,
  ).hitPoints;
  const maxHp = character.maxHp ?? calculatedHp;

  return {
    currentHp: character.currentHp ?? maxHp,
    maxHp,
  };
}

export default function Character() {
  const { user } = useAuth();
  const importRef = useRef(null);
  const [form, setForm] = useState(createInitialForm);
  const [editingId, setEditingId] = useState(null);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeRuleset = form.rulesetKey === "CUSTOM" ? form.customRuleset : RULESET_PRESETS[form.rulesetKey];
  const derivedStats = useMemo(
    () => evaluateDerivedStats(activeRuleset, form.values, form.level, form.hitDie),
    [activeRuleset, form.values, form.level, form.hitDie],
  );
  const calculatedHp = derivedStats.hitPoints;
  const hpStat = activeRuleset.derivedStats?.find((stat) => stat.id === "hitPoints");

  const fetchCharacters = useCallback(async () => {
    if (!user) {
      setSavedCharacters([]);
      return;
    }
    setIsLoadingList(true);
    try {
      setSavedCharacters(await CharacterService.getAll());
    } catch (error) {
      console.error("Failed to load characters:", error);
      setSavedCharacters([]);
      setFeedback({ type: "danger", message: "Failed to load character sheets from server." });
    } finally {
      setIsLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchCharacters, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchCharacters]);

  const selectRuleset = (event) => {
    const rulesetKey = event.target.value;
    const ruleset = RULESET_PRESETS[rulesetKey];
    setForm((previous) => ({
      ...previous,
      rulesetKey,
      archetype: ruleset.archetypes?.[0] || "",
      values: valuesForRuleset(ruleset),
      resources: Object.fromEntries((ruleset.resources || []).map((resource) => [resource.id, resource.defaultValue ?? 0])),
      hitDie: hitDieFor(rulesetKey, ruleset.archetypes?.[0]),
      autoCalculateHp: rulesetKey !== "CUSTOM",
      maxHp: 1,
      currentHp: 1,
    }));
  };

  const selectArchetype = (event) => {
    const archetype = event.target.value;
    setForm((previous) => ({
      ...previous,
      archetype,
      hitDie: hitDieFor(previous.rulesetKey, archetype),
    }));
  };

  const updateValue = (id, value) => {
    setForm((previous) => ({ ...previous, values: { ...previous.values, [id]: value } }));
  };

  const updateResource = (id, value) => {
    setForm((previous) => ({ ...previous, resources: { ...previous.resources, [id]: value } }));
  };

  const updateCustomRuleset = (updater) => {
    setForm((previous) => ({ ...previous, customRuleset: updater(previous.customRuleset) }));
  };

  const updateCustomRulesetMetadata = (patch) => {
    updateCustomRuleset((ruleset) => ({ ...ruleset, ...patch }));
  };

  const addCustomField = () => {
    const field = {
      id: `attribute${Date.now()}`,
      label: "New Attribute",
      model: "raw",
      defaultValue: 0,
      min: 0,
    };
    setForm((previous) => {
      const sections = previous.customRuleset.sections || [];
      const customRuleset = {
        ...previous.customRuleset,
        sections: sections.length
          ? sections.map((section, index) => index === 0
            ? { ...section, fields: [...(section.fields || []), field] }
            : section)
          : [{ id: "custom-attributes", title: "Custom Attributes", fields: [field] }],
      };
      return {
        ...previous,
        customRuleset,
        values: { ...previous.values, [field.id]: field.defaultValue },
      };
    });
  };

  const updateCustomField = (fieldId, patch) => {
    updateCustomRuleset((ruleset) => ({
      ...ruleset,
      sections: ruleset.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field),
      })),
    }));
  };

  const removeCustomField = (fieldId) => {
    setForm((previous) => {
      const customRuleset = {
        ...previous.customRuleset,
        sections: previous.customRuleset.sections.map((section) => ({
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        })),
      };
      const values = { ...previous.values };
      delete values[fieldId];
      return { ...previous, customRuleset, values };
    });
  };

  const addDerivedFormula = () => {
    updateCustomRuleset((ruleset) => ({
      ...ruleset,
      derivedStats: [...(ruleset.derivedStats || []), { id: `derived${Date.now()}`, label: "New Derived Stat", formula: "0" }],
    }));
  };

  const updateDerivedFormula = (id, patch) => {
    updateCustomRuleset((ruleset) => ({
      ...ruleset,
      derivedStats: ruleset.derivedStats.map((stat) => stat.id === id ? { ...stat, ...patch } : stat),
    }));
  };

  const removeDerivedFormula = (id) => {
    updateCustomRuleset((ruleset) => ({ ...ruleset, derivedStats: ruleset.derivedStats.filter((stat) => stat.id !== id) }));
  };

  const addResource = () => {
    updateCustomRuleset((ruleset) => ({
      ...ruleset,
      resources: [...(ruleset.resources || []), { id: `resource${Date.now()}`, label: "New Resource", defaultValue: 0 }],
    }));
  };

  const updateResourceDefinition = (id, patch) => {
    updateCustomRuleset((ruleset) => ({
      ...ruleset,
      resources: ruleset.resources.map((resource) => resource.id === id ? { ...resource, ...patch } : resource),
    }));
  };

  const removeResource = (id) => {
    updateCustomRuleset((ruleset) => ({ ...ruleset, resources: ruleset.resources.filter((resource) => resource.id !== id) }));
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setEditingId(null);
  };

  const exportRuleset = () => {
    const blob = new Blob([JSON.stringify(form.customRuleset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = rulesetFileName(form.customRuleset.name);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importRuleset = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported.id || !imported.name || !Array.isArray(imported.sections)) throw new Error("Invalid ruleset schema");
        setForm((previous) => ({
          ...previous,
          rulesetKey: "CUSTOM",
          customRuleset: imported,
          values: valuesForRuleset(imported),
          resources: Object.fromEntries((imported.resources || []).map((resource) => [resource.id, resource.defaultValue ?? 0])),
          autoCalculateHp: false,
        }));
        setFeedback({ type: "success", message: "Custom ruleset imported." });
      } catch (error) {
        console.error("Ruleset import failed:", error);
        setFeedback({ type: "danger", message: "The selected file is not a valid ruleset JSON schema." });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleEdit = (character) => {
    const key = Object.keys(RULESET_PRESETS).find((presetKey) => RULESET_PRESETS[presetKey].name === character.ruleset);
    const rulesetKey = key || "CUSTOM";
    const ruleset = rulesetKey === "CUSTOM"
      ? (character.attributes?.rulesetSchema || RULESET_PRESETS.CUSTOM)
      : RULESET_PRESETS[rulesetKey];
    const savedArchetype = character.attributes?.archetype;
    const legacyCustomArchetype = rulesetKey === "CUSTOM"
      && character.characterClass
      && !ruleset.archetypes?.includes(character.characterClass)
      ? character.characterClass
      : "";
    const savedCustomArchetype = character.attributes?.customArchetype
      || (savedArchetype === "Custom" ? character.characterClass : legacyCustomArchetype)
      || (rulesetKey === "CUSTOM"
        && savedArchetype
        && savedArchetype !== "Custom"
        && !ruleset.archetypes?.includes(savedArchetype)
        ? savedArchetype
        : "");
    const savedValues = character.attributes?.values || character.attributes || {};
    setEditingId(character.id);
    setForm({
      ...createInitialForm(),
      name: character.name || "",
      rulesetKey,
      archetype: rulesetKey === "CUSTOM"
        ? (savedCustomArchetype ? "Custom" : savedArchetype || ruleset.archetypes?.[0] || "")
        : (savedArchetype || character.characterClass || ruleset.archetypes?.[0] || ""),
      customArchetype: savedCustomArchetype,
      level: character.level || 1,
      hitDie: rulesetKey === "DND_5E"
        ? hitDieFor(rulesetKey, character.characterClass)
        : character.attributes?.hitDie || DEFAULT_HIT_DIE,
      values: valuesForRuleset(ruleset, savedValues),
      resources: character.attributes?.resources || {},
      maxHp: character.maxHp ?? character.currentHp ?? 1,
      currentHp: character.currentHp ?? 1,
      autoCalculateHp: character.attributes?.autoCalculateHp ?? rulesetKey !== "CUSTOM",
      customRuleset: ruleset,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete character "${name}"?`)) return;
    try {
      await CharacterService.delete(id);
      setFeedback({ type: "success", message: `Character "${name}" was deleted.` });
      if (editingId === id) resetForm();
      fetchCharacters();
    } catch (error) {
      console.error("Delete failed:", error);
      setFeedback({ type: "danger", message: "Failed to delete character." });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: "danger", message: "Character name is required." });
      return;
    }
    if (!user) {
      setFeedback({ type: "danger", message: "You must be logged in to save character sheets." });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    const effectiveArchetype = form.archetype === "Custom" ? form.customArchetype || "Custom" : form.archetype;
    const effectiveCurrentHp = form.autoCalculateHp && calculatedHp !== null ? calculatedHp : form.currentHp;
    const effectiveMaxHp = calculatedHp ?? form.maxHp;
    const payload = {
      name: form.name.trim(),
      characterClass: effectiveArchetype,
      level: Number(form.level) || 1,
      ruleset: activeRuleset.name,
      maxHp: Number(effectiveMaxHp) || 1,
      currentHp: effectiveCurrentHp === null || effectiveCurrentHp === undefined
        ? 0
        : Number(effectiveCurrentHp),
      attributes: {
        rulesetKey: form.rulesetKey,
        archetype: form.archetype,
        customArchetype: form.customArchetype,
        values: form.values,
        resources: form.resources,
        hitDie: form.hitDie,
        autoCalculateHp: form.autoCalculateHp,
        rulesetSchema: form.customRuleset,
      },
    };
    try {
      let savedCharacter;
      if (editingId) {
        savedCharacter = await CharacterService.update(editingId, payload);
        setFeedback({ type: "success", message: `Character "${payload.name}" updated successfully!` });
      } else {
        savedCharacter = await CharacterService.create(payload);
        setFeedback({ type: "success", message: `Character "${payload.name}" created and saved to account!` });
        resetForm();
      }
      setSavedCharacters((previous) => editingId
        ? previous.map((character) => character.id === savedCharacter.id ? savedCharacter : character)
        : [savedCharacter, ...previous]);
      await fetchCharacters();
    } catch (error) {
      console.error("Save failed:", error);
      setFeedback({ type: "danger", message: error.response?.data?.message || "Failed to save character sheet to account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Character Creation & Sheet Manager</h2>
          <p className="text-muted mb-0">Build characters from a ruleset schema, including custom tabletop games.</p>
        </div>
        {editingId && (
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={resetForm}
          >
            + Create New Character Instead
          </button>
        )}
      </div>
      {feedback && (
        <div className={`alert alert-${feedback.type}`} role="alert">
          {feedback.message}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Close"
            onClick={() => setFeedback(null)}
          />
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {editingId ? `Edit Character: ${form.name || "Unnamed Character"}` : "New Character Form"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <h6 className="text-uppercase text-secondary fw-bold mb-3">1. Basic Info</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-7">
                    <label className="form-label fw-semibold">Character Name *</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">
                      {activeRuleset.terminology.level || "Level"}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="100"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <h6 className="text-uppercase text-secondary fw-bold mt-4 mb-3">2. Ruleset</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">System Ruleset</label>
                    <select className="form-select" value={form.rulesetKey} onChange={selectRuleset}>
                      {Object.entries(RULESET_PRESETS).map(([key, ruleset]) => (
                        <option key={key} value={key}>
                          {ruleset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      {activeRuleset.terminology.archetype}
                    </label>
                    <select className="form-select" value={form.archetype} onChange={selectArchetype}>
                      <option value="">— Select —</option>
                      {(activeRuleset.archetypes || []).map((archetype) => (
                        <option key={archetype}>{archetype}</option>
                      ))}
                      {form.rulesetKey === "CUSTOM" && <option value="Custom">Custom</option>}
                    </select>
                  </div>
                  {form.archetype === "Custom" && (
                    <div className="col-md-6">
                      <label className="form-label">
                        Custom {activeRuleset.terminology.archetype}
                      </label>
                      <input
                        className="form-control"
                        value={form.customArchetype}
                        onChange={(e) => setForm({ ...form, customArchetype: e.target.value })}
                      />
                    </div>
                  )}
                  {form.rulesetKey === "DND_5E" && (
                    <div className="col-md-3">
                      <label className="form-label">Hit Die</label>
                      <input
                        type="text"
                        className="form-control"
                        value={`d${form.hitDie}`}
                        readOnly
                      />
                    </div>
                  )}
                </div>

                {activeRuleset.sections.map((section) => (
                  <section key={section.id} className="mb-4">
                    <h6 className="text-uppercase text-secondary fw-bold mb-3">
                      {section.title}
                    </h6>
                    <div className="row g-2">
                      {section.fields.map((field) => (
                        <AttributeInput
                          key={field.id}
                          field={field}
                          value={form.values[field.id]}
                          values={form.values}
                          onChange={updateValue}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {activeRuleset.derivedStats?.length > 0 && (
                  <section className="mb-4">
                    <h6 className="text-uppercase text-secondary fw-bold mb-3">Derived Stats</h6>
                    <div className="row g-2">
                      {activeRuleset.derivedStats.map((stat) => (
                        <div className="col-6 col-md-4" key={stat.id}>
                          <div className="p-2 border rounded bg-light">
                            <div className="small text-muted">{stat.label}</div>
                            <strong>{displayNumber(derivedStats[stat.id])}</strong>
                            <div className="small text-muted font-monospace">{stat.formula}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {activeRuleset.resources?.length > 0 && (
                  <section className="mb-4">
                    <h6 className="text-uppercase text-secondary fw-bold mb-3">Resources</h6>
                    <div className="row g-2">
                      {activeRuleset.resources.map((resource) => (
                        <div className="col-6 col-md-4" key={resource.id}>
                          <label className="form-label">{resource.label}</label>
                          <input
                            type="number"
                            className="form-control"
                            value={form.resources[resource.id] ?? resource.defaultValue ?? 0}
                            onChange={(e) => updateResource(resource.id, Number(e.target.value))}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(hpStat || form.rulesetKey === "CUSTOM") && (
                  <div className="row g-3 align-items-center mb-4 p-3 border rounded">
                    <div className="col-md-5">
                      <label className="form-label fw-bold text-success mb-1">
                        {hpStat?.label || "Maximum HP"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-control fw-bold fs-5 text-success"
                        value={calculatedHp ?? form.maxHp}
                        readOnly={Boolean(hpStat && form.autoCalculateHp)}
                        onChange={(e) => setForm({ ...form, maxHp: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Current HP</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={form.autoCalculateHp && calculatedHp !== null ? calculatedHp : form.currentHp}
                        onChange={(e) => setForm({ ...form, currentHp: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-3 pt-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={form.autoCalculateHp}
                          onChange={(e) => {
                            const autoCalculateHp = e.target.checked;
                            setForm({
                              ...form,
                              autoCalculateHp,
                              ...(autoCalculateHp && calculatedHp !== null
                                ? { currentHp: calculatedHp }
                                : {}),
                            });
                          }}
                          id="autoCalculateHp"
                        />
                        <label className="form-check-label small" htmlFor="autoCalculateHp">
                          Auto-sync HP
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {form.rulesetKey === "CUSTOM" && (
                  <CustomBuilder
                    ruleset={form.customRuleset}
                    onRulesetChange={updateCustomRulesetMetadata}
                    onFieldAdd={addCustomField}
                    onFieldChange={updateCustomField}
                    onFieldRemove={removeCustomField}
                    onFormulaAdd={addDerivedFormula}
                    onFormulaChange={updateDerivedFormula}
                    onFormulaRemove={removeDerivedFormula}
                    onResourceAdd={addResource}
                    onResourceChange={updateResourceDefinition}
                    onResourceRemove={removeResource}
                    onImport={() => importRef.current?.click()}
                    onExport={exportRuleset}
                  />
                )}
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json"
                  className="d-none"
                  onChange={importRuleset}
                />
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting || !user}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Update Character Sheet"
                        : "Save Character to Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Your Saved Characters</h5>
              <button
                className="btn btn-outline-light btn-sm"
                type="button"
                onClick={fetchCharacters}
                disabled={isLoadingList || !user}
              >
                Refresh
              </button>
            </div>
            <div className="card-body">
              {!user ? (
                <div className="text-center py-4 text-muted">
                  <p>Log in to view your character sheets saved in the vault.</p>
                  <Link to="/" className="btn btn-outline-primary btn-sm">
                    Go to Login
                  </Link>
                </div>
              ) : isLoadingList ? (
                <div className="text-center py-4 text-muted">Loading character sheets...</div>
              ) : savedCharacters.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-1">No characters saved yet.</p>
                  <small>Fill out the form to create your first character sheet.</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {savedCharacters.map((character) => {
                    const fieldNames = namedFields(rulesetForCharacter(character));
                    const { currentHp, maxHp } = hpForCharacter(character);

                    return (
                      <div
                        key={character.id}
                        className={`card border ${
                          editingId === character.id ? "border-primary shadow-sm" : ""
                        }`}
                      >
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="card-title mb-0 fw-bold">{character.name}</h6>
                              <span className="badge bg-secondary me-1">
                                {character.characterClass || "No Archetype"} Lvl {character.level || 1}
                              </span>
                              <span className="badge bg-info text-dark">
                                {character.ruleset || "Unknown"}
                              </span>
                            </div>
                            <span className="badge bg-success fs-6">
                              {currentHp ?? "—"} / {maxHp ?? "—"} HP
                            </span>
                          </div>
                          <div className="d-flex flex-wrap gap-2 text-muted small my-2">
                            {Object.entries(character.attributes?.values || {})
                              .slice(0, 6)
                              .map(([key, value]) => (
                                <span key={key}>
                                  <strong>{fieldNames.get(key) || "Attribute"}:</strong> {value}
                                </span>
                              ))}
                          </div>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(character)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(character.id, character.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeInput({ field, value, values, onChange }) {
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
            {field.options?.map((option) => (
              <option key={option}>{option}</option>
            ))}
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
          <small className="text-muted d-block mt-1">
            Modifier: {modifierLabel(modifier)}
          </small>
        )}
        {field.description && <small className="text-muted">{field.description}</small>}
      </div>
    </div>
  );
}

function CustomBuilder({
  ruleset,
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
  const fields = ruleset.sections.flatMap((section) => section.fields);
  return (
    <section className="border rounded p-3 mb-4">
      <div className="d-flex justify-content-between align-items-center">
        <h6 className="text-uppercase text-secondary fw-bold mb-0">
          Custom Ruleset Builder
        </h6>
        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-outline-secondary" onClick={onImport}>
            Import JSON
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onExport}>
            Export JSON
          </button>
        </div>
      </div>

      <div className="row g-2 mt-2">
        <div className="col-md-6">
          <label className="form-label">Ruleset Name</label>
          <input
            className="form-control form-control-sm"
            value={ruleset.name}
            onChange={(event) => onRulesetChange({ name: event.target.value })}
          />
        </div>
      </div>

      <hr />

      <div className="d-flex justify-content-between align-items-center">
        <strong>Attributes</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onFieldAdd}>
          + Add Attribute
        </button>
      </div>

      {fields.map((field) => (
        <div className="row g-2 mt-1 align-items-end" key={field.id}>
          <div className="col-7">
            <label className="small">Label</label>
            <input
              className="form-control form-control-sm"
              value={field.label}
              onChange={(event) => onFieldChange(field.id, { label: event.target.value })}
            />
          </div>
          <div className="col-3">
            <label className="small">Model</label>
            <select
              className="form-select form-select-sm"
              value={field.model || "raw"}
              onChange={(event) => onFieldChange(field.id, { model: event.target.value })}
            >
              <option value="raw">Raw</option>
              <option value="score">Score + Mod</option>
              <option value="percentile">Percentile</option>
              <option value="pool">Pool</option>
            </select>
          </div>
          <div className="col-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100"
              onClick={() => onFieldRemove(field.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="alert alert-light border small mt-3 mb-0">
        <strong>Attributes and formula variables:</strong> use the attribute labels in formulas. Duplicate
        labels are numbered in order, such as <code>Strength (2)</code>. For example, if <code>Strength</code>{" "}
        is 14, then <code>floor((Strength - 10) / 2)</code> evaluates to <strong>+2</strong>. Built-in
        variables include <code>level</code> and <code>hitDie</code>.
      </div>
      <hr />

      <div className="d-flex justify-content-between align-items-center">
        <strong>Derived formulas</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onFormulaAdd}>
          + Add Formula
        </button>
      </div>

      {(ruleset.derivedStats || []).map((stat) => (
        <div className="row g-2 mt-1" key={stat.id}>
          <div className="col-4">
            <input
              className="form-control form-control-sm"
              value={stat.label}
              onChange={(event) => onFormulaChange(stat.id, { label: event.target.value })}
            />
          </div>
          <div className="col-6">
            <input
              className="form-control form-control-sm font-monospace"
              value={formulaForDisplay(stat.formula, ruleset)}
              onChange={(event) => onFormulaChange(stat.id, { formula: formulaForStorage(event.target.value, ruleset) })}
              placeholder="floor((Constitution + Size) / 10)"
            />
          </div>
          <div className="col-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100"
              onClick={() => onFormulaRemove(stat.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="alert alert-light border small mt-3 mb-0">
        <strong>Derived formulas:</strong> use them to calculate values from attributes and built-in
        variables. For example, a derived stat named <em>Hit Points</em> with formula{" "}
        <code>level * hitDie + floor((Constitution - 10) / 2)</code> updates when those inputs
        change. Supported functions include <code>floor</code>, <code>ceil</code>, <code>round</code>,{" "}
        <code>min</code>, <code>max</code>, and <code>abs</code>.
      </div>
      <hr />

      <div className="d-flex justify-content-between align-items-center">
        <strong>Primary resources</strong>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onResourceAdd}>
          + Add Resource
        </button>
      </div>

      {(ruleset.resources || []).map((resource) => (
        <div className="row g-2 mt-1" key={resource.id}>
          <div className="col-5">
            <input
              className="form-control form-control-sm"
              value={resource.label}
              onChange={(event) => onResourceChange(resource.id, { label: event.target.value })}
            />
          </div>
          <div className="col-5">
            <input
              type="number"
              className="form-control form-control-sm"
              value={resource.defaultValue ?? 0}
              onChange={(event) =>
                onResourceChange(resource.id, { defaultValue: Number(event.target.value) })
              }
            />
          </div>
          <div className="col-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100"
              onClick={() => onResourceRemove(resource.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="alert alert-light border small mt-3 mb-0">
        <strong>Primary resources:</strong> use these for trackable pools such as Mana, Sanity, Luck,
        Rage, or Stress. Set the default value to the amount a new character starts with; the character
        sheet can then track the current amount.
      </div>
    </section>
  );
}
