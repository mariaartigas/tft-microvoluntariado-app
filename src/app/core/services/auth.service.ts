import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup, signOut, User, EmailAuthCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { firstValueFrom, of, switchMap, tap } from 'rxjs';
import { UserModel,UserRole } from '../../shared/models/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  //private firestore =  inject(Firestore); ya no se usa
  private userService = inject(UserService);

  currentUser = signal<User | null>(null);
  currentUserProfile = signal<UserModel | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null); //comprobación

  /*constructor() { --> antiguo constuctor
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      this.currentUser.set(firebaseUser);

    if (firebaseUser) {
      try {
        const profile = await firstValueFrom(this.userService.ensureUserProfile$(firebaseUser));
        this.currentUserProfile.set(profile);
      } catch (error) {
        console.error('Error:', error);
        this.currentUserProfile.set(null); 
      }
    } else {
      this.currentUserProfile.set(null);
      }
   });
  }

  user$ = authState(this.auth);*/

 constructor() {
  authState(this.auth).pipe(
    takeUntilDestroyed()
  ).subscribe((firebaseUser) => {
    this.currentUser.set(firebaseUser);
      if (firebaseUser) {
        this.loadUserProfile(firebaseUser);
      } else {
        this.currentUserProfile.set(null);
      }
  });
}

  //carga de información independiente del flujo
  private async loadUserProfile(firebaseUser: User) {
  try {
    const profile = await firstValueFrom(this.userService.ensureUserProfile$(firebaseUser));
    this.currentUserProfile.set(profile);
  } catch (error) {
    console.warn('Error en carga de perfil:', error);
    this.currentUserProfile.set(null); // solo por asegurar
  }
}

  //login
  async loginWithGoogle() { //sin tipo de rol? es lo ideal si no existe?
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);

      await firstValueFrom(this.userService.ensureUserProfile$(result.user, ));

      await this.router.navigate(['/home']);
      return result.user;
    } catch (e) {
      console.error('Error en login:', e);
      throw e;
    }
  } 

  //Métodos de registro de usuarios

  async registerOrganizationWithGoogle() { 
    try {
      const provider = new GoogleAuthProvider();    
      const result = await signInWithPopup(this.auth, provider);

      await firstValueFrom(this.userService.ensureUserProfile$(result.user, 'organization'));

      await this.router.navigate(['/home']);
      return result.user;
    } catch (e) {
     console.error('Error en el registro:', e);
      throw e;
    }
  } 
 

  async register (email: string, password: string, role: UserRole) {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.userService.ensureUserProfile$(credential.user);
      return credential.user;
    } catch (e) {
      console.error('Error en el registro:', e);
      throw e;
    }
  }

  //cierre de sesión
  async logout() {
    const result = await signOut(this.auth).then(() => this.router.navigate(['/login']));
  }


}