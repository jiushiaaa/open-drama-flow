#!/usr/bin/env node
import { renderLocalEdit } from "../src/local-edit.mjs";
const [planPath, outputDirectory, flag] = process.argv.slice(2);
if (!planPath || !outputDirectory || (flag && flag !== "--validate-only")) {
  console.error("Usage: node scripts/edit-local-media.mjs ABSOLUTE_PLAN_JSON NEW_ABSOLUTE_OUTPUT_DIRECTORY [--validate-only]");
  process.exitCode = 1;
} else {
  try { console.log(JSON.stringify(await renderLocalEdit({ planPath, outputDirectory, validateOnly: flag === "--validate-only" }), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
