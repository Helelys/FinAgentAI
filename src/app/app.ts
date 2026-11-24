import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { InvoiceDetailModalComponent } from './components/invoice-detail-modal/invoice-detail-modal.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoiceUploadComponent } from './components/invoice-upload/invoice-upload.component';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { AiAdvisorComponent } from './components/ai-advisor/ai-advisor.component';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    ConfirmDialogComponent,
    InvoiceDetailModalComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    InvoiceUploadComponent,
    InvoiceListComponent,
    AiAdvisorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly uiService = inject(UiService);
}
