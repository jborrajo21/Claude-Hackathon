import { spawn } from "child_process";
import path from "path";

export async function POST() {
  // Paths are constructed at runtime from env vars to prevent Turbopack
  // from statically tracing into the scraper virtualenv symlinks.
  const scraperDir =
    process.env.SCRAPER_DIR ??
    path.resolve(process.cwd(), "..", "scraper");

  const venvSegments = [scraperDir, ".venv", "bin", "python"];
  const venvPython = path.join(...(venvSegments as [string, ...string[]]));

  return new Promise<Response>((resolve) => {
    const proc = spawn(
      venvPython,
      ["-m", "scraper.main", "scrape", "--max-pages", "3"],
      {
        cwd: scraperDir,
        env: { ...process.env, PATH: process.env.PATH ?? "" },
        detached: true, // run in background, don't block
        stdio: "ignore",
      }
    );

    proc.unref(); // let it run independently

    // Respond immediately — scraping happens in background
    resolve(Response.json({ started: true, pid: proc.pid }));
  });
}
