import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {Firestore, doc, setDoc, getDoc, serverTimestamp, updateDoc, docData, collection, getDocs, query, where, collectionData, increment, deleteDoc} from '@angular/fire/firestore';
import { UserModel, UserRole, userConverter, createDefaultUser  } from '../../shared/models/user.model';
import { Observable } from 'rxjs/internal/Observable';
import { from, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })

//Gestión de usuarios
export class UserService {

  private firestore =  inject(Firestore);
  private injector = inject(Injector);

private getUserRef(uid: string) {
  return doc(this.firestore, 'users', uid).withConverter(userConverter);
}

//CRUD ------------------

//READ GET
getById$(uid: string): Observable<UserModel | undefined> {
    return runInInjectionContext(this.injector, () => {
      return docData(this.getUserRef(uid));
      });
  }

getByUsername$(username: string): Observable<UserModel | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('username', '==', username));

    return runInInjectionContext(this.injector, () => { 
      return collectionData(q, { idField: 'uid' }).pipe(
      map(users => {
      if (!users || users.length === 0) return null;
        return users[0] as UserModel;
      })
    );});
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

//DELETE -------------
  
  async delete(uid: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await deleteDoc(userRef);
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


//Métodos de cosas aparte de USERS -------------

async recordAbandonedTask(volunteerId: string): Promise<void> {
  await this.update(volunteerId, {
    'statistics.tasksAbandoned': increment(1)
  } as any);

  // recalcular fiabilidad
  await this.recalculateReliability(volunteerId);
}

async recordCompletedTask(volunteerId: string): Promise<void> {
 
    try {
      // Actualizamos estadísticas, XP y la Reputación que faltaba
      await this.update(volunteerId, {
        'statistics.tasksCompleted': increment(1),
        xp: increment(100), //100 xp
        reputation: increment(10), //10 puntos por tarea
        isVisible: true
      }as any);

      // Recalculamos la fiabilidad
      await this.recalculateReliability(volunteerId);

    } catch (error) {
      console.error('Error crítico en recordCompletedTask:', error);
    }
  }

//calcular reliability ! 

private async recalculateReliability(volunteerId: string): Promise<void> {
 const snap = await getDoc(this.getUserRef(volunteerId));
    if (!snap.exists()) return;

    const user = snap.data();
    const stats = user.statistics || { tasksCompleted: 0, tasksAbandoned: 0, tasksExpired: 0 };

    const completed = stats.tasksCompleted || 0;
    const abandoned = stats.tasksAbandoned || 0;

    // Fórmula del Algoritmo  de Fiabilidad -> comentado la caducidad ya que no está implementada
    const totalWeighted = completed + (abandoned * 1.5) //+ (expired * 2.0);
    
    let reliability = 100;
    if (totalWeighted > 0) {
      reliability = Math.round((completed / totalWeighted) * 100);
    }

    await this.update(volunteerId, { reliability });
  }


}