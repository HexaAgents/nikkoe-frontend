import { testSupabase } from "./test-client";

interface TrackedRecord {
  table: string;
  column: string;
  value: string | number;
}

export class CleanupTracker {
  private records: TrackedRecord[] = [];

  track(table: string, column: string, value: string | number) {
    this.records.push({ table, column, value });
  }

  async cleanupAll() {
    const reversed = [...this.records].reverse();
    for (const { table, column, value } of reversed) {
      try {
        await testSupabase.from(table).delete().eq(column, value);
      } catch (err) {
        console.warn(
          `Cleanup warning: failed to delete ${table}.${column}=${value}`,
          err
        );
      }
    }
    this.records = [];
  }
}

export function uid(): string {
  return `__test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function uuid(): string {
  return crypto.randomUUID();
}
