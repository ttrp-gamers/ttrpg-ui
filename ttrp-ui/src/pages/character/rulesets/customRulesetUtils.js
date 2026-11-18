export function addCustomField(ruleset, values, fieldOptions = {}) {
  const field = {
    id: `attribute${Date.now()}`,
    label: "New Attribute",
    type: "text",
    model: "text",
    defaultValue: "",
    ...fieldOptions,
  };
  const sections = ruleset.sections || [];
  return {
    ruleset: {
      ...ruleset,
      sections: sections.length
        ? sections.map((section, index) => index === 0
          ? { ...section, fields: [...(section.fields || []), field] }
          : section)
        : [{ id: "custom-attributes", title: "Custom Attributes", fields: [field] }],
    },
    values: {
      ...values,
      [field.id]: field.defaultValue,
    },
  };
}

export function updateCustomField(ruleset, fieldId, patch) {
  return {
    ...ruleset,
    sections: (ruleset.sections || []).map((section) => ({
      ...section,
      fields: (section.fields || []).map((field) => field.id === fieldId ? { ...field, ...patch } : field),
    })),
  };
}

export function removeCustomField(ruleset, values, fieldId) {
  const nextValues = { ...values };
  delete nextValues[fieldId];
  return {
    ruleset: {
      ...ruleset,
      sections: (ruleset.sections || []).map((section) => ({
        ...section,
        fields: (section.fields || []).filter((field) => field.id !== fieldId),
      })),
    },
    values: nextValues,
  };
}

export function addDerivedFormula(ruleset) {
  return {
    ...ruleset,
    derivedStats: [
      ...(ruleset.derivedStats || []),
      { id: `derived${Date.now()}`, label: "New Derived Stat", formula: "0" },
    ],
  };
}

export function updateDerivedFormula(ruleset, id, patch) {
  return {
    ...ruleset,
    derivedStats: (ruleset.derivedStats || []).map((stat) => stat.id === id ? { ...stat, ...patch } : stat),
  };
}

export function removeDerivedFormula(ruleset, id) {
  return {
    ...ruleset,
    derivedStats: (ruleset.derivedStats || []).filter((stat) => stat.id !== id),
  };
}

export function addResource(ruleset) {
  return {
    ...ruleset,
    resources: [
      ...(ruleset.resources || []),
      { id: `resource${Date.now()}`, label: "New Resource", defaultValue: 0 },
    ],
  };
}

export function updateResource(ruleset, id, patch) {
  return {
    ...ruleset,
    resources: (ruleset.resources || []).map((resource) => resource.id === id ? { ...resource, ...patch } : resource),
  };
}

export function removeResource(ruleset, id) {
  return {
    ...ruleset,
    resources: (ruleset.resources || []).filter((resource) => resource.id !== id),
  };
}

export function rulesetFileName(name) {
  const safeName = String(name || "custom-ruleset")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safeName || "custom-ruleset"}.json`;
}

export function exportRulesetJson(ruleset) {
  const blob = new Blob([JSON.stringify(ruleset, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = rulesetFileName(ruleset.name);
  anchor.click();
  URL.revokeObjectURL(url);
}
