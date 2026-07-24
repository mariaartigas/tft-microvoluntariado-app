import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { IonContent,IonCardContent, IonCardTitle, IonCardHeader, IonCard } from "@ionic/angular/standalone";
import { Router} from '@angular/router';
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
  imports: [CommonModule, IonContent, FooterComponent, IonCardContent, IonCardTitle, IonCardHeader, IonCard],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
 private authService = inject(AuthService); 
 private router = inject(Router);

 readonly currentUser = this.authService.currentUser;        //firebase
 userProfile = this.authService.currentUserProfile; //información

  // listado principal de elementos del feed en formato masonry traducido al español
  feedItems: FeedItem[] = [
    {
      id: 'mvp-001',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
      title: 'Traduce un artículo corto para una ONG local',
      description: 'Ayuda a difundir recursos educativos traduciendo 3 párrafos del inglés al español. ¡Solo te tomará 15 minutos!',
      bgClass: 'terracotta-card',
      sticker: 'hn hn-globe',
      stickerColor: 'sage',
      tiltClass: '',
      hasInput: true,
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    },
    {
      id: 'mvp-002',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop',
      title: 'Diseña una tarjeta de adopción rápida',
      description: 'Crea una plantilla visual sencilla para difundir animales rescatados en redes sociales y ayudarles a encontrar hogar.',
      bgClass: 'sage-card',
      sticker: 'hn hn-heart',
      stickerColor: 'gold',
      tiltClass: 'sticker-tilt-right',
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    },
    {
      id: 'mvp-003',
      title: 'Revisión ortográfica de guías comunitarias',
      description: 'Lee y valida las normas de convivencia de nuestro nuevo jardín vecinal digital para asegurar una lectura cálida y clara.',
      bgClass: 'cream-card',
      sticker: 'hn hn-check-circle',
      stickerColor: 'terracotta',
      tiltClass: 'sticker-tilt-left',
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    },
    {
      id: 'mvp-004',
      image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop',
      title: '¡Primeros pasos como microvoluntario!',
      description: 'Descubre cómo una sola acción de 5 minutos al día puede sumar un gran impacto en proyectos sociales de tu entorno.',
      bgClass: 'cream-card',
      sticker: 'hn hn-star-solid',
      stickerColor: 'sage',
      tiltClass: 'sticker-tilt-right',
      hasInput: true,
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    },
    {
      id: 'mvp-005',
      title: 'Clasificación de datos para banco de alimentos',
      description: 'Ayuda a digitalizar el inventario de productos donados desde casa en bloques de solo 10 minutos.',
      bgClass: 'terracotta-card',
      sticker: 'hn hn-box',
      stickerColor: 'gold',
      tiltClass: 'sticker-tilt-left',
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    },
    {
      id: 'mvp-006',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop',
      title: 'Comparte tu talento con una causa',
      description: '¿Tienes habilidades de redacción, diseño o traducción? Explora cómo puedes colaborar puntualmente sin comprometer tu agenda.',
      bgClass: 'sage-card',
      sticker: 'hn hn-people-carry',
      stickerColor: 'terracotta',
      tiltClass: 'sticker-tilt-right',
      inputPlaceholder: 'Noticia Placeholder ! MVP'
    }
  ];

}