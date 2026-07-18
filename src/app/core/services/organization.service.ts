import { Injectable, computed, inject, signal } from '@angular/core';
import {Firestore, doc, setDoc, getDoc, serverTimestamp, updateDoc, docData, collection} from '@angular/fire/firestore';
import { UserModel, UserRole, userConverter, createDefaultUser  } from '../../shared/models/user.model';
import { OrganizationModel, OrganizationMember, organizationConverter, createDefaultOrganization  } from '../../shared/models/organization.model';
import { Observable } from 'rxjs/internal/Observable';
import { from, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })

//Gestión de organización
export class OrganizationService {

  private firestore =  inject(Firestore);

  getDocRef(orgId: string) {
    return doc(this.firestore, 'organizations', orgId).withConverter(organizationConverter);
  }

  //generación igual que en los users
  create(org: OrganizationModel): Promise<void> {
    const ref = this.getDocRef(org.uid);
    return setDoc(ref, org);
  }

  //generación de i dúnico, porque el id de usuario lo autogenera firebase ...
  generateNewId(): string {
    return doc(collection(this.firestore, 'organizations')).id;
  }

  //falta el update y el read? o no hace falta el read?


  //no es un proceso implícito o repetitivo, no se puede automatizar y requiere datos del usuario
//se ha planteado hacer de esta otra manera --------------
/*
create$(name: string, owner: { uid: string; displayName: string; photoURL: string | null; email: string }): Observable<string> {
    const orgCollection = collection(this.firestore, 'organizations');
    const orgId = doc(orgCollection).id; // Generamos el ID en el cliente

    const newOrg = createDefaultOrganization(orgId, name, owner);
    const orgRef = doc(this.firestore, 'organizations', orgId).withConverter(organizationConverter);

    // Guardamos en Firestore y retornamos el ID al terminar
    return from(setDoc(orgRef, newOrg)).pipe(
      map(() => orgId)
    );
  }
}*/

/*//Método: obtener la organización actual --> esto pasa por el converter por comodidad, consistencia y tipado estricto (Type Safety). si no lo hiciese entonces no devolvería un tipo USER plo que haría que se repitiese todo el rato
  private getDocRef(uid: string) {
  return doc(this.firestore, 'users', uid).withConverter(organizationConverter);
}

//CRUD ------------------

//READ GET -> recoge el documento por id, el documento puede ser modificaod por algo por tanto es observable (no significa que se modifique el id importante)
getById$(uid: string): Observable<OrganizationModel | undefined> {
    return docData(this.getDocRef(uid));
  }

//CREATE
create(org: OrganizationModel): Promise<void> {
    const ref = this.getDocRef(org.uid);
    return setDoc(ref, org);
  } 

//UPDATE
async update(uid: string, data: Partial<OrganizationModel>): Promise<void> {
    const ref = this.getDocRef(uid);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp() // Metadata de control técnico ?
    });
  }
//CAMBIOS DE AQUÍ ARRIBA !!!!!!

//Método: crear el documento de una org nueva - cambios con respecto a un usuario normal, esta parte es important -> queremos crear solo lo del org o tamb el usuario? debemos modificar esto! 
ensureUserProfile$ (firebaseUser: any, selectedRole: UserRole = 'volunteer'): Observable<OrganizationModel | null> {
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



}*/
}