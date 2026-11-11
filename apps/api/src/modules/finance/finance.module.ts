import { Module } from '@nestjs/common';
import { BillingCategoriesService } from './billing-categories.service';
import { BillingCategoriesController } from './billing-categories.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, RbacModule],
  controllers: [
    BillingCategoriesController,
    InvoicesController,
    PaymentsController,
    AccountingController,
  ],
  providers: [
    BillingCategoriesService,
    InvoicesService,
    PaymentsService,
    AccountingService,
  ],
  exports: [
    BillingCategoriesService,
    InvoicesService,
    PaymentsService,
    AccountingService,
  ],
})
export class FinanceModule {}
