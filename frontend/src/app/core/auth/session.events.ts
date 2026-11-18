import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Canal entre o interceptor HTTP e o SessionStore (evita dependência circular de DI). */
@Injectable({ providedIn: 'root' })
export class SessionEvents {
  readonly unauthorized$ = new Subject<void>();
}
