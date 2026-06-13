import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { Router } from '@angular/router';
import { async } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore =  inject(Firestore);

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
  try {

    const result = await signInWithPopup(this.auth, provider);

    const user = result.user;

    /*console.log(result.user);
    console.log(result.user.uid);
    console.log(result.user.email);
    console.log(result.user.photoURL);*/
    console.log('USER_starting SET DOC:', user);
     await setDoc(
    doc(this.firestore, 'users', user.uid),
    {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date().toISOString()
    },
    { merge: true }
    
  );


    await this.router.navigate(['/dashboard']);
  } catch (error) {
    console.error(error);
  }
}

  async logout() {
    const result = await signOut(this.auth)
    .then(() => this.router.navigate(['/login']));

  }
}