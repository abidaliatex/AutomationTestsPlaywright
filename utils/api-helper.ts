import { type APIRequestContext } from '@playwright/test';

/**
 * API helper for test setup / teardown via the CrossAd REST API.
 * Extend methods here as needed during Phase 3+.
 */
export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  // Example: GET /api/customers?name=...
  async getCustomerByName(name: string): Promise<unknown> {
    const response = await this.request.get('/api/customers', {
      params: { name },
    });
    if (!response.ok()) throw new Error(`GET customers failed: ${response.status()}`);
    return response.json();
  }
}
