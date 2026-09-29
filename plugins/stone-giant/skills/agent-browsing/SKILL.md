---
description: Give a coding agent a browser without slowing down or cluttering the machine. Use it to look at a page, whether that means screenshotting a local HTML file or design mockup, checking localhost or a deployed or preview URL, clicking through a flow, or reading what a page shows. Covers which tool fits which job, protected Vercel previews, headless Linux servers, and finding and stopping browsers an agent left running. Triggers on "screenshot", "look at the page", "open the mockup", "check the preview", "is the UI right", "click through", "browser", "headless", "playwright", "orphaned chrome".
---

# Agent browsing

There are two ways to see a page. One screenshot starts a browser, takes the picture and exits. A session keeps a browser open while you drive it one command at a time. Both run headless in a throwaway profile, so they never touch the person's own Chrome, bind no port, and leave nothing running when they finish.

`<skill>` below means this skill's folder, the base directory shown when the skill loads.

## The rules

1. **Headless, always.** A visible window never times out; it holds the machine until someone closes it.
2. **Never the person's own Chrome.** Don't attach to it, don't launch with its profile, and don't import its cookies. It holds their logins and their tabs.
3. **No fixed debugging ports.** These tools talk to the browser over a pipe. Two agents on one port is how one of them fails to start.
4. **Close what you open.** Sessions shut themselves down after 10 minutes idle. Close yours sooner.
5. **Use the lightest tool that answers the question.** One screenshot beats a session, and a session beats a person's browser.

## Pick the tool

| You want to | Use |
|---|---|
| See a page or a local file once | `node <skill>/scripts/shot.mjs` |
| Click, type, and read the page as you go | `node <skill>/scripts/cli.mjs` |
| See console errors or network requests | `cli.mjs console` and `cli.mjs requests` in a session |
| Profile performance | chrome-devtools-mcp, only in `--isolated --headless` mode |
| Read a page behind the person's own login, with them at the keyboard | Claude in Chrome |
| Read a page behind a login on a server | A test account: log in once in a session, `cli.mjs state-save ~/.cache/agent-browsing/state/<name>.json`, then `state-load` it in later sessions. Keep the file out of the repo: it holds the account's cookies |
| Check a protected Vercel preview | `shot.mjs`, with `VERCEL_AUTOMATION_BYPASS_SECRET` in the environment and the preview's exact host in `AGENT_BROWSING_BYPASS_HOSTS`. The secret goes only to requests for that host; a redirect to another site goes without it. Wildcards are refused, because anyone can register a `vercel.app` name that matches one |
| Check the same flow on every build | Playwright's test agents write the test; commit it, and CI replays it with no model in the loop |

## One screenshot: `shot.mjs`

```bash
node <skill>/scripts/shot.mjs <url|path> <out.png|out.jpg> [--viewport=1280x800] [--full-page] [--wait=<ms>] [--timeout=<seconds>]
```

```bash
# One frame of a design mockup: a #fragment on a file path is the page anchor
node <skill>/scripts/shot.mjs docs/mockups/checkout.html#frame-2 /tmp/frame-2.png --viewport=1100x1300

# The app running locally, at phone size
node <skill>/scripts/shot.mjs http://localhost:5173/ /tmp/today.png --viewport=390x844

# A deployed page
node <skill>/scripts/shot.mjs https://example.com /tmp/home.png
```

Then read the image. It exits 0 when the file is written, 1 when the page failed or timed out, and 2 when the machine isn't set up or an argument or URL is malformed; a server needs its scheme (`http://localhost:5173/`, not `localhost:5173/`). Launching, loading and capturing each get `--timeout` (at most 300 seconds), so a whole run gives up after three times that, plus `--wait` (at most 120,000 ms), plus five seconds.

A page that draws with WebGL works in the headless shell, which renders it in software: expect about 12 seconds a shot on a heavy canvas.

A screenshot costs tokens when you read it: about 1,200 for 1280x720. Shoot the viewport, or one frame by its anchor. A full-page capture of a long page gets shrunk until small text can't be read.

## A session: `cli.mjs`

`cli.mjs` is Playwright CLI with this skill's defaults already applied: the pinned version, the headless shell, a 10-minute idle timeout, sessions named for the git checkout, and snapshots written to `~/.cache/agent-browsing/playwright-cli-output` instead of the repo. A Playwright CLI config in your home folder (`~/.playwright/cli.config.json`) is not read, so nothing in it can point a session at your own browser.

```bash
node <skill>/scripts/cli.mjs open https://example.com   # prints the path of a snapshot file
node <skill>/scripts/cli.mjs snapshot                   # the page's elements, each with a ref like e12
node <skill>/scripts/cli.mjs click e12
node <skill>/scripts/cli.mjs fill e7 "hello@example.com"
node <skill>/scripts/cli.mjs screenshot
node <skill>/scripts/cli.mjs console                    # console messages
node <skill>/scripts/cli.mjs requests                   # network requests
node <skill>/scripts/cli.mjs close
```

A snapshot is written to a file and only its path is printed. Read the file when you need it. A session can't open `file:` URLs; screenshot a local file with `shot.mjs`, or serve its folder and open the `http://` address. Commands that act on your session pass through. `node <skill>/scripts/cli.mjs --help` prints the CLI's whole list, including the commands below that `cli.mjs` refuses, and names Playwright's own agent skill; this skill's rules are the ones that apply. Commands that reach beyond your session (`kill-all`, `close-all`, `attach`, `show`, the installers) are refused. So are flags that reach the person's own Chrome, open a window, or swap in another config (`--profile`, `--persistent`, `--cdp`, `--extension`, `--headed`, `--browser`, `--config`), `list --all`, which reads every workspace and the person's Chrome profiles, and an `--idle-timeout` of 0 or over an hour.

Two worktrees get two sessions. Two agents in one checkout share the default one, so a second `open` on a live session is refused, and so is one that starts at the same moment as another: pass `-s=<name>` for a session of your own, or `--replace` to start it over. A named session lives under the checkout's name, so `-s=main` in one worktree never reaches `-s=main` in another.

Each command is a separate call, about a second apart. For anything that has to happen faster, such as holding a key for 150 ms and capturing the frame, run the steps in one `run-code` call:

```bash
node <skill>/scripts/cli.mjs run-code "async page => { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(150); await page.screenshot({ path: '/tmp/held.png' }); await page.keyboard.up('ArrowRight'); }"
```

`run-code` is the one command that reaches past the session: its code runs in the CLI's own Node process, so it can do anything your shell can. Use it to drive the page, and nothing else. `keydown` and `keyup` hold and release a key across separate commands, which is how a key that sticks can be reproduced.

For many commands in a row, a shell function saves retyping the path, in bash and in zsh alike (zsh won't run a command kept in a variable together with its arguments): `cli() { node <skill>/scripts/cli.mjs "$@"; }`, then `cli open http://localhost:5173/`.

## Before you finish

```bash
node <skill>/scripts/cli.mjs close        # if you opened a session
node <skill>/scripts/doctor.mjs           # exit 0: nothing abandoned
node <skill>/scripts/reap.mjs --yes       # only if the doctor exited 1
```

`doctor.mjs` only reads. It lists agent browsers, the tools that own them, and any browser whose launcher died; a session you still have open is listed too, and is fine. `reap.mjs` stops only the abandoned ones, and it's a dry run without `--yes`. A browser counts only when all of these hold:

- It belongs to you.
- Its program is a Chromium-family browser.
- An automation tool launched it headless over a debugging pipe, with no debugging port that another tool could still be driving it through.
- Its profile is a throwaway: Playwright's or Puppeteer's temp profile, or this skill's own.

Apps you open, browsers you start by hand, a window you opened through Playwright, and chrome-devtools-mcp's persistent window never qualify. The doctor and the reaper read each candidate's executable from the operating system (not the name it gives itself); one they can't read is listed as `UNREAD` and left alone. Each is checked again just before any signal, so a process that changed in the meantime is left alone too.

## First time on a machine

```bash
node <skill>/scripts/setup.mjs            # about 200 MB, once
node <skill>/scripts/setup.mjs --check    # exit 0 when ready, 3 when not
node <skill>/scripts/setup.mjs --link     # a copy at ~/.local/share/agent-browsing/current for hooks and services
node <skill>/scripts/setup.mjs --help
```

Setup installs the pinned `playwright-core` and Playwright CLI into `~/.cache/agent-browsing` (never into the project), and the CLI's config. The two headless-shell builds it adds (one for each, since the CLI bundles its own Playwright) go where every Playwright install keeps its browsers, `~/Library/Caches/ms-playwright` on macOS and `~/.cache/ms-playwright` on Linux. It finishes by taking a real screenshot. The linked copy is named by a fingerprint of the scripts; `--check` tells you when it differs from them, and `--link` replaces it. Machine-level wiring, such as a cleanup hook, Linux services, and the Vercel secret, is in [`references/setup.md`](references/setup.md).

## Avoid

- **Attaching to the person's Chrome** (`--cdp=chrome`, `--extension`, `--autoConnect`, a remote-debugging toggle). It shares their logins and their browser process.
- **chrome-devtools-mcp in its default mode.** It opens the installed Chrome with a window and one shared profile, so parallel sessions collide, and the person may be using that window, so the reaper never touches it.
- **Browser MCP and the archived Puppeteer MCP.** The first is unmaintained and kills whatever holds its port at startup. The second is no longer maintained.
- **Plain `npx @playwright/cli`.** It runs the installed Google Chrome, puts snapshots in the repo, and idles for an hour. `cli.mjs` fixes all three.
- **File searches across `~/Library` on macOS.** Walking other apps' data folders brings up a permission prompt again and again.

Why these choices: [`references/research.md`](references/research.md).
