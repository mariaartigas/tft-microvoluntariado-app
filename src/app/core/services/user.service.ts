import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithPopup, signOut, User, EmailAuthCredential } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { UserModel } from '../../shared/models/user.model';
import { firebaseUserToUserModel } from '../../shared/converters/user.converter';

@Injectable({ providedIn: 'root' })

//Gestión de usuarios
export class UserService {

  private firestore =  inject(Firestore);

//Método: obtener el usuario actual
  private getUserRef(uid: string) {
  return doc(this.firestore, 'users', uid);
}

//Método: crear el documento de un usuario nuevo
  async ensureUserProfile(firebaseUser: User) {
    const userModel =  firebaseUserToUserModel(firebaseUser); //llamamos al converter para la creación del modelo incial
    const userRef = this.getUserRef(firebaseUser.uid)

    const userSnap = await getDoc(userRef);
      
  if (!userSnap.exists()) { //revisión de existencia del usuario
      
      await setDoc(
        userRef,
        userModel
      );

    }
    console.log('createUser terminado');
  } 

  //actualizar datos del user
  async updateUser(uid: string, data: Partial<UserModel>) {
    const userRef = this.getUserRef(uid)
    
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
  }