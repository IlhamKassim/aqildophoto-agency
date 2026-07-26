import type Database from "better-sqlite3";
import type { ConvocationLeadRegistry } from "./convocation-lead-registry";
import type { ScraperSource } from "./scraper-source";

export type SourceRunOutcome = "ok" | "failed";

export interface SourceRunStatus {
  sourceId: string;
  sourceName: string;
  status: SourceRunOutcome;
  reason?: string;
  ranAt: Date;
}

interface SourceRunRow {
  source_id: string;
  source_name: string;
  status: SourceRunOutcome;
  reason: string | null;
  ran_at: string;
}

function toSourceRunStatus(row: SourceRunRow): SourceRunStatus {
  return {
    sourceId: row.source_id,
    sourceName: row.source_name,
    status: row.status,
    reason: row.reason ?? undefined,
    ranAt: new Date(row.ran_at),
  };
}

/**
 * Runs every registered ScraperSource and feeds successful results into
 * ConvocationLeadRegistry. One source's failure — thrown synchronously or
 * rejected — never stops the others, and is recorded rather than swallowed.
 */
export class ConvocationLeadScraperRunner {
  constructor(
    private readonly db: Database.Database,
    private readonly registry: ConvocationLeadRegistry,
  ) {}

  async runAll(sources: ScraperSource[], now: Date = new Date()): Promise<void> {
    for (const source of sources) {
      try {
        const candidates = await source.fetchCandidates();
        for (const candidate of candidates) {
          this.registry.addLead(candidate);
        }
        this.recordStatus(source, "ok", undefined, now);
      } catch (error) {
        this.recordStatus(
          source,
          "failed",
          error instanceof Error ? error.message : String(error),
          now,
        );
      }
    }
  }

  private recordStatus(
    source: ScraperSource,
    status: SourceRunOutcome,
    reason: string | undefined,
    ranAt: Date,
  ): void {
    this.db
      .prepare(
        `INSERT INTO scraper_source_runs (source_id, source_name, status, reason, ran_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(source_id) DO UPDATE SET
           source_name = excluded.source_name,
           status = excluded.status,
           reason = excluded.reason,
           ran_at = excluded.ran_at`,
      )
      .run(source.id, source.name, status, reason ?? null, ranAt.toISOString());
  }

  getSourceRunStatuses(): SourceRunStatus[] {
    const rows = this.db
      .prepare("SELECT source_id, source_name, status, reason, ran_at FROM scraper_source_runs")
      .all() as SourceRunRow[];
    return rows.map(toSourceRunStatus);
  }
}
