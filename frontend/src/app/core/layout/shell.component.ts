import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { SessionStore } from '../auth/application/session.store';
import { PrefetchDirective } from '../routing/prefetch.directive';
import { NAV_ITEMS } from './nav-items';

type Layout = 'mobile' | 'tablet' | 'desktop';

@Component({
  selector: 'bb-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, PrefetchDirective,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatSidenavModule, MatListModule, MatTabsModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly session = inject(SessionStore);
  protected readonly nav = NAV_ITEMS;

  /** Desktop: menu lateral; tablet: abas no topo; mobile: menu hambúrguer (drawer). */
  protected readonly layout = toSignal(
    inject(BreakpointObserver)
      .observe(['(min-width: 1024px)', '(min-width: 600px)'])
      .pipe(
        map(({ breakpoints }): Layout =>
          breakpoints['(min-width: 1024px)'] ? 'desktop' : breakpoints['(min-width: 600px)'] ? 'tablet' : 'mobile',
        ),
      ),
    { initialValue: 'desktop' as Layout },
  );
  protected readonly isMobile = computed(() => this.layout() === 'mobile');

  protected logout(): void {
    void this.session.logout();
  }
}
