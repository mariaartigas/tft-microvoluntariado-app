import { Injectable, computed, inject, signal } from '@angular/core';
import {Firestore, doc, setDoc, getDoc, serverTimestamp, updateDoc, docData, collection, getDocs, query, where} from '@angular/fire/firestore';
import { UserModel, UserRole, userConverter, createDefaultUser  } from '../../shared/models/user.model';
import { OrganizationModel, OrganizationMember, organizationConverter, createDefaultOrganization, generateSlug  } from '../../shared/models/organization.model';
import { Observable } from 'rxjs/internal/Observable';
import { firstValueFrom, from, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })

//Gestión de organización
export class OrganizationService {

  private firestore =  inject(Firestore);
  
  private getDocRef(orgId: string) {
    return doc(this.firestore, 'organizations', orgId).withConverter(organizationConverter);
  }

  //obtener, búsqueda en las organizaciones
  private get getOrgs() { //solo cuesta una lectura we are ok
    return collection(this.firestore, 'organizations').withConverter(organizationConverter);
  }

  //CRUD ------------------

  //generación igual que en los users
  create(org: OrganizationModel): Promise<void> {
    const ref = this.getDocRef(org.uid);
    return setDoc(ref, org);
  }

  //generación de i dúnico, porque el id de usuario lo autogenera firebase ...
  generateNewId(): string {
    return doc(collection(this.firestore, 'organizations')).id;
  }
//rebusca en las organizaciones
  async getBySlug(slug: string): Promise<OrganizationModel | null> {
    try {
      const q = query(this.getOrgs, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);  
      
      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data();

    } catch (error) {
      console.error('Error en el getBySlug', error);
      return null; 
    }
  }

//ENSURE organización -> crea la organización ligada de entrada ya con el USUARIO CREADOR
  async ensureOrganization(orgName: string,  contactEmail: string, owner: { uid: string; displayName: string; email: string } ): Promise<OrganizationModel> {
    try {
    //generar slug 
      const slug = generateSlug(orgName);
    
      //verificación rápida
      const existingOrg = await this.getBySlug(slug); 
      
      if (existingOrg) {
        return existingOrg;
      }
      
      const newOrgId = this.generateNewId();
      const newOrg = createDefaultOrganization(newOrgId, orgName, owner); 
    
      await this.create(newOrg);
      
      return newOrg;
    } catch (e) {
      console.error('Error al crear la organización:', e);
      throw e;
    }
  }

}