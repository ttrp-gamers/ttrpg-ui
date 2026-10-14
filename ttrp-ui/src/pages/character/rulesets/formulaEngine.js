const TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(.))\s*/y;

function formulaWithAttributeIds(source, ruleset) {
  const seenNames = new Map();
  const replacements = (ruleset.sections || []).flatMap((section) => section.fields || []).map((field) => {
    const baseName = String(field.label || field.id || "Attribute").trim() || "Attribute";
    const occurrence = (seenNames.get(baseName) || 0) + 1;
    seenNames.set(baseName, occurrence);
    return [occurrence === 1 ? baseName : `${baseName} (${occurrence})`, field.id];
  });

  return replacements
    .sort(([left], [right]) => right.length - left.length)
    .reduce((result, [from, to]) => {
      const escaped = String(from).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), to);
    }, String(source || ""));
}

function tokenize(source) {
  const tokens = [];
  let offset = 0;
  while (offset < source.length) {
    TOKEN.lastIndex = offset;
    const match = TOKEN.exec(source);
    if (!match) throw new Error(`Unexpected token at ${offset + 1}`);
    tokens.push(match[1] ? { type: "number", value: Number(match[1]) } : match[2] ? { type: "name", value: match[2] } : { type: match[3], value: match[3] });
    offset = TOKEN.lastIndex;
  }
  tokens.push({ type: "eof" });
  return tokens;
}

export function evaluateFormula(source, values) {
  if (!source || typeof source !== "string") return null;
  try {
    const tokens = tokenize(source);
    let cursor = 0;
    const peek = () => tokens[cursor];
    const consume = (type) => {
      if (peek().type !== type) throw new Error(`Expected ${type}`);
      return tokens[cursor++];
    };
    const expression = () => {
      let value = term();
      while (peek().type === "+" || peek().type === "-") {
        const operator = consume(peek().type).type;
        const right = term();
        value = operator === "+" ? value + right : value - right;
      }
      return value;
    };
    const term = () => {
      let value = factor();
      while (peek().type === "*" || peek().type === "/") {
        const operator = consume(peek().type).type;
        const right = factor();
        if (operator === "/" && right === 0) throw new Error("Division by zero");
        value = operator === "*" ? value * right : value / right;
      }
      return value;
    };
    const factor = () => {
      if (peek().type === "-") {
        consume("-");
        return -factor();
      }
      if (peek().type === "(") {
        consume("(");
        const value = expression();
        consume(")");
        return value;
      }
      if (peek().type === "number") return consume("number").value;
      const name = consume("name").value;
      if (peek().type === "(") {
        consume("(");
        const args = [expression()];
        while (peek().type === ",") {
          consume(",");
          args.push(expression());
        }
        consume(")");
        if (!["floor", "ceil", "round", "min", "max", "abs"].includes(name)) throw new Error(`Unsupported function ${name}`);
        return Math[name](...args);
      }
      if (!(name in values)) throw new Error(`Unknown variable ${name}`);
      return Number(values[name]) || 0;
    };
    const result = expression();
    consume("eof");
    return Number.isFinite(result) ? Math.round(result * 100) / 100 : null;
  } catch {
    return null;
  }
}

export function evaluateDerivedStats(ruleset, values, level, hitDie = 8) {
  const context = { ...values, level: Number(level) || 1, hitDie: Number(hitDie) || 8 };
  return Object.fromEntries((ruleset.derivedStats || []).map((stat) => [
    stat.id,
    evaluateFormula(formulaWithAttributeIds(stat.formula, ruleset), context),
  ]));
}
