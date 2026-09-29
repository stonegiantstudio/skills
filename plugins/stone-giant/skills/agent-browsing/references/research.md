# Why these choices

A research round in September 2026 compared nineteen local browser tools, ten cloud browser providers, and the autonomous browser agents. It also covered what people using Claude Code, Cursor and Codex report in practice. This page keeps the findings that shaped the skill, with their sources.

## What the community is converging on

- **Having the agent open and test the page is now expected for frontend work.** Heavy users are moving from browser MCP servers to a command-line tool plus a short skill. Playwright's own README calls the CLI more token-efficient for coding agents ([playwright-mcp](https://github.com/microsoft/playwright-mcp)). OpenAI's Codex drives Playwright through skills as well.
- **The token argument has mostly closed.** Claude Code now loads MCP tool definitions only when they are needed ([Claude Code MCP docs](https://code.claude.com/docs/en/mcp)). A July 2026 re-run measured Playwright MCP and Playwright CLI within about 1% of each other per step ([dev.to, 2026-07-24](https://dev.to/aswani25/playwright-cli-vs-playwright-mcp-which-should-you-use-with-claude-code-1olh)).
- **Every tool can leak browser processes.** Reports include 18 orphaned CLI daemons holding about 25 GB ([playwright-cli #460](https://github.com/microsoft/playwright-cli/issues/460)) and orphaned Chromes in Claude Code itself. The defense is configuration: headless, a throwaway profile, no fixed ports, short idle timeouts, and cleanup keyed on who owns the process.
- **For repeatable checks, the model explores once and a committed test replays the flow.** Playwright's test agents write ordinary tests that CI runs with no model in the loop. Autonomous browser agents add a second model bill and more variance, and no capability Claude Code lacks.

## Why these tools

| Job | Choice | Why |
|---|---|---|
| One screenshot | `playwright-core`'s `screenshot`, wrapped in `shot.mjs` | Launches, shoots and exits, so nothing can be orphaned. Opens `file://` paths. A pipe, not a port. |
| A session | Playwright CLI, wrapped in `cli.mjs` | Headless by default, snapshots written to a file, named sessions, an idle timeout. Its defaults needed three fixes: it runs the installed Google Chrome, writes into the repo, and idles for an hour. |
| Debugging | chrome-devtools-mcp, isolated and headless | Best for console, network and performance. Its default mode shares one profile across sessions and opens a window. |
| Logins | A test account's saved state, or Claude in Chrome with the person present | Driving the person's own browser shares their logins with the agent. |

## What was ruled out

- **Browser MCP** ([browsermcp.io](https://browsermcp.io)): unmaintained since April 2025, and it kills whatever holds its fixed port at startup.
- **Puppeteer MCP**: archived by its maintainers.
- **Tools that attach to the person's Chrome**: Chrome 136 and later ignore remote debugging on the default profile, so these need an extension or a consent toggle, and then share the person's browser process.
- **Lightweight engines such as Lightpanda**: very small memory use, but its screenshots are rendered markdown rather than the page, so it can't check a design.
- **Cloud browsers, for now**: capable and cheap at small volume, but they add an account and a secret, can't see local files, and start signed out. They are the next step if a machine's memory becomes the limit.

## Protected previews

Vercel's Protection Bypass for Automation takes an `x-vercel-protection-bypass` header, plus `x-vercel-set-bypass-cookie: true` so that links followed inside the page stay allowed through ([Vercel docs](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)). How the header reaches the page decides where the secret leaks. Playwright's context-wide extra headers send it with every request the page makes, third-party ones included, and a query parameter puts it in the URL and every log. `shot.mjs` adds it only to requests for a host listed exactly, and fetches those without following redirects, because Playwright applies a header added in a route to every redirect that request follows.
