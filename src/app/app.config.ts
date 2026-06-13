import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyBP0a4dzn9NPGr_C0HZ5O5EUuGpWX-SKv0",
  authDomain: "project01-20e5e.firebaseapp.com",
  projectId: "project01-20e5e",
  storageBucket: "project01-20e5e.firebasestorage.app",
  messagingSenderId: "80433609246",
  appId: "1:80433609246:web:ffba6cf8c41f26d1eecc0f"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({}),
    provideRouter(routes),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};