import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton, IonCardContent, IonCardTitle, IonCardHeader, IonCard } from "@ionic/angular/standalone";
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FooterComponent } from "../../shared/components/footer/footer.component";


//solo lo añadimos para visualización del MVP
interface FeedItem {
  id?: string;
  image?: string;
  title: string;
  description: string;
  bgClass: string;
  sticker: string;
  stickerColor: string;
  tiltClass: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
}



@Component({
  selector: 'app-home',
  standalone : true, 
  imports: [CommonModule, SideMenuComponent, IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton, RouterLink, HeaderComponent, FooterComponent, IonCardContent, IonCardTitle, IonCardHeader, IonCard],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
 private authService = inject(AuthService); 
 private router = inject(Router);

 readonly currentUser = this.authService.currentUser;        //firebase
 userProfile = this.authService.currentUserProfile; //información

  // listado principal de elementos del feed en formato masonry traducido al espanol
  feedItems: FeedItem[] = [
    {
      id: 'news-001',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
      title: 'Actualización de la plataforma v2.0 disponible',
      description: 'Experimenta el nuevo panel interactivo con animaciones fluidas y diseños orgánicos.',
      bgClass: 'terracotta-card',
      sticker: 'hn hn-bookmark',
      stickerColor: 'sage',
      tiltClass: 'sticker-tilt-left',
      hasInput: true,
      inputPlaceholder: 'Leer registro de cambios completo'
    },
    {
      id: 'news-002',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop',
      title: 'Enfoque: Equipo de UI/UX y Sistemas de Diseño',
      description: 'El equipo de diseño publicó un artículo detallado sobre cómo crear paletas de colores orgánicas y accesibles que evocan calidez y comodidad para los flujos de trabajo digitales cotidianos.',
      bgClass: 'sage-card',
      sticker: 'hn hn-star-solid',
      stickerColor: 'gold',
      tiltClass: 'sticker-tilt-right'
    },
    {
      id: 'news-003',
      title: 'Protocolos de seguridad',
      description: 'La autenticación de dos factores (2FA) será obligatoria para todas las cuentas administrativas a partir de esta semana para proteger los datos de los usuarios.',
      bgClass: 'cream-card',
      sticker: 'hn hn-calendar-alt',
      stickerColor: 'terracotta',
      tiltClass: 'sticker-tilt-left'
    },
    {
      id: 'news-004',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop',
      title: 'Ganadores del hackatón mensual',
      description: '¡Felicitaciones al Equipo Alfa por construir una herramienta comunitaria increíble durante nuestro evento de sprint de 48 horas!',
      bgClass: 'cream-card',
      sticker: 'hn hn-trophy-solid',
      stickerColor: 'sage',
      tiltClass: 'sticker-tilt-right',
      hasInput: true,
      inputPlaceholder: 'Ver repositorio'
    },
    {
      id: 'news-005',
      title: 'Optimiza tu flujo de trabajo',
      description: 'Descubre nuestras 5 principales herramientas integradas diseñadas para automatizar tareas administrativas repetitivas.',
      bgClass: 'terracotta-card',
      sticker: 'hn hn-graduation-cap',
      stickerColor: 'gold',
      tiltClass: 'sticker-tilt-left'
    },
    {
      id: 'news-006',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop',
      title: 'Puntos clave de la sesión de preguntas y respuestas',
      description: '¿Te perdiste la sesión de AMA del viernes? Hemos recopilado las preguntas más frecuentes sobre nuestras próximas funciones y la expansión de la hoja de ruta.',
      bgClass: 'sage-card',
      sticker: 'hn hn-analytics',
      stickerColor: 'terracotta',
      tiltClass: 'sticker-tilt-right'
    }
  ];

  goToNews(item: FeedItem) {
    this.router.navigate(['/newsfeed'], { queryParams: { id: item.id } });
  }

}