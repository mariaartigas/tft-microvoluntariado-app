import { Injectable, computed, inject, signal } from '@angular/core';
import {Firestore, doc, setDoc, getDoc, serverTimestamp, updateDoc, docData, collection, getDocs, query, where} from '@angular/fire/firestore';
import { UserModel, UserRole, userConverter, createDefaultUser  } from '../../shared/models/user.model';
import { Observable } from 'rxjs/internal/Observable';
import { from, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })

//Gestión de usuarios
export class UserService {

  private firestore =  inject(Firestore);

//Método: obtener el usuario actual --> esto pasa por el converter por comodidad, consistencia y tipado estricto (Type Safety). si no lo hiciese entonces no devolvería un tipo USER plo que haría que se repitiese todo el rato
private getUserRef(uid: string) {
  return doc(this.firestore, 'users', uid).withConverter(userConverter);
}

//CRUD ------------------

//READ GET -> recoge el documento por id, el documento puede ser modificaod por algo por tanto es observable (no significa que se modifique el id importante)
getById$(uid: string): Observable<UserModel | undefined> {
    return docData(this.getUserRef(uid));
  }

  getByUsername$(username: string): Observable<UserModel | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('username', '==', username));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as UserModel;
      })
    );
  }

//CREATE
create(user: UserModel): Promise<void> {
    const ref = this.getUserRef(user.uid);
    return setDoc(ref, user);
  } 

//UPDATE
async update(uid: string, data: Partial<UserModel>): Promise<void> {
    const ref = this.getUserRef(uid);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

//Método: crear el documento de un usuario nuevo, flujo idempotente
ensureUserProfile$ (firebaseUser: any, selectedRole: UserRole = 'volunteer'): Observable<UserModel | null> {
  if (!firebaseUser) return of(null);

  return this.getById$(firebaseUser.uid).pipe( 
      take(1),
      switchMap(appUser => {
        if (appUser) return of(appUser); //si es usuario existe entonces out

        const newUser = createDefaultUser(firebaseUser, selectedRole);

        return from(this.create(newUser)).pipe(
          map(() => newUser)
        );
      })
    );
  }



}