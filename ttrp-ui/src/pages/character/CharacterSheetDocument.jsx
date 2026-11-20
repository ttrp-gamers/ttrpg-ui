import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const colors = {
  black: "#111111",
  gray: "#555555",
  borderGray: "#b8b8b8",
  lightGray: "#f5f5f5",
  darkGray: "#333333",
  paleGray: "#eeeeee",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.black,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    marginBottom: 14,
    borderBottom: `2pt solid ${colors.black}`,
  },
  eyebrow: {
    color: colors.darkGray,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  title: { color: colors.black, fontSize: 25, fontFamily: "Helvetica-Bold" },
  ruleset: { color: colors.gray, fontSize: 9, textAlign: "right", maxWidth: 180 },
  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.black,
    paddingVertical: 6,
    paddingHorizontal: 9,
    marginBottom: 8,
    borderRadius: 3,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  identityGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  identityCell: { width: "25%", paddingHorizontal: 4, marginBottom: 8 },
  identityCellWide: { width: "50%", paddingHorizontal: 4, marginBottom: 8 },
  label: {
    color: colors.gray,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: { fontSize: 10, minHeight: 14 },
  empty: { color: colors.gray },
  statRow: { flexDirection: "row", marginHorizontal: -4 },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 9,
    backgroundColor: colors.paleGray,
    border: `1pt solid ${colors.borderGray}`,
    borderRadius: 4,
  },
  statValue: { color: colors.black, fontSize: 17, fontFamily: "Helvetica-Bold", marginTop: 2 },
  statSubvalue: { color: colors.gray, fontSize: 8, marginTop: 2 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  fieldCard: {
    width: "33.333%",
    paddingHorizontal: 3,
    marginBottom: 7,
  },
  fieldCardWide: { width: "100%", paddingHorizontal: 3, marginBottom: 7 },
  fieldInner: {
    minHeight: 42,
    padding: 7,
    backgroundColor: colors.lightGray,
    border: `1pt solid ${colors.borderGray}`,
    borderRadius: 3,
  },
  fieldValue: { fontSize: 10, lineHeight: 1.25 },
  fieldDescription: { color: colors.gray, fontSize: 7.5, lineHeight: 1.2, marginTop: 3 },
  fieldMeta: { color: colors.darkGray, fontSize: 7.5, marginTop: 3 },
  notes: {
    padding: 10,
    minHeight: 70,
    backgroundColor: colors.lightGray,
    border: `1pt solid ${colors.borderGray}`,
    borderRadius: 3,
    lineHeight: 1.35,
  },
  footer: {
    position: "absolute",
    bottom: 17,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.gray,
    fontSize: 7,
    borderTop: `1pt solid ${colors.borderGray}`,
    paddingTop: 5,
  },
});

function templateFor(rulesetKey) {
  if (rulesetKey === "DND_5E_2014") return "D&D 5e · 2014";
  if (rulesetKey === "DND_5E_2024") return "D&D 5e · 2024";
  if (rulesetKey === "CALL_OF_CTHULHU_7E") return "Call of Cthulhu · 7e";
  if (rulesetKey === "PATHFINDER_2E") return "Pathfinder · 2e";
  return "Custom ruleset";
}

function fieldValue(character, fieldId) {
  return character.attributes?.values?.[fieldId] ?? "";
}

function printable(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function FieldCard({ field, character }) {
  const rawValue = fieldValue(character, field.id);
  const value = printable(rawValue);
  const isLong = field.type === "text" || field.model === "text";
  const isPercentile = field.model === "percentile" && rawValue !== "";
  const percentile = isPercentile
    ? `Half ${Math.floor(Number(rawValue) / 2)} · Fifth ${Math.floor(Number(rawValue) / 5)}`
    : "";

  return (
    <View style={isLong ? styles.fieldCardWide : styles.fieldCard} wrap={false}>
      <View style={styles.fieldInner}>
        <Text style={styles.label}>{field.label || field.id}</Text>
        <Text style={[styles.fieldValue, value === "—" ? styles.empty : null]}>{value}</Text>
        {percentile && <Text style={styles.fieldMeta}>{percentile}</Text>}
        {field.description && <Text style={styles.fieldDescription}>{field.description}</Text>}
      </View>
    </View>
  );
}

function SectionHeader({ children }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function CharacterSheetDocument({ character, ruleset = {}, derivedStats = {} }) {
  const attributes = character.attributes || {};
  const isDndRuleset = attributes.rulesetKey?.startsWith("DND_5E");
  const terminology = ruleset.terminology || {};
  const archetypeLabel = terminology.archetype || "Archetype";
  const levelLabel = terminology.level || "Level";
  const sections = ruleset.sections || [];
  const derived = ruleset.derivedStats || [];
  const resources = ruleset.resources || [];

  return (
    <Document title={character.name || "Character Sheet"} author="TTRP">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TTRP · Character Record</Text>
            <Text style={styles.title}>{character.name || "Unnamed Character"}</Text>
          </View>
          <Text style={styles.ruleset}>
            {templateFor(attributes.rulesetKey)}
            {"\n"}
            {ruleset.name || character.ruleset || "Character Sheet"}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader>Identity</SectionHeader>
          <View style={styles.identityGrid}>
            <View style={styles.identityCell}>
              <Text style={styles.label}>{archetypeLabel}</Text>
              <Text style={styles.value}>{printable(character.characterClass)}</Text>
            </View>
            <View style={styles.identityCell}>
              <Text style={styles.label}>{levelLabel}</Text>
              <Text style={styles.value}>{printable(character.level)}</Text>
            </View>
            {isDndRuleset && (
              <>
                <View style={styles.identityCell}>
                  <Text style={styles.label}>Species</Text>
                  <Text style={styles.value}>{printable(character.species)}</Text>
                </View>
                <View style={styles.identityCell}>
                  <Text style={styles.label}>Alignment</Text>
                  <Text style={styles.value}>{printable(character.alignment)}</Text>
                </View>
              </>
            )}
            {isDndRuleset && (
              <View style={styles.identityCellWide}>
                <Text style={styles.label}>Subclass</Text>
                <Text style={styles.value}>{printable(attributes.subclass)}</Text>
              </View>
            )}
            {isDndRuleset && (
              <View style={styles.identityCellWide}>
                <Text style={styles.label}>Background</Text>
                <Text style={styles.value}>{printable(character.background)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader>Vital Statistics</SectionHeader>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.label}>Hit points</Text>
              <Text style={styles.statValue}>
                {printable(character.currentHp)} / {printable(character.maxHp)}
              </Text>
              <Text style={styles.statSubvalue}>Current / Maximum</Text>
            </View>
            {isDndRuleset && (
              <View style={styles.statBox}>
                <Text style={styles.label}>Hit die</Text>
                <Text style={styles.statValue}>{attributes.hitDie ? `d${attributes.hitDie}` : "—"}</Text>
                <Text style={styles.statSubvalue}>Recovery die</Text>
              </View>
            )}
            {isDndRuleset && derived.length === 0 && (
              <View style={styles.statBox}>
                <Text style={styles.label}>Ruleset</Text>
                <Text style={styles.statValue}>{templateFor(attributes.rulesetKey)}</Text>
              </View>
            )}
          </View>
        </View>

        {derived.length > 0 && (
          <View style={styles.section} wrap={false}>
            <SectionHeader>Derived Statistics</SectionHeader>
            <View style={styles.fieldGrid}>
              {derived.map((stat) => (
                <View style={styles.fieldCard} key={stat.id}>
                  <View style={styles.fieldInner}>
                    <Text style={styles.label}>{stat.label || stat.id}</Text>
                    <Text style={styles.statValue}>{printable(derivedStats[stat.id])}</Text>
                    {stat.formula && <Text style={styles.fieldDescription}>{stat.formula}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {resources.length > 0 && (
          <View style={styles.section} wrap={false}>
            <SectionHeader>Resources</SectionHeader>
            <View style={styles.fieldGrid}>
              {resources.map((resource) => (
                <View style={styles.fieldCard} key={resource.id}>
                  <View style={styles.fieldInner}>
                    <Text style={styles.label}>{resource.label || resource.id}</Text>
                    <Text style={styles.statValue}>
                      {printable(attributes.resources?.[resource.id] ?? resource.defaultValue ?? 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {sections.map((section) => (
          <View style={styles.section} key={section.id}>
            <SectionHeader>{section.title || "Attributes"}</SectionHeader>
            <View style={styles.fieldGrid}>
              {(section.fields || []).map((field) => (
                <FieldCard key={field.id} field={field} character={character} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <SectionHeader>Notes</SectionHeader>
          <View style={styles.notes}>
            <Text style={character.notes ? null : styles.empty}>{printable(character.notes)}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>TTRP · Character Sheet</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
