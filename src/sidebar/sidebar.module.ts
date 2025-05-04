import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';

import { SidebarComponent } from './sidebar.component'; // Ensure this path is correct and the component exists

@NgModule({
  declarations: [SidebarComponent],

  imports: [CommonModule, FontAwesomeModule, RouterModule],
  exports: [SidebarComponent]
})
export class SidebarModule {}
