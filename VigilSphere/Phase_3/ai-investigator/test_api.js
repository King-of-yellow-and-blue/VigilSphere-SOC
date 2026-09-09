/**
 * test_api.js — Quick smoke-test for the /api/investigate route.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. In another terminal:   node test_api.js
 */

const BASE_URL = "http://localhost:3000/api/investigate";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function runTest(label, body) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TEST: ${label}`);
  console.log("=".repeat(70));

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log(`Status : ${res.status}`);
    console.log(`Response:`);
    console.log(JSON.stringify(data, null, 2));

    return { status: res.status, data };
  } catch (err) {
    console.error(`FETCH ERROR: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------
async function main() {
  console.log("🔍 AI Investigator API — Test Suite");
  console.log(`   Target: ${BASE_URL}\n`);

  // ── Test 1: Valid SSH brute-force log ────────────────────────────────────
  const t1 = await runTest("Valid SSH brute-force log", {
    log_text:
      "Failed password for root from 185.12.34.56 port 22 ssh2",
  });

  if (t1 && t1.status === 200) {
    const keys = Object.keys(t1.data);
    const expected = ["explanation", "predicted_next_move", "remediation_script"];
    const hasAll = expected.every((k) => keys.includes(k));
    console.log(
      `\n✅ Schema check: ${hasAll ? "PASS — all 3 keys present" : "FAIL — missing keys: " + expected.filter((k) => !keys.includes(k)).join(", ")}`
    );
  }

  // ── Test 2: Empty log_text → expect 400 ─────────────────────────────────
  const t2 = await runTest("Empty log_text (expect 400)", {
    log_text: "",
  });

  if (t2) {
    console.log(
      `\n${t2.status === 400 ? "✅" : "❌"} Expected 400, got ${t2.status}`
    );
  }

  // ── Test 3: Missing log_text field → expect 400 ─────────────────────────
  const t3 = await runTest("Missing log_text field (expect 400)", {
    some_other_field: "hello",
  });

  if (t3) {
    console.log(
      `\n${t3.status === 400 ? "✅" : "❌"} Expected 400, got ${t3.status}`
    );
  }

  // ── Test 4: Benign / non-attack log ─────────────────────────────────────
  const t4 = await runTest("Benign non-attack log", {
    log_text:
      "Sep  8 10:15:22 webserver01 systemd[1]: Started Daily apt download activities.",
  });

  if (t4 && t4.status === 200) {
    const keys = Object.keys(t4.data);
    const expected = ["explanation", "predicted_next_move", "remediation_script"];
    const hasAll = expected.every((k) => keys.includes(k));
    console.log(
      `\n✅ Schema check: ${hasAll ? "PASS — all 3 keys present" : "FAIL — missing keys: " + expected.filter((k) => !keys.includes(k)).join(", ")}`
    );
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("All tests completed.");
  console.log("=".repeat(70) + "\n");
}

main();
