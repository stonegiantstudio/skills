// True when this module is the script node was asked to run. Compared through
// realpath, so it also holds when the script is reached through a symlink such
// as a plugin's or a project's skills folder, or the --link copy's "current".
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function isMain(moduleUrl) {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(moduleUrl)); }
  catch { return false; }
}
