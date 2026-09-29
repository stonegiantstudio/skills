import { test } from "node:test";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {
  PLAYWRIGHT_VERSION, PLAYWRIGHT_CLI_VERSION, cacheHome, playwrightDir, stableHome, cliConfigPath, cliConfig, cliDir, profileRoot, cliGlobalHome, lockDir, sandboxSetting,
} from "../scripts/lib/versions.mjs";

test("the version is pinned, not a range", () => {
  assert.match(PLAYWRIGHT_VERSION, /^\d+\.\d+\.\d+$/);
});

test("cache and stable homes follow XDG, and AGENT_BROWSING_HOME wins", () => {
  const env = { HOME: "/h", XDG_CACHE_HOME: "/c", XDG_DATA_HOME: "/d" };
  assert.equal(cacheHome(env), "/c/agent-browsing");
  assert.equal(stableHome(env), "/d/agent-browsing");
  assert.equal(cacheHome({ HOME: "/h" }), "/h/.cache/agent-browsing");
  assert.equal(stableHome({ HOME: "/h" }), "/h/.local/share/agent-browsing");
  assert.equal(cacheHome({ HOME: "/h", AGENT_BROWSING_HOME: "/x" }), "/x");
  assert.equal(playwrightDir({ HOME: "/h" }), `/h/.cache/agent-browsing/playwright-core-${PLAYWRIGHT_VERSION}`);
});

test("the CLI config picks the headless shell and keeps output out of the repo", () => {
  const env = { HOME: "/h" };
  assert.match(PLAYWRIGHT_CLI_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(cliConfigPath(env), "/h/.cache/agent-browsing/playwright-cli.json");
  assert.equal(cliDir(env), `/h/.cache/agent-browsing/playwright-cli-${PLAYWRIGHT_CLI_VERSION}`);
  const c = cliConfig(env);
  assert.equal(c.browser.browserName, "chromium");
  assert.equal(c.browser.launchOptions.channel, "chromium-headless-shell");
  assert.equal(c.browser.launchOptions.headless, true);
  assert.equal(c.browser.isolated, true);
  assert.equal(c.browser.launchOptions.chromiumSandbox, true, "on unless setup found the machine cannot give one");
  assert.equal(cliConfig(env, false).browser.launchOptions.chromiumSandbox, false);
  assert.equal(cliGlobalHome(env), "/h/.cache/agent-browsing/cli-home");
  assert.equal(lockDir(env), "/h/.cache/agent-browsing/locks");
  assert.equal(c.outputDir, "/h/.cache/agent-browsing/playwright-cli-output");
  assert.equal(profileRoot(env), "/h/.cache/agent-browsing/profiles");
});

test("shot.mjs and sessions share the sandbox setting setup recorded, and it is on when there is none", () => {
  const home = mkdtempSync(path.join(tmpdir(), "ab-"));
  try {
    const env = { AGENT_BROWSING_HOME: home };
    assert.equal(sandboxSetting(env), true, "not set up yet");
    writeFileSync(cliConfigPath(env), JSON.stringify(cliConfig(env, false)));
    assert.equal(sandboxSetting(env, "linux"), false);
    assert.equal(sandboxSetting(env, "darwin"), true, "a config copied from a Linux machine does not switch it off here");
    writeFileSync(cliConfigPath(env), "not json");
    assert.equal(sandboxSetting(env), true);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
