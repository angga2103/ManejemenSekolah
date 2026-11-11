import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string | undefined;
    let tenantSlug: string | undefined;

    // Check host subdomain (e.g., madrasah-alhikmah.edusaas.id)
    const host = req.headers.host || '';
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'api' && parts[0] !== 'www') {
      tenantSlug = parts[0];
    }

    TenantContext.run(
      {
        tenantId,
        tenantSlug,
        isSuperAdmin: req.headers['x-super-admin'] === 'true',
      },
      () => {
        next();
      },
    );
  }
}
