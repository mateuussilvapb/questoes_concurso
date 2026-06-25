//Angular
import { Component } from '@angular/core';

//Aplicação
import { Sidebar } from '../components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [
    //Aplicação
    Sidebar,
  ],
  templateUrl: './layout.html',
})
export class Layout {}
