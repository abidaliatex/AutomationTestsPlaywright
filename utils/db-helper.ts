import { env } from '../config/env';

/**
 * DB helper — stub for Phase 3.
 * Ported from Selenium's JDBCConnection.java.
 * Add 'oracledb' npm package and implement when DB assertions are needed.
 *
 * Usage example (Phase 3+):
 *   const db = new DbHelper();
 *   await db.connect();
 *   const result = await db.query('SELECT COUNT(*) FROM ORDERS WHERE ...');
 *   await db.disconnect();
 */
export class DbHelper {
  private connected = false;

  async connect(): Promise<void> {
    // TODO Phase 3: implement with oracledb
    // const oracledb = await import('oracledb');
    // this.connection = await oracledb.getConnection({ ... });
    console.warn('[DbHelper] connect() — stub, not yet implemented');
    this.connected = true;
  }

  async query(sql: string): Promise<unknown[]> {
    if (!this.connected) throw new Error('DbHelper: call connect() first');
    console.warn(`[DbHelper] query('${sql}') — stub, returning []`);
    return [];
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  getConfig() {
    return {
      host: env.db.host,
      username: env.db.username,
    };
  }
}
