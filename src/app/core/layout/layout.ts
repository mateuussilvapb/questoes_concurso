//Angular
import { Component } from '@angular/core';

//Aplicação
import { Menu } from '../components/menu/menu';

@Component({
  selector: 'app-layout',
  imports: [
    //Aplicação
    Menu,
  ],
  templateUrl: './layout.html',
})
export class Layout {}
