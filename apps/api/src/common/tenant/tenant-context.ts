import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId?: string;
  tenantSlug?: string;
  isSuperAdmin?: boolean;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

export class TenantContext {
  static run<T>(store: TenantStore, callback: () => T): T {
    return asyncLocalStorage.run(store, callback);
  }

  static getTenantId(): string | undefined {
    const store = asyncLocalStorage.getStore();
    return store?.tenantId;
  }

  static getTenantSlug(): string | undefined {
    const store = asyncLocalStorage.getStore();
    return store?.tenantSlug;
  }

  static isSuperAdmin(): boolean {
    const store = asyncLocalStorage.getStore();
    return store?.isSuperAdmin ?? false;
  }
}
