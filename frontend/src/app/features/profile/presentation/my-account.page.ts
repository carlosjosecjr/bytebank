import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionStore } from '../../../core/auth/application/session.store';
import { ProfileStore } from '../application/profile.store';
import { ProfileChanges } from '../domain/profile.repository';

@Component({
  selector: 'bb-my-account-page',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" class="card">
      <mat-card-header><mat-card-title>Minha conta</mat-card-title></mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" class="form">
          <mat-form-field>
            <mat-label>Nome</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
            <mat-icon matSuffix>edit</mat-icon>
            <mat-error>Informe seu nome.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matSuffix>edit</mat-icon>
            <mat-error>Informe um e-mail válido.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Nova senha</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            <mat-hint>Deixe em branco para manter a senha atual.</mat-hint>
            <mat-error>A senha deve ter pelo menos 6 caracteres.</mat-error>
          </mat-form-field>
          <button mat-flat-button class="save" type="submit" [disabled]="store.saving() || form.pristine">
            {{ store.saving() ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .card { max-width: 720px; }
    .form { display: flex; flex-direction: column; max-width: 400px; padding-top: 16px; gap: 4px; }
    .save { align-self: flex-start; margin-top: 12px; background: var(--bb-orange); color: #fff; }
  `,
})
export class MyAccountPage {
  private readonly session = inject(SessionStore);
  protected readonly store = inject(ProfileStore);
  private readonly snack = inject(MatSnackBar);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
  });

  constructor() {
    // Preenche com o usuário da sessão (e repreenche se ele mudar), sem sobrescrever edição em curso.
    effect(() => {
      const user = this.session.user();
      if (user && this.form.pristine) this.form.reset({ name: user.name, email: user.email, password: '' });
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { name, email, password } = this.form.getRawValue();
    const changes: ProfileChanges = { name: name.trim(), email: email.trim(), ...(password ? { password } : {}) };
    const ok = await this.store.save(changes);
    if (ok) this.form.markAsPristine();
    this.snack.open(ok ? 'Dados atualizados.' : (this.store.error() ?? 'Erro ao salvar.'), 'OK', { duration: 4000 });
  }
}
