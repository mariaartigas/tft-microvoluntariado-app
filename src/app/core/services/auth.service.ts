import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup, signOut, User, EmailAuthCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  //private firestore =  inject(Firestore); ya no se usa
  private userService = inject(UserService);

  currentUser = signal<User | null>(null);
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
    });}

  user$ = authState(this.auth);

  isAuthenticated = computed(() =>
    this.currentUser() !== null
  );

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

   // const result = await signInWithPopup(this.auth, provider)
    //.then(() => this.router.navigate(['/dashboard']));

    const result = await signInWithPopup(this.auth, provider);

    await this.userService.ensureUserProfile(
      result.user
    );

    //await this.userService.createUser(user);

    console.log('Antes de navegar');

    try {
      const tSC = await this.router.navigate(['/home']);
      console.log('Resultado:', tSC);
    } catch (e) {
      console.error('Error navegando:', e);
    }
    return result.user;
    console.log('Después de navegar');
  } 

  async register (email: string, password: string) {
     const credential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
    );

    await this.userService.ensureUserProfile(
        credential.user
    );

    return credential.user;
  }




  async logout() {
    const result = await signOut(this.auth)
    .then(() => this.router.navigate(['/login']));

  }
}