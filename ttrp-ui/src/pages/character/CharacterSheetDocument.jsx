import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", fontSize: 10, color: "#1f2937" },
  title: { fontSize: 20, marginBottom: 8, color: "#111827" },
  subtitle: { fontSize: 10, marginBottom: 6, color: "#4b5563" },
  metadata: { fontSize: 11, marginBottom: 10 },
  divider: { borderBottom: "1pt solid #9ca3af", marginBottom: 12 },
  hp: { fontSize: 12, marginBottom: 12, padding: 6, border: "1pt solid #6b7280" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, marginBottom: 5, color: "#111827" },
  field: { marginBottom: 4 },
  label: { fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 4 },
  noteLine: { borderBottom: "1pt solid #9ca3af", height: 22 },
});

function templateFor(rulesetKey) {
  if (rulesetKey === "DND_5E") return "D&D 5e character sheet";
  if (rulesetKey === "CALL_OF_CTHULHU_7E") return "Call of Cthulhu 7e investigator sheet";
  if (rulesetKey === "PATHFINDER_2E") return "Pathfinder 2e character sheet";
  return "Custom ruleset character sheet";
}

function fieldValue(character, fieldId) {
  return character.attributes?.values?.[fieldId] ?? "";
}

export function CharacterSheetDocument({ character, ruleset, derivedStats }) {
  const attributes = character.attributes || {};
  return (
    <Document title={character.name || "Character Sheet"} author="TTRP">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{character.name || "Unnamed Character"}</Text>
        <Text style={styles.subtitle}>
          {templateFor(attributes.rulesetKey)} | {ruleset.name || character.ruleset || ""}
        </Text>
        <Text style={styles.metadata}>
          {ruleset.terminology?.archetype || "Archetype"}: {character.characterClass || "—"}{"    "}
          {ruleset.terminology?.level || "Level"}: {character.level || 1}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.hp}>
          Hit Points: {character.currentHp ?? "—"} / {character.maxHp ?? "—"}
          {attributes.hitDie ? `    Hit Die: d${attributes.hitDie}` : ""}
        </Text>

        {(ruleset.sections || []).map((section) => (
          <View style={styles.section} key={section.id}>
            <Text style={styles.sectionTitle}>{section.title || "Attributes"}</Text>
            {(section.fields || []).map((field) => {
              const value = fieldValue(character, field.id);
              const percentile = field.model === "percentile"
                ? ` (half ${Math.floor(Number(value) / 2)}, fifth ${Math.floor(Number(value) / 5)})`
                : "";
              return (
                <Text style={styles.field} key={field.id}>
                  <Text style={styles.label}>{field.label || field.id}: </Text>
                  {value === "" ? "—" : String(value)}{percentile}
                </Text>
              );
            })}
          </View>
        ))}

        {ruleset.derivedStats?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Derived Statistics</Text>
            {ruleset.derivedStats.map((stat) => (
              <Text style={styles.field} key={stat.id}>
                <Text style={styles.label}>{stat.label || stat.id}: </Text>
                {derivedStats?.[stat.id] ?? "—"}
              </Text>
            ))}
          </View>
        )}

        {ruleset.resources?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources</Text>
            {ruleset.resources.map((resource) => (
              <Text style={styles.field} key={resource.id}>
                <Text style={styles.label}>{resource.label || resource.id}: </Text>
                {attributes.resources?.[resource.id] ?? resource.defaultValue ?? 0}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.notes}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.noteLine} />
          <View style={styles.noteLine} />
          <View style={styles.noteLine} />
        </View>
      </Page>
    </Document>
  );
}
