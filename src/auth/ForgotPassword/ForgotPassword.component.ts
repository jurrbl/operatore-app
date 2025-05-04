import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ForgotPassword.component.html',
  styleUrls: ['./ForgotPassword.component.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  messaggio: string = '';
  errore: string = '';
  loading = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.messaggio = '';
    this.errore = '';

    this.http.post('https://backend-rilievi.onrender.com/api/auth/forgot-password', this.forgotForm.value)
      .subscribe({
        next: () => {
          this.messaggio = 'Controlla la tua email per il link di recupero!';
          this.loading = false;
        },
        error: (err) => {
          this.errore = err.error?.message || 'Errore durante l\'invio';
          this.loading = false;
        }
      });
  }
}
