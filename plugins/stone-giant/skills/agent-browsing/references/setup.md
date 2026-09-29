# Setting up a machine

Run `node <skill>/scripts/setup.mjs` once per machine and `--link` once after it. Everything below is optional wiring that makes cleanup automatic.

## macOS

**Clean up after every Claude Code session.** Add a `SessionEnd` hook to `~/.claude/settings.json`, merged with any hooks already there:

```json
{
  "hooks": {
    "SessionEnd": [
      { "hooks": [ { "type": "command", "command": "node \"${XDG_DATA_HOME:-$HOME/.local/share}/agent-browsing/current/scripts/reap.mjs\" --yes --quiet" } ] }
    ]
  }
}
```

It stops only browsers an automation tool launched and then abandoned (see the rules in `SKILL.md`), and does nothing when there are none. When the skill's scripts change, run `setup.mjs --link` again: the hook runs the linked copy.

**Old browser builds.** Every Playwright version installs its own browser build into `~/Library/Caches/ms-playwright`. Playwright deletes a build on its next install once no installed copy of Playwright uses it, so builds that linger are held by old copies: stale `npx` caches in `~/.npm/_npx` and other projects' `node_modules`. Check the size with `du -sh ~/Library/Caches/ms-playwright`. Don't run `playwright uninstall` to tidy up: it removes the builds the running installation uses.

**chrome-devtools-mcp, when you need it.** Its default mode opens the installed Chrome with a window and a shared profile. Register it isolated and headless instead:

```bash
claude mcp add --scope user chrome-devtools -- npx chrome-devtools-mcp@1.9.0 --isolated --headless
```

**Permission prompts.** These tools launch the browser with a mock keychain, so they never ask for Keychain access. A prompt that says an app "would like to access data from other apps" comes from a file search walking `~/Library`, not from a browser. Keep searches inside the project.

## Linux servers and CI

**System libraries.** The headless shell needs about twenty shared libraries. Run setup as the user who will use it, then install the libraries once; that step asks for sudo itself:

```bash
node <skill>/scripts/setup.mjs
node ~/.cache/agent-browsing/playwright-core-<version>/node_modules/playwright-core/cli.js install-deps chromium
node <skill>/scripts/setup.mjs
```

`<version>` is the pinned `playwright-core`, which `setup.mjs --check` prints. The first run installs the browsers and fails its closing screenshot when libraries are missing; the second, with the libraries in place, finishes, and decides whether Chromium's sandbox can run here.

If setup's closing screenshot fails with a missing `.so` file, the libraries are what it lacks.

**Chromium's sandbox.** It stays on wherever the machine can give it one. Ubuntu 23.10 and later block the unprivileged user namespaces it needs, and a sandboxed browser can't start there, so on Linux setup tries one and records the answer. Only a launch that fails for want of the sandbox, followed by one that works without it, turns it off; setup says so, and `shot.mjs` and `cli.mjs` sessions then run without it. Any other failure leaves the sandbox on and is reported. To keep it on, allow user namespaces for the headless shell with an AppArmor profile, then run setup again. The Linux CI job found this on GitHub's Ubuntu 24.04 runner.

**Run agents under a service that caps them.** Browsers an agent starts belong to the agent's service, so the service's limits hold them too:

```ini
[Service]
MemoryMax=10G
TasksMax=2048
KillMode=control-group
```

**Reap after each agent session.** A long-running worker keeps orphans until it restarts. Call the reaper when each session ends:

```bash
node "${XDG_DATA_HOME:-$HOME/.local/share}/agent-browsing/current/scripts/reap.mjs" --yes --quiet
```

It leaves any browser younger than two minutes, since one whose tool has just exited is usually closing on its own and a signal would only race that. It checks each one again before signalling it.

**Containers.** Where pid 1 is an init system (`tini`, `docker-init`, `systemd`), a browser re-parented to it is abandoned. Where pid 1 is the app itself or `sleep infinity`, it may be the tool that launched the browser, so a browser whose parent is pid 1 is left alone. Start such containers with `--init` so the reaper can tell. On a Linux desktop, a browser re-parented to `systemd --user` counts as abandoned.

## Protected Vercel previews

Create a Protection Bypass for Automation secret in the Vercel project's Deployment Protection settings. Put it in the environment as `VERCEL_AUTOMATION_BYPASS_SECRET`, never on a command line, where it would land in the process list and in transcripts. Then list the preview's exact host for the run:

```bash
AGENT_BROWSING_BYPASS_HOSTS=myapp-git-my-branch-myteam.vercel.app \
  node <skill>/scripts/shot.mjs https://myapp-git-my-branch-myteam.vercel.app/ /tmp/preview.png
```

The list is comma-separated, each entry a `host` or `host:port`, over https unless the host is this machine. Wildcards are refused: `vercel.app` project names are first come, first served, so a pattern like `*-myteam.vercel.app` matches a name anyone can register. `shot.mjs` adds the header only to requests for a listed host, and fetches them without following redirects, so a redirect to a payment page or a sign-in provider arrives there without it. Fonts, analytics and scripts the page loads from other origins never see it, and it is kept out of the browser's environment, out of `cli.mjs` sessions, and out of Playwright's debug logging.
