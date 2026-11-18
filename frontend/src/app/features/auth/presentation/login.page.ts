import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/auth/application/session.store';
import { errorMessage } from '../../../core/http/error-message';
import { safeReturnUrl } from './safe-return-url';

@Component({
  selector: 'bb-login-page',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-layout.scss',
  template: `
    <mat-card appearance="outlined" class="card">
      <mat-card-content>
        <div class="brand"><mat-icon>account_balance</mat-icon> Bytebank</div>
        <h1 class="mat-headline-small">Entrar</h1>
        @if (expired()) { <p class="info">Sua sessão expirou. Entre novamente.</p> }
        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field>
            <mat-label>E-mail ou usuário</mat-label>
            <input matInput formControlName="identifier" autocomplete="username" />
            <mat-error>Informe seu e-mail ou usuário.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Senha</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error>Informe sua senha.</mat-error>
          </mat-form-field>
          <button mat-flat-button type="submit" [disabled]="loading()">{{ loading() ? 'Entrando…' : 'Entrar' }}</button>
        </form>
        <p class="footer">Não tem conta? <a routerLink="/cadastro">Abra a sua</a></p>
      </mat-card-content>
    </mat-card>
  `,
})
export class LoginPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  /** Query params ligados por withComponentInputBinding. */
  readonly returnUrl = input<string>();
  readonly expired = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.session.login(this.form.getRawValue());
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (error) {
      this.error.set(errorMessage(error));
      this.form.controls.password.reset();
    } finally {
      this.loading.set(false);
    }
  }
}
