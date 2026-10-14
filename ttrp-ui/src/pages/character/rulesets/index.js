import dnd5e from "./dnd5e.json";
import callOfCthulhu7e from "./callOfCthulhu7e.json";
import pathfinder2e from "./pathfinder2e.json";
import custom from "./custom.json";

export const RULESET_PRESETS = {
  DND_5E: dnd5e,
  CALL_OF_CTHULHU_7E: callOfCthulhu7e,
  PATHFINDER_2E: pathfinder2e,
  CUSTOM: custom,
};

export const getAllFields = (ruleset) => ruleset.sections.flatMap((section) => section.fields);
