import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup, signOut, User, EmailAuthCredential, deleteUser, reauthenticateWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { firstValueFrom } from 'rxjs';
import { UserModel,UserRole } from '../../shared/models/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  
  private userService = inject(UserService);
  currentUser = signal<User | null>(null);
  currentUserProfile = signal<UserModel | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null); //comprobación

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

      const userProfile = await firstValueFrom(this.userService.ensureUserProfile$(result.user, ));
      
      return userProfile;
      
    } catch (e) {
      console.error('Error en login:', e);
      throw e;
    }
  }

  async reauthenticateWithGoogle(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(user, provider);
  }

  //Métodos de registro de usuarios
 
  async register (email: string, password: string, role: UserRole) {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      await firstValueFrom(this.userService.ensureUserProfile$(credential.user, role));

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

  //delete
  async deleteAuthAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await deleteUser(user);
    }
  }

}