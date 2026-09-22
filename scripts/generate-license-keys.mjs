#!/usr/bin/env node
/**
 * Generates license keys for Español Real Premium.
 *
 * Keys are opaque credentials. They become valid only after an operator stores
 * them in the database for a specific account/order.
 *
 * Usage:
 *   node scripts/generate-license-keys.mjs 20
 *   node scripts/generate-license-keys.mjs 5 --prefix ESPA
 */
import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KEY_LENGTH = 20;

function pickRandom(index) {
  void index;
  return ALPHABET[randomBytes(1)[0] % ALPHABET.length];
}

function generateKey(prefix = "") {
  const wanted = prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .split("")
    .filter((char) => ALPHABET.includes(char))
    .slice(0, KEY_LENGTH);

  const clean = [];
  for (let i = 0; i < KEY_LENGTH; i++) {
    clean.push(wanted[i] ?? pickRandom(i));
  }
  return clean.join("");
}

function format(clean) {
  return (clean.match(/.{1,4}/g) ?? []).join("-");
}

const args = process.argv.slice(2);
const count = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 10);
const prefixArg = args.find((arg) => arg.startsWith("--prefix="));
const prefix = prefixArg ? prefixArg.split("=")[1] : "";

console.log(`# Español Real — ${count} Premium key(s)`);
for (let i = 0; i < count; i++) {
  const key = generateKey(prefix);
  console.log(format(key));
}
