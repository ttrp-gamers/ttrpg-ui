import { pdf } from "@react-pdf/renderer";
import { CharacterSheetDocument } from "./CharacterSheetDocument";

function safeFileName(value) {
  const name = String(value || "character-sheet")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${name || "character-sheet"}.pdf`;
}

export async function exportCharacterPdf(character, ruleset, derivedStats = {}) {
  const blob = await pdf(
    <CharacterSheetDocument
      character={character}
      ruleset={ruleset}
      derivedStats={derivedStats}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName(character.name);
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
