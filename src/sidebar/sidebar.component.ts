import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Input() mobileOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  open = false;
  animate = true;
  isDropdownOpen = false;

  username: string = '';
  profilePicture: string = '';
  role: string = '';

  constructor(private authService: AuthService, private router: Router) {}
  ngOnInit(): void {
    const user = this.authService.getUser();

    if (!user) return; // 👈 Evita crash se l'utente è null

    this.username = user.username || user.googleUsername || '';
    this.profilePicture = user.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    this.role = user.role || '';
  }


  setOpen(value: boolean) {
    this.open = value;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logout completato');
        this.router.navigate(['/login']); // ti manda su login pulito
      },
      error: (err) => {
        console.error('❌ Errore durante il logout:', err);
      }
    });
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileSidebar() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeSidebar() {
    this.mobileOpen = false;
    this.close.emit();
  }
}
