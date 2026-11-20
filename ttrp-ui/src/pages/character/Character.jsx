import "./Character.css";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CharacterService } from "../../services/CharacterService";
import { useAuth } from "../auth/AuthContext";
import { RulesetAttributeSections, RulesetResources } from "./components/CharacterFields";
import CustomRulesetBuilder from "./components/CustomRulesetBuilder";
import { MonsterEditor, MonsterManager, MonsterOverview } from "./components/MonsterManager";
import { evaluateDerivedStats } from "./rulesets/formulaEngine";
import {
  addCustomField as addCustomFieldToRuleset,
  addDerivedFormula as addDerivedFormulaToRuleset,
  addResource as addResourceToRuleset,
  removeCustomField as removeCustomFieldFromRuleset,
  removeDerivedFormula as removeDerivedFormulaFromRuleset,
  removeResource as removeResourceFromRuleset,
  updateCustomField as updateCustomFieldInRuleset,
  updateDerivedFormula as updateDerivedFormulaInRuleset,
  updateResource as updateResourceInRuleset,
} from "./rulesets/customRulesetUtils";
import { exportCharacterPdf } from "./pdfExport";

const DEFAULT_HIT_DIE = 8;
const SYSTEM_RULESET_LABELS = {
  DND_5E_2014: "Dungeons & Dragons 5e (2014)",
  DND_5E_2024: "Dungeons & Dragons 5e (2024)",
  CUSTOM: "Homebrew / Custom",
};
const SYSTEM_RULESET_ORDER = ["DND_5E_2014", "DND_5E_2024", "CUSTOM"];
const EMPTY_CUSTOM_RULESET = {
  id: "custom",
  name: "Homebrew/Custom",
  description: "Start with an empty ruleset and define the fields your game needs.",
  terminology: { archetype: "Archetype", level: "Level" },
  archetypes: [],
  sections: [],
  derivedStats: [],
  resources: [],
};
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
  return rulesetKey.startsWith("DND_5E") ? DND_HIT_DICE[archetype] || 8 : DEFAULT_HIT_DIE;
}

function valuesForRuleset(ruleset, existing = {}) {
  return Object.fromEntries((ruleset.sections || []).flatMap((section) => section.fields || []).map((field) => [
    field.id,
    existing[field.id] ?? field.defaultValue ?? (field.type === "text" || field.model === "text" ? "" : 0),
  ]));
}

function createInitialForm() {
  return {
    name: "",
    rulesetKey: "DND_5E_2014",
    archetype: "",
    subclass: "",
    customArchetype: "",
    species: "",
    background: "",
    alignment: "",
    notes: "",
    level: 1,
    hitDie: DEFAULT_HIT_DIE,
    values: {},
    resources: {},
    autoCalculateHp: true,
    maxHp: 10,
    currentHp: 10,
    customRuleset: EMPTY_CUSTOM_RULESET,
  };
}

function displayNumber(value) {
  return value === null || value === undefined ? "—" : value;
}

function saveErrorMessage(error) {
  const response = error?.response?.data;
  const validationErrors = response?.validationErrors;
  if (validationErrors && typeof validationErrors === "object") {
    return Object.values(validationErrors).join(" ");
  }
  return response?.detail || response?.message || error?.message || "Failed to save character sheet to account.";
}
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

function rulesetForCharacter(character, rulesets) {
  if (character.attributes?.rulesetKey === "CUSTOM" && character.attributes?.rulesetSchema) {
    return character.attributes.rulesetSchema;
  }
  return Object.values(rulesets).find((ruleset) => ruleset.name === character.ruleset)
    || rulesets.CUSTOM
    || EMPTY_CUSTOM_RULESET;
}

function hpForCharacter(character, rulesets) {
  const ruleset = rulesetForCharacter(character, rulesets);
  const attributes = character.attributes || {};
  const calculatedHp = attributes.derivedStats?.hitPoints ?? evaluateDerivedStats(
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

function exportDataForForm(form, activeRuleset, derivedStats) {
  const effectiveArchetype = form.archetype === "Custom" ? form.customArchetype || "Custom" : form.archetype;
  return {
    name: form.name || "character-sheet",
    characterClass: effectiveArchetype,
    species: form.species,
    background: form.background,
    alignment: form.alignment,
    notes: form.notes,
    level: Number(form.level) || 1,
    ruleset: activeRuleset.name,
    maxHp: form.autoCalculateHp && derivedStats.hitPoints !== null ? derivedStats.hitPoints : form.maxHp,
    currentHp: form.autoCalculateHp && derivedStats.hitPoints !== null ? derivedStats.hitPoints : form.currentHp,
    attributes: {
      rulesetKey: form.rulesetKey,
      rulesetSchema: form.rulesetKey === "CUSTOM" ? form.customRuleset : undefined,
      values: form.values,
      resources: form.resources,
      hitDie: form.hitDie,
      subclass: form.subclass,
    },
  };
}

export default function Character() {
  const { user } = useAuth();
  const [form, setForm] = useState(createInitialForm);
  const [editingId, setEditingId] = useState(null);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [rulesets, setRulesets] = useState({});
  const [isLoadingRulesets, setIsLoadingRulesets] = useState(true);
  const [rulesetsError, setRulesetsError] = useState(null);
  const [catalog, setCatalog] = useState({
    classes2014: [],
    subclasses2014: [],
    classes2024: [],
    subclasses2024: [],
    species: [],
    backgrounds: [],
  });
  const [derivedStats, setDerivedStats] = useState({});
  const handleMonsterFeedback = useCallback((type, message) => setFeedback({ type, message }), []);

  const activeRuleset = form.rulesetKey === "CUSTOM" ? form.customRuleset : rulesets[form.rulesetKey];
  const calculatedHp = derivedStats.hitPoints;
  const hpStat = activeRuleset?.derivedStats?.find((stat) => stat.id === "hitPoints");
  const catalogVersion = form.rulesetKey === "DND_5E_2024" ? "2024" : "2014";
  const classEntries = catalog[`classes${catalogVersion}`] || [];
  const subclassEntries = (catalog[`subclasses${catalogVersion}`] || []).filter(
    (entry) => entry.subclass_of?.name === form.archetype
      || entry.subclass_of?.key === classEntries.find((classEntry) => classEntry.name === form.archetype)?.key,
  );

  useEffect(() => {
    Promise.all([CharacterService.getRulesets(), CharacterService.getCatalog()])
      .then(([definitions, characterCatalog]) => {
        setCatalog(characterCatalog);
        const loadedRulesets = Object.fromEntries(definitions.map((ruleset) => [
              ruleset.id === "DND_5E_2014" ? "DND_5E_2014"
                : ruleset.id === "DND_5E_2024" ? "DND_5E_2024" : "CUSTOM",
          ruleset,
        ]));
        setRulesets(loadedRulesets);
        setForm((previous) => {
          if (previous.values && Object.keys(previous.values).length > 0) return previous;
          const defaultRuleset = loadedRulesets.DND_5E_2014 || loadedRulesets.CUSTOM;
          return {
            ...createInitialForm(),
            rulesetKey: defaultRuleset === loadedRulesets.CUSTOM ? "CUSTOM" : "DND_5E_2014",
            archetype: defaultRuleset.archetypes?.[4] || defaultRuleset.archetypes?.[0] || "",
            hitDie: hitDieFor("DND_5E_2014", defaultRuleset.archetypes?.[4]),
            values: valuesForRuleset(defaultRuleset),
            customRuleset: loadedRulesets.CUSTOM || EMPTY_CUSTOM_RULESET,
          };
        });
      })
      .catch((error) => {
        console.error("Failed to load rulesets:", error);
        setRulesetsError("Failed to load character rulesets from the server.");
      })
      .finally(() => setIsLoadingRulesets(false));
  }, []);

  useEffect(() => {
    let active = true;
    CharacterService.calculate({
      rulesetKey: form.rulesetKey,
      rulesetSchema: form.rulesetKey === "CUSTOM" ? form.customRuleset : undefined,
      values: form.values,
      level: Number(form.level) || 1,
      hitDie: Number(form.hitDie) || 8,
    })
      .then((result) => {
        if (active) setDerivedStats(result.derivedStats || {});
      })
      .catch((error) => {
        console.error("Failed to calculate character stats:", error);
        if (active) setDerivedStats({});
      })
    return () => { active = false; };
  }, [form.rulesetKey, form.customRuleset, form.values, form.level, form.hitDie]);

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
    const ruleset = rulesetKey === "CUSTOM" ? form.customRuleset : rulesets[rulesetKey];
    setForm((previous) => ({
      ...previous,
      rulesetKey,
      archetype: ruleset.archetypes?.[0] || "",
      subclass: "",
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
      subclass: "",
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
    setForm((previous) => {
      const result = addCustomFieldToRuleset(previous.customRuleset, previous.values, { min: 0 });
      return { ...previous, customRuleset: result.ruleset, values: result.values };
    });
  };

  const updateCustomField = (fieldId, patch) =>
    updateCustomRuleset((ruleset) => updateCustomFieldInRuleset(ruleset, fieldId, patch));

  const removeCustomField = (fieldId) => {
    setForm((previous) => {
      const result = removeCustomFieldFromRuleset(previous.customRuleset, previous.values, fieldId);
      return { ...previous, customRuleset: result.ruleset, values: result.values };
    });
  };

  const addDerivedFormula = () =>
    updateCustomRuleset((ruleset) => addDerivedFormulaToRuleset(ruleset));

  const updateDerivedFormula = (id, patch) =>
    updateCustomRuleset((ruleset) => updateDerivedFormulaInRuleset(ruleset, id, patch));

  const removeDerivedFormula = (id) =>
    updateCustomRuleset((ruleset) => removeDerivedFormulaFromRuleset(ruleset, id));

  const addResource = () =>
    updateCustomRuleset((ruleset) => addResourceToRuleset(ruleset));

  const updateResourceDefinition = (id, patch) =>
    updateCustomRuleset((ruleset) => updateResourceInRuleset(ruleset, id, patch));

  const removeResource = (id) =>
    updateCustomRuleset((ruleset) => removeResourceFromRuleset(ruleset, id));

  const resetForm = () => {
    const defaultRuleset = rulesets.DND_5E_2014 || rulesets.CUSTOM || EMPTY_CUSTOM_RULESET;
    setForm({
      ...createInitialForm(),
      rulesetKey: defaultRuleset === rulesets.CUSTOM ? "CUSTOM" : "DND_5E_2014",
      archetype: defaultRuleset.archetypes?.[4] || defaultRuleset.archetypes?.[0] || "",
      hitDie: hitDieFor("DND_5E_2014", defaultRuleset.archetypes?.[4]),
      values: valuesForRuleset(defaultRuleset),
      customRuleset: rulesets.CUSTOM || EMPTY_CUSTOM_RULESET,
    });
    setEditingId(null);
  };

  const handleEdit = (character) => {
    const key = Object.keys(rulesets).find((presetKey) => rulesets[presetKey].name === character.ruleset)
      || (character.ruleset === "Dungeons & Dragons 5e" ? "DND_5E_2014" : null);
    const rulesetKey = key || "CUSTOM";
    const ruleset = rulesetKey === "CUSTOM"
      ? (character.attributes?.rulesetSchema || rulesets.CUSTOM || EMPTY_CUSTOM_RULESET)
      : rulesets[rulesetKey];
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
      subclass: character.attributes?.subclass || "",
      customArchetype: savedCustomArchetype,
      species: character.species || "",
      background: character.background || "",
      alignment: character.alignment || "",
      notes: character.notes || "",
      level: character.level || 1,
      hitDie: rulesetKey.startsWith("DND_5E")
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

  const exportFormPdf = async () => {
    try {
      await exportCharacterPdf(
      exportDataForForm(form, activeRuleset, derivedStats),
      activeRuleset,
      derivedStats,
      );
    } catch (error) {
      console.error("Character PDF export failed:", error);
      setFeedback({ type: "danger", message: "Failed to export the character sheet as PDF." });
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
      species: form.species,
      background: form.background,
      alignment: form.alignment,
      notes: form.notes,
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
      setFeedback({ type: "danger", message: saveErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRulesets) {
    return <div className="container py-4 character-rulesets-loading" role="status">Loading character rulesets...</div>;
  }

  if (rulesetsError) {
    return <div className="container py-4"><div className="alert alert-danger" role="alert">{rulesetsError}</div></div>;
  }

  return (
    <div className="container py-4 character-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Character Creation & Monster Manager</h2>
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

      <MonsterManager user={user} onFeedback={handleMonsterFeedback}>
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
                  {form.rulesetKey.startsWith("DND_5E") && (
                    <>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Species</label>
                        <select className="form-select" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                          <option value="">— Select —</option>
                          {catalog.species.map((entry) => <option key={entry.key} value={entry.name}>{entry.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Background</label>
                        <select className="form-select" value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })}>
                          <option value="">— Select —</option>
                          {catalog.backgrounds.map((entry) => <option key={entry.key} value={entry.name}>{entry.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">Alignment</label>
                        <select className="form-select" value={form.alignment} onChange={(e) => setForm({ ...form, alignment: e.target.value })}>
                          <option value="">— Select —</option>
                          {[
                            "Lawful Good",
                            "Neutral Good",
                            "Chaotic Good",
                            "Lawful Neutral",
                            "True Neutral",
                            "Chaotic Neutral",
                            "Lawful Evil",
                            "Neutral Evil",
                            "Chaotic Evil",
                            "Unaligned",
                          ].map((alignment) => <option key={alignment} value={alignment}>{alignment}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes</label>
                    <textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                      {SYSTEM_RULESET_ORDER.filter((key) => rulesets[key]).map((key) => (
                        <option key={key} value={key}>
                          {SYSTEM_RULESET_LABELS[key]}
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
                      {(classEntries.length > 0
                        ? classEntries.map((entry) => entry.name)
                        : activeRuleset.archetypes || []).map((archetype) => (
                        <option key={archetype}>{archetype}</option>
                      ))}
                      {form.rulesetKey === "CUSTOM" && <option value="Custom">Custom</option>}
                    </select>
                  </div>
                  {form.rulesetKey.startsWith("DND_5E") && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Subclass</label>
                      <select
                        className="form-select"
                        value={form.subclass}
                        onChange={(e) => setForm((previous) => ({ ...previous, subclass: e.target.value }))}
                        disabled={!form.archetype || subclassEntries.length === 0}
                      >
                        <option value="">— Select —</option>
                        {subclassEntries.map((entry) => (
                          <option key={entry.key} value={entry.name}>{entry.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  {form.rulesetKey.startsWith("DND_5E") && (
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

                <RulesetAttributeSections
                  ruleset={activeRuleset}
                  values={form.values}
                  onChange={updateValue}
                />

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

                <RulesetResources
                  resources={activeRuleset.resources}
                  values={form.resources}
                  onChange={updateResource}
                />

                {(hpStat || form.rulesetKey === "CUSTOM") && (
                  <div className="row g-3 align-items-center mb-4">
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
                  <CustomRulesetBuilder
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
                  />
                )}
                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-primary mb-2"
                    onClick={exportFormPdf}
                    disabled={!activeRuleset}
                  >
                    Export Character Sheet PDF
                  </button>
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
                    const fieldNames = namedFields(rulesetForCharacter(character, rulesets));
                    const { currentHp, maxHp } = hpForCharacter(character, rulesets);

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
                              className="btn btn-sm btn-outline-secondary"
                              onClick={async () => {
                                try {
                                  await exportCharacterPdf(
                                    character,
                                    rulesetForCharacter(character, rulesets),
                                    character.attributes?.derivedStats || evaluateDerivedStats(
                                      rulesetForCharacter(character, rulesets),
                                      character.attributes?.values || {},
                                      character.level,
                                      character.attributes?.hitDie,
                                    ),
                                  );
                                } catch (error) {
                                  console.error("Character PDF export failed:", error);
                                  setFeedback({ type: "danger", message: "Failed to export the character sheet as PDF." });
                                }
                              }}
                            >
                              PDF
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
      <div className="row g-4">
        <div className="col-lg-7">
          <MonsterEditor user={user} />
        </div>
        <div className="col-lg-5">
          <MonsterOverview user={user} />
        </div>
      </div>
      </MonsterManager>
    </div>
  );
}

