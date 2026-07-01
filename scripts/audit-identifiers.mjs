import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;
const sourceRoots = ["src", "api", "scripts", "tests"];
const rootFiles = ["vite.config.js"];
const sourceFiles = [];

function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(filePath);
    else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) sourceFiles.push(filePath);
  }
}

sourceRoots.forEach((root) => collectFiles(root));
sourceFiles.push(...rootFiles);

const browserAndNodeGlobals = new Set([
  "AbortController",
  "AbortSignal",
  "Array",
  "Boolean",
  "Buffer",
  "Date",
  "Element",
  "Error",
  "Headers",
  "HTMLElement",
  "Infinity",
  "Intl",
  "JSON",
  "Map",
  "Math",
  "NaN",
  "Node",
  "Number",
  "Object",
  "Promise",
  "RangeError",
  "RegExp",
  "Request",
  "Response",
  "Set",
  "String",
  "TextDecoder",
  "TextEncoder",
  "TypeError",
  "URL",
  "URLSearchParams",
  "WeakMap",
  "WeakSet",
  "clearInterval",
  "clearTimeout",
  "console",
  "crypto",
  "decodeURIComponent",
  "document",
  "encodeURIComponent",
  "fetch",
  "globalThis",
  "localStorage",
  "navigator",
  "process",
  "queueMicrotask",
  "sessionStorage",
  "setInterval",
  "setTimeout",
  "structuredClone",
  "undefined",
  "window",
]);

const issues = [];

for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  let ast;

  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: [
        "classPrivateProperties",
        "classProperties",
        "importMeta",
        "jsx",
        "topLevelAwait",
      ],
    });
  } catch (error) {
    issues.push(`${filePath}: gagal diparse — ${error.message}`);
    continue;
  }

  traverse(ast, {
    ReferencedIdentifier(identifierPath) {
      const name = identifierPath.node.name;
      if (browserAndNodeGlobals.has(name)) return;
      if (identifierPath.scope.hasBinding(name, true)) return;

      issues.push(
        `${filePath}:${identifierPath.node.loc?.start.line || "?"} — identifier "${name}" tidak didefinisikan`,
      );
    },
  });
}

if (issues.length) {
  console.error(
    "Audit identifier gagal:\n" + issues.map((item) => `- ${item}`).join("\n"),
  );
  process.exit(1);
}

console.log("✓ Tidak ada identifier JavaScript yang tidak didefinisikan.");
