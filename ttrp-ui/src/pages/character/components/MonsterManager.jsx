import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MonsterService } from "../../../services/MonsterService";
import CustomRulesetBuilder from "./CustomRulesetBuilder";
import { RulesetAttributeSections, RulesetResources } from "./CharacterFields";
import {
  addCustomField as addCustomFieldToRuleset,
  addDerivedFormula as addDerivedFormulaToRuleset,
  addResource as addResourceToRuleset,
  removeCustomField as removeCustomFieldFromRuleset,
  removeDerivedFormula as removeDerivedFormulaFromRuleset,
  removeResource as removeResourceFromRuleset,
  exportRulesetJson,
  updateCustomField as updateCustomFieldInRuleset,
  updateDerivedFormula as updateDerivedFormulaInRuleset,
  updateResource as updateResourceInRuleset,
} from "../rulesets/customRulesetUtils";

const EMPTY_MONSTER_RULESET = {
  id: "custom",
  name: "Homebrew Monster Rules",
  description: "Build a custom monster statblock.",
  terminology: { archetype: "Type", level: "Level" },
  archetypes: [],
  sections: [],
  derivedStats: [],
  resources: [],
};
const EMPTY_MONSTER = {
  name: "", version: "2014", source: "Custom", monsterType: "Humanoid",
  challengeRating: "", maxHp: 1, currentHp: 1, size: "Medium", alignment: "",
  armorClass: "", speed: { unit: "feet", walk: 30, burrow: 0, climb: 0, fly: 0, swim: 0 },
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  traits: "", actions: "", notes: "", customFields: [],
  customRuleset: EMPTY_MONSTER_RULESET,
  customValues: {},
  customResources: {},
};
const MONSTER_TYPES = ["Aberration", "Beast", "Celestial", "Construct", "Dragon", "Elemental", "Fey", "Fiend", "Giant", "Humanoid", "Monstrosity", "Ooze", "Plant", "Undead"];
const MONSTER_SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const ALIGNMENTS = ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"];
const CHALLENGE_RATINGS = ["0", "1/8", "1/4", "1/2", ...Array.from({ length: 30 }, (_, index) => String(index + 1))];
const MONSTER_RESULTS_PER_PAGE = 15;
const ABILITY_SCORES = [
  ["strength", "Strength"], ["dexterity", "Dexterity"], ["constitution", "Constitution"],
  ["intelligence", "Intelligence"], ["wisdom", "Wisdom"], ["charisma", "Charisma"],
];
const MonsterContext = createContext(null);

function parseObject(value, fallback = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSpeed(value) {
  const speed = parseObject(value, {});
  return {
    unit: speed.unit || "feet",
    walk: Number(speed.walk) || 0,
    burrow: Number(speed.burrow) || 0,
    climb: Number(speed.climb) || 0,
    fly: Number(speed.fly) || 0,
    swim: Number(speed.swim) || 0,
  };
}

function normalizeAbilityScores(value) {
  const scores = parseObject(value, {});
  return Object.fromEntries(ABILITY_SCORES.map(([key]) => [key, Number(scores[key]) || 10]));
}

function entriesToText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((entry) => {
    if (typeof entry === "string") return entry;
    return [entry.name, entry.desc || entry.description].filter(Boolean).join(": ");
  }).filter(Boolean).join("\n\n");
}

function armorClassValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.value ?? value.ac ?? value.armor_class ?? "";
  return "";
}

function modifier(score) {
  const mod = Math.floor((Number(score) - 10) / 2);
  return `${mod >= 0 ? "+" : ""}${mod}`;
}

function safeFieldValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try { return JSON.stringify(value); } catch { return ""; }
}

function fromOpen5e(monster, version) {
  const speedSource = monster.speed_all || monster.speed;
  const abilitySource = monster.ability_scores || Object.fromEntries(
    ABILITY_SCORES.map(([key]) => [key, monster[key]]).filter(([, value]) => value !== undefined),
  );
  return {
    ...EMPTY_MONSTER,
    name: monster.name || "", version,
    source: monster.document?.name || "Open5e",
    monsterType: monster.type?.name || monster.type || "Monster",
    challengeRating: String(monster.challenge_rating ?? monster.challenge_rating_decimal ?? ""),
    maxHp: Number(monster.hit_points) || 1, currentHp: Number(monster.hit_points) || 1,
    size: monster.size?.name || monster.size || "Medium", alignment: monster.alignment || "",
    armorClass: armorClassValue(monster.armor_class),
    speed: normalizeSpeed(speedSource),
    abilityScores: normalizeAbilityScores(abilitySource),
    traits: entriesToText(monster.special_abilities || monster.traits),
    actions: entriesToText([...(monster.actions || []), ...(monster.legendary_actions || [])]),
    notes: monster.desc || "", raw: monster,
  };
}

export function MonsterManager({ user, onFeedback, children }) {
  const [monsters, setMonsters] = useState([]);
  const [form, setForm] = useState(EMPTY_MONSTER);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [browseVersion, setBrowseVersion] = useState("2014");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMonsters = useCallback(async () => {
    if (!user) return setMonsters([]);
    setLoading(true);
    try { setMonsters(await MonsterService.getAll()); }
    catch (error) { console.error("Failed to load monsters:", error); onFeedback("danger", "Failed to load saved monster statblocks."); }
    finally { setLoading(false); }
  }, [user, onFeedback]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchMonsters, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchMonsters]);

  const reset = useCallback(() => { setEditingId(null); setForm({ ...EMPTY_MONSTER }); }, []);
  const editMonster = useCallback((monster) => {
    const statblock = monster.statblock || {};
    setEditingId(monster.id);
    setForm({ ...EMPTY_MONSTER, ...statblock,
      armorClass: armorClassValue(statblock.armorClass),
      speed: normalizeSpeed(statblock.speed),
      abilityScores: normalizeAbilityScores(statblock.abilityScores),
      traits: entriesToText(statblock.traits),
      actions: entriesToText(statblock.actions),
      customFields: (statblock.customFields || []).map((field) => ({
        ...field,
        value: safeFieldValue(field.value),
      })),
      customRuleset: statblock.customRuleset || EMPTY_MONSTER_RULESET,
      customValues: statblock.customValues || {},
      customResources: statblock.customResources || {},
      name: monster.name, version: monster.version,
      source: monster.source || "Custom", monsterType: monster.monsterType || "",
      challengeRating: monster.challengeRating || "", maxHp: monster.maxHp, currentHp: monster.currentHp });
    document.getElementById("monster-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !user) return;
    const maxHp = Number(form.maxHp);
    const currentHp = Number(form.currentHp);
    if (!Number.isInteger(maxHp) || maxHp < 1 || !Number.isInteger(currentHp) || currentHp < 0 || currentHp > maxHp) {
      onFeedback("danger", "Current HP must be between 0 and maximum HP.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(), version: form.version, source: form.source, monsterType: form.monsterType,
      challengeRating: form.challengeRating, maxHp, currentHp,
      statblock: {
        ...form,
        armorClass: form.armorClass,
        speed: normalizeSpeed(form.speed),
        abilityScores: normalizeAbilityScores(form.abilityScores),
      },
    };
    try {
      const saved = editingId ? await MonsterService.update(editingId, payload) : await MonsterService.create(payload);
      setMonsters((previous) => editingId
        ? previous.map((monster) => monster.id === saved.id ? saved : monster) : [saved, ...previous]);
      onFeedback("success", `Monster "${saved.name}" ${editingId ? "updated" : "saved"} successfully.`);
      reset();
    } catch (error) {
      console.error("Monster save failed:", error);
      onFeedback("danger", error.response?.data?.message || "Failed to save monster statblock.");
    } finally { setSaving(false); }
  };

  const remove = async (monster) => {
    if (!window.confirm(`Delete monster "${monster.name}"?`)) return;
    try {
      await MonsterService.delete(monster.id);
      setMonsters((previous) => previous.filter((item) => item.id !== monster.id));
      if (editingId === monster.id) reset();
    } catch (error) { console.error("Monster delete failed:", error); onFeedback("danger", "Failed to delete monster."); }
  };

  const searchOpen5e = async (event) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const data = await MonsterService.searchOpen5e(browseVersion, query);
      setResults(data.results || []);
    } catch (error) {
      console.error("Open5e search failed:", error);
      onFeedback("danger", error.response?.data?.detail || "Could not fetch monsters from Open5e. Check your connection and try again.");
    } finally { setLoading(false); }
  };

  const value = {
    monsters, form, editingId, query, browseVersion, results, loading, saving, onFeedback,
    setForm, setQuery, setBrowseVersion, reset, editMonster, remove, save, searchOpen5e,
    fetchMonsters,
    chooseOpen5e: (monster) => { setEditingId(null); setForm(fromOpen5e(monster, browseVersion)); },
  };
  return <MonsterContext.Provider value={value}>{children}</MonsterContext.Provider>;
}

function useMonsters() {
  return useContext(MonsterContext);
}

export function MonsterEditor({ user }) {
  const importRef = useRef(null);
  const [searchPage, setSearchPage] = useState(1);
  const { form, editingId, query, browseVersion, results, loading, saving, setForm, setQuery,
    setBrowseVersion, reset, save, searchOpen5e, chooseOpen5e, onFeedback } = useMonsters();
  const totalSearchPages = Math.ceil(results.length / MONSTER_RESULTS_PER_PAGE);
  const displayedSearchPage = totalSearchPages > 0
    ? Math.min(searchPage, totalSearchPages)
    : 1;
  const pageResults = results.slice(
    (displayedSearchPage - 1) * MONSTER_RESULTS_PER_PAGE,
    displayedSearchPage * MONSTER_RESULTS_PER_PAGE,
  );
  const searchPageNumbers = (() => {
    if (totalSearchPages <= 7) {
      return Array.from({ length: totalSearchPages }, (_, index) => index + 1);
    }
    const pages = [1];
    const start = Math.max(2, displayedSearchPage - 1);
    const end = Math.min(totalSearchPages - 1, displayedSearchPage + 1);
    if (start > 2) pages.push("start-ellipsis");
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < totalSearchPages - 1) pages.push("end-ellipsis");
    pages.push(totalSearchPages);
    return pages;
  })();
  const changeSearchPage = (page) => {
    setSearchPage(page);
  };
  const handleSearch = async (event) => {
    setSearchPage(1);
    await searchOpen5e(event);
  };
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const updateNested = (key, nestedKey, value) => setForm((previous) => ({
    ...previous,
    [key]: { ...previous[key], [nestedKey]: value },
  }));
  const isDndRules = form.version === "2014" || form.version === "2024";
  const updateCustomRuleset = (updater) => setForm((previous) => ({
    ...previous,
    customRuleset: updater(previous.customRuleset),
  }));
  const addCustomField = () => {
    setForm((previous) => {
      const result = addCustomFieldToRuleset(previous.customRuleset, previous.customValues);
      return { ...previous, customRuleset: result.ruleset, customValues: result.values };
    });
  };
  const updateCustomField = (fieldId, patch) =>
    updateCustomRuleset((ruleset) => updateCustomFieldInRuleset(ruleset, fieldId, patch));
  const removeCustomField = (fieldId) => setForm((previous) => {
    const result = removeCustomFieldFromRuleset(previous.customRuleset, previous.customValues, fieldId);
    return { ...previous, customRuleset: result.ruleset, customValues: result.values };
  });
  const addDerivedFormula = () =>
    updateCustomRuleset((ruleset) => addDerivedFormulaToRuleset(ruleset));
  const updateDerivedFormula = (id, patch) =>
    updateCustomRuleset((ruleset) => updateDerivedFormulaInRuleset(ruleset, id, patch));
  const removeDerivedFormula = (id) =>
    updateCustomRuleset((ruleset) => removeDerivedFormulaFromRuleset(ruleset, id));
  const addResource = () =>
    updateCustomRuleset((ruleset) => addResourceToRuleset(ruleset));
  const updateResource = (id, patch) =>
    updateCustomRuleset((ruleset) => updateResourceInRuleset(ruleset, id, patch));
  const removeResource = (id) =>
    updateCustomRuleset((ruleset) => removeResourceFromRuleset(ruleset, id));
  const exportRuleset = () => exportRulesetJson(form.customRuleset);
  const importRuleset = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported.id || !imported.name || !Array.isArray(imported.sections)) {
          throw new Error("Invalid ruleset schema");
        }
        setForm((previous) => ({
          ...previous,
          customRuleset: imported,
          customValues: Object.fromEntries(
            (imported.sections || []).flatMap((section) => section.fields || []).map((field) => [
              field.id,
              field.defaultValue ?? (field.type === "text" || field.model === "text" ? "" : 0),
            ]),
          ),
          customResources: Object.fromEntries(
            (imported.resources || []).map((resource) => [resource.id, resource.defaultValue ?? 0]),
          ),
        }));
        onFeedback("success", "Custom monster ruleset imported.");
      } catch (error) {
        console.error("Monster ruleset import failed:", error);
        onFeedback("danger", "The selected file is not a valid monster ruleset JSON schema.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };
  return (
    <div id="monster-editor" className="card shadow-sm mt-4">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{editingId ? "Edit Monster Statblock" : "New Monster Statblock"}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={save}>
          <div className="row g-2">
            <div className="col-md-8"><label className="form-label">Name *</label><input className="form-control" value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">System Ruleset</label><select className="form-select" value={form.version} onChange={(e) => update("version", e.target.value)}><option value="2014">D&amp;D 5e (2014)</option><option value="2024">D&amp;D 5e (2024)</option><option value="Homebrew">Homebrew / Custom</option></select></div>
            <div className="col-md-6"><label className="form-label">Maximum HP</label><input type="number" min="1" className="form-control" value={form.maxHp} onChange={(e) => update("maxHp", e.target.value)} /></div>
            <div className="col-md-6"><label className="form-label">Current HP</label><input type="number" min="0" className="form-control" value={form.currentHp} onChange={(e) => update("currentHp", e.target.value)} /></div>
          </div>
          {isDndRules ? (
            <>
              <div className="row g-2 mt-2">
                <div className="col-md-4"><label className="form-label">Type</label><select className="form-select" value={form.monsterType} onChange={(e) => update("monsterType", e.target.value)}>{MONSTER_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
                <div className="col-md-4"><label className="form-label">Challenge Rating</label><select className="form-select" value={form.challengeRating} onChange={(e) => update("challengeRating", e.target.value)}><option value="">— Select —</option>{CHALLENGE_RATINGS.map((rating) => <option key={rating}>{rating}</option>)}</select></div>
                <div className="col-md-4"><label className="form-label">Source</label><input className="form-control" value={form.source} onChange={(e) => update("source", e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label">Size</label><select className="form-select" value={form.size} onChange={(e) => update("size", e.target.value)}>{MONSTER_SIZES.map((size) => <option key={size}>{size}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label">Alignment</label><select className="form-select" value={form.alignment} onChange={(e) => update("alignment", e.target.value)}><option value="">— Select —</option>{ALIGNMENTS.map((alignment) => <option key={alignment}>{alignment}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label">Armor Class</label><input type="number" min="0" className="form-control" value={form.armorClass} onChange={(e) => update("armorClass", e.target.value)} /></div>
              </div>
              <h6 className="text-uppercase text-secondary fw-bold mt-4 mb-2">Speed</h6>
              <div className="row g-2">{[["walk", "Walk"], ["fly", "Fly"], ["burrow", "Burrow"], ["climb", "Climb"], ["swim", "Swim"]].map(([key, label]) => (
                <div className="col-6 col-md-4" key={key}><div className="p-2 border rounded bg-light"><label className="form-label mb-1 fw-bold">{label}</label><input type="number" min="0" className="form-control form-control-sm text-center fw-bold" value={form.speed?.[key] || 0} onChange={(e) => updateNested("speed", key, Number(e.target.value))} /></div></div>
              ))}</div>
              <h6 className="text-uppercase text-secondary fw-bold mt-4 mb-2">Ability Scores</h6>
              <div className="row g-2">{ABILITY_SCORES.map(([key, label]) => (
                <div className="col-6 col-md-4" key={key}><div className="p-2 border rounded bg-light"><label className="form-label mb-1 fw-bold">{label}</label><input type="number" min="1" max="30" className="form-control form-control-sm text-center fw-bold" value={form.abilityScores?.[key] ?? 10} onChange={(e) => updateNested("abilityScores", key, Number(e.target.value))} /><small className="text-muted d-block mt-1 text-center">Modifier: {modifier(form.abilityScores?.[key] ?? 10)}</small></div></div>
              ))}</div>
              <div className="row g-2 mt-3">{[["traits", "Traits"], ["actions", "Actions"], ["notes", "Notes"]].map(([key, label]) => (
                <div className="col-12" key={key}><label className="form-label">{label}</label><textarea className="form-control" rows={key === "notes" ? 3 : 4} value={typeof form[key] === "string" ? form[key] : entriesToText(form[key])} onChange={(e) => update(key, e.target.value)} /></div>
              ))}</div>
            </>
          ) : (
            <>
            <CustomRulesetBuilder
              ruleset={form.customRuleset}
              className="mt-4"
              onRulesetChange={(patch) => updateCustomRuleset((ruleset) => ({ ...ruleset, ...patch }))}
              onFieldAdd={addCustomField}
              onFieldChange={updateCustomField}
              onFieldRemove={removeCustomField}
              onFormulaAdd={addDerivedFormula}
              onFormulaChange={updateDerivedFormula}
              onFormulaRemove={removeDerivedFormula}
              onResourceAdd={addResource}
              onResourceChange={updateResource}
              onResourceRemove={removeResource}
              onImport={() => importRef.current?.click()}
              onExport={exportRuleset}
            />
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="d-none"
              onChange={importRuleset}
            />
            <RulesetAttributeSections
              ruleset={form.customRuleset}
              values={form.customValues}
              onChange={(fieldId, value) => setForm((previous) => ({
                ...previous,
                customValues: { ...previous.customValues, [fieldId]: value },
              }))}
            />
            <RulesetResources
              resources={form.customRuleset.resources}
              values={form.customResources}
              onChange={(resourceId, value) => setForm((previous) => ({
                ...previous,
                customResources: { ...previous.customResources, [resourceId]: value },
              }))}
            />
            </>
          )}
          <div className="d-grid gap-2 mt-3">
            <button className="btn btn-primary btn-lg" type="submit" disabled={saving || !user}>
              {saving ? "Saving..." : editingId ? "Update Monster Statblock" : "Save Monster to Account"}
            </button>
            {editingId && <button className="btn btn-outline-secondary" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
        <form onSubmit={handleSearch} className="border rounded p-3 mt-4">
          <h6 className="text-uppercase text-secondary fw-bold">Find Open5e Monsters</h6>
          <div className="input-group mb-2"><input className="form-control" placeholder="Search by name (optional)" value={query} onChange={(e) => { setQuery(e.target.value); setSearchPage(1); }} /><button className="btn btn-outline-primary" type="submit" onClick={() => setSearchPage(1)} disabled={loading}>Search</button></div>
          <select className="form-select form-select-sm" value={browseVersion} onChange={(e) => { setBrowseVersion(e.target.value); setSearchPage(1); }}><option value="2014">2014 SRD</option><option value="2024">2024 SRD</option></select>
          <small className="text-muted d-block mt-2">Select a result to copy it into the editor, then save it to your library.</small>
          <div className="d-flex flex-column gap-2 mt-3">{pageResults.map((monster) => <button className="btn btn-outline-light text-start" type="button" key={monster.key || monster.name} onClick={() => chooseOpen5e(monster)}><div className="d-flex align-items-center justify-content-between gap-2"><strong>{monster.name}</strong><span className="badge bg-info text-dark">D&amp;D {browseVersion}</span></div><span className="small text-muted d-block">{monster.type?.name || monster.type || "Monster"} · CR {monster.challenge_rating ?? "—"}</span></button>)}</div>
          {totalSearchPages > 1 && (
            <nav className="monster-search-pagination mt-3" aria-label="Monster search results pages">
              <ul className="pagination pagination-sm justify-content-center mb-0 flex-wrap">
                <li className={`page-item ${displayedSearchPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" type="button" onClick={() => changeSearchPage(displayedSearchPage - 1)} disabled={displayedSearchPage === 1} aria-label="Previous page">Previous</button>
                </li>
                {searchPageNumbers.map((page) => typeof page === "number" ? (
                  <li className={`page-item ${displayedSearchPage === page ? "active" : ""}`} key={page}>
                    <button className="page-link" type="button" onClick={() => changeSearchPage(page)} aria-current={displayedSearchPage === page ? "page" : undefined}>{page}</button>
                  </li>
                ) : (
                  <li className="page-item disabled" key={page} aria-hidden="true"><span className="page-link">…</span></li>
                ))}
                <li className={`page-item ${displayedSearchPage === totalSearchPages ? "disabled" : ""}`}>
                  <button className="page-link" type="button" onClick={() => changeSearchPage(displayedSearchPage + 1)} disabled={displayedSearchPage === totalSearchPages} aria-label="Next page">Next</button>
                </li>
              </ul>
            </nav>
          )}
        </form>
      </div>
    </div>
  );
}

export function MonsterOverview({ user }) {
  const { monsters, loading, results, editMonster, remove, fetchMonsters } = useMonsters();
  return (
    <div className="card shadow-sm mt-4">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Your Saved Monsters</h5>
        <button
          className="btn btn-outline-light btn-sm"
          type="button"
          onClick={fetchMonsters}
          disabled={loading || !user}
        >
          Refresh
        </button>
      </div>
      <div className="card-body">
        {!user ? (
          <div className="text-center py-4 text-muted">
            <p>Log in to save monster statblocks.</p>
            <Link to="/" className="btn btn-outline-primary btn-sm">Go to Login</Link>
          </div>
        ) : loading && !results.length ? (
          <div className="text-center py-4 text-muted">Loading monsters...</div>
        ) : monsters.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p className="mb-1">No monsters saved yet.</p>
            <small>Fill out the form to create your first monster statblock.</small>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">{monsters.map((monster) => <div className="card" key={monster.id}><div className="card-body p-2"><div className="d-flex justify-content-between align-items-start gap-2"><div><h6 className="mb-1 text-truncate">{monster.name}</h6><div className="small text-muted">{monster.monsterType || "Monster"} · CR {monster.challengeRating || "—"}</div></div><span className="badge bg-info text-dark">{monster.version}</span></div><div className="small text-muted mt-1">{monster.currentHp} / {monster.maxHp} HP · {monster.source || "Custom"}</div><div className="d-flex justify-content-end gap-2 mt-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editMonster(monster)}>Edit</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => remove(monster)}>Delete</button></div></div></div>)}</div>
        )}
      </div>
    </div>
  );
}
