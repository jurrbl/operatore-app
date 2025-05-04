import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataStorageService } from '../../shared/data-storage.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ResetPassword.component.html',
  styleUrls: ['./ResetPassword.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  token!: string;
  email!: string;
  ciao!:string;
  messaggio = '';
  errore = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dataStorage: DataStorageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || ''; // 👈 email da URL

    this.resetForm = this.fb.group({
      nuovaPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.loading = true;

    this.dataStorage.inviaRichiesta('post', '/auth/reset-password', {
      token: this.token,
      nuovaPassword: this.resetForm.value.nuovaPassword,
      email: this.email // 👈 invia anche l'email!
    })?.subscribe({
      next: () => {
        this.messaggio = '✅ Password aggiornata con successo!';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.errore = err.error?.message || 'Errore durante il reset.';
        this.loading = false;
      }
    });
  }
}
