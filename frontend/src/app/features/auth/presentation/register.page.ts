import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/auth/application/session.store';
import { errorMessage } from '../../../core/http/error-message';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'bb-register-page',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-layout.scss',
  template: `
    <mat-card appearance="outlined" class="card">
      <mat-card-content>
        <div class="brand"><mat-icon>account_balance</mat-icon> Bytebank</div>
        <h1 class="mat-headline-small">Abra sua conta</h1>
        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <mat-form-field>
            <mat-label>Nome completo</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
            <mat-error>Informe seu nome.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Usuário</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
            <mat-error>Use de 3 a 50 caracteres: letras, números, ponto, hífen ou _.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>E-mail</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-error>Informe um e-mail válido.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Senha</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            <mat-error>Mínimo de 6 caracteres.</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Confirme a senha</mat-label>
            <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
          </mat-form-field>
          @if (form.hasError('mismatch') && form.controls.confirm.touched) {
            <p class="alert">As senhas não conferem.</p>
          }
          <button mat-flat-button type="submit" [disabled]="loading()">{{ loading() ? 'Criando conta…' : 'Criar conta' }}</button>
        </form>
        <p class="footer">Já tem conta? <a routerLink="/login">Entrar</a></p>
      </mat-card-content>
    </mat-card>
  `,
})
export class RegisterPage {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.pattern(/^[\w.-]{3,50}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected async submit(): Promise<void> {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    this.error.set(null);
    const { name, username, email, password } = this.form.getRawValue();
    try {
      await this.session.register({ name: name.trim(), username: username.trim(), email: email.trim(), password });
      await this.router.navigateByUrl('/inicio');
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
