import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private openSubject = new BehaviorSubject<boolean>(false);
  private animateSubject = new BehaviorSubject<boolean>(true);

  open$ = this.openSubject.asObservable();
  animate$ = this.animateSubject.asObservable();

  toggle() {
    this.openSubject.next(!this.openSubject.value);
  }

  setOpen(value: boolean) {
    this.openSubject.next(value);
  }

  setAnimate(value: boolean) {
    this.animateSubject.next(value);
  }
}
