// The one place a version or a path is decided. Bumping Playwright is a
// one-line change here, followed by `node setup.mjs` on each machine.
import path from "node:path";
import os from "node:os";
import { readFileSync } from "node:fs";

export const PLAYWRIGHT_VERSION = "1.63.0";
export const PLAYWRIGHT_CLI_VERSION = "0.1.21";

const home = (env) => env.HOME || os.homedir();

export function cacheHome(env = process.env) {
  if (env.AGENT_BROWSING_HOME) return env.AGENT_BROWSING_HOME;
  return path.join(env.XDG_CACHE_HOME || path.join(home(env), ".cache"), "agent-browsing");
}

export function playwrightDir(env = process.env) {
  return path.join(cacheHome(env), `playwright-core-${PLAYWRIGHT_VERSION}`);
}

// shot.mjs launches each browser with a profile under this folder, so its
// browsers carry a mark no person's browser can have.
export function profileRoot(env = process.env) {
  return path.join(cacheHome(env), "profiles");
}

export function stableHome(env = process.env) {
  return path.join(env.XDG_DATA_HOME || path.join(home(env), ".local", "share"), "agent-browsing");
}

export function cliDir(env = process.env) {
  return path.join(cacheHome(env), `playwright-cli-${PLAYWRIGHT_CLI_VERSION}`);
}

// Playwright CLI reads this file for its browser and output folder. Every CLI
// release bundles its own Playwright build, so it gets its own headless shell;
// the default would otherwise be the installed Google Chrome.
export function cliConfigPath(env = process.env) {
  return path.join(cacheHome(env), "playwright-cli.json");
}

// Chromium's sandbox stays on wherever the machine can give it one. Ubuntu
// 23.10 and later block the user namespaces it needs, and a sandboxed browser
// cannot start there, so setup.mjs tries one on Linux and records the answer
// here; shot.mjs reads the same setting.
export function cliConfig(env = process.env, sandbox = true) {
  return {
    browser: {
      browserName: "chromium",
      isolated: true,
      launchOptions: { channel: "chromium-headless-shell", headless: true, chromiumSandbox: sandbox },
    },
    outputDir: path.join(cacheHome(env), "playwright-cli-output"),
  };
}

// The sandbox answer setup.mjs recorded, or null when there is none to read.
export function recordedSandbox(env = process.env) {
  try {
    const recorded = JSON.parse(readFileSync(cliConfigPath(env), "utf8")).browser?.launchOptions?.chromiumSandbox;
    if (typeof recorded === "boolean") return recorded;
  } catch { /* not set up yet */ }
  return null;
}

// Off only where setup found it must be, and only on Linux, the one place
// that can happen; a config copied from a Linux machine does not switch it
// off anywhere else.
export function sandboxSetting(env = process.env, platform = process.platform) {
  return !(recordedSandbox(env) === false && platform === "linux");
}

// The CLI also reads <home>/.playwright/cli.config.json underneath the file
// above, and keys that file sets and ours doesn't (a profile, an executable,
// a debugging port) would reach every session. cli.mjs points it at this
// empty folder instead of the person's home.
export function cliGlobalHome(env = process.env) {
  return path.join(cacheHome(env), "cli-home");
}

// Held while `open` checks for a live session and starts one, so two agents
// cannot both see none and start the same session over each other.
export function lockDir(env = process.env) {
  return path.join(cacheHome(env), "locks");
}
