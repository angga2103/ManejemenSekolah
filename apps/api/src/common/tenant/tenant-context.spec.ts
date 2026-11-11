import { TenantContext } from './tenant-context';

describe('TenantContext', () => {
  it('should isolate tenant context between asynchronous executions', async () => {
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    let capturedA: string | undefined;
    let capturedB: string | undefined;

    await Promise.all([
      TenantContext.run({ tenantId: tenantA }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        capturedA = TenantContext.getTenantId();
      }),
      TenantContext.run({ tenantId: tenantB }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        capturedB = TenantContext.getTenantId();
      }),
    ]);

    expect(capturedA).toBe(tenantA);
    expect(capturedB).toBe(tenantB);
  });
});
