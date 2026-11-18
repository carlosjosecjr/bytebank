import { Routes } from '@angular/router';

export const loginRoute = {
  path: 'login',
  title: 'Entrar | Bytebank',
  loadComponent: () => import('./presentation/login.page').then((m) => m.LoginPage),
};

export const registerRoute = {
  path: 'cadastro',
  title: 'Abra sua conta | Bytebank',
  loadComponent: () => import('./presentation/register.page').then((m) => m.RegisterPage),
};

export default [loginRoute, registerRoute] satisfies Routes;
