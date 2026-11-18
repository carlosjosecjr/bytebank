import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bb-coming-soon-page',
  imports: [MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" class="card">
      <mat-card-content class="content">
        <mat-icon class="icon">construction</mat-icon>
        <h2>{{ section() }}</h2>
        <p>Em breve por aqui.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .content { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; text-align: center; }
    .icon { font-size: 48px; width: 48px; height: 48px; color: var(--bb-petrol); }
    h2 { font: var(--mat-sys-headline-small); margin: 16px 0 4px; }
  `,
})
export class ComingSoonPage {
  /** Vem de `data.section` da rota (withComponentInputBinding). */
  readonly section = input('Em breve');
}
