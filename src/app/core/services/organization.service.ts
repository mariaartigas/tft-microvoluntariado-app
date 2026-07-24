import { Injectable, Injector, inject, runInInjectionContext} from '@angular/core';
import {Firestore, doc, setDoc, getDoc, serverTimestamp, updateDoc, collection, getDocs, query, where, collectionData, arrayUnion, deleteDoc, arrayRemove, increment} from '@angular/fire/firestore';
import { OrganizationModel, organizationConverter, createDefaultOrganization, generateSlug  } from '../../shared/models/organization.model';
import { Observable } from 'rxjs/internal/Observable';
import { async, map } from 'rxjs';
import { TaskSummary } from '../../shared/models/task.model';

@Injectable({ providedIn: 'root' })

//Gestión de organización
export class OrganizationService {

  private firestore =  inject(Firestore);
  private injector = inject(Injector);
  
  private getDocRef(orgId: string) {
    return doc(this.firestore, 'organizations', orgId).withConverter(organizationConverter);
  }

  getOrganizationBySlugOrId$(param: string): Observable<OrganizationModel | undefined> {

  return runInInjectionContext(this.injector, () => {
      const colRef = collection(this.firestore, 'organizations').withConverter(organizationConverter);
      const q = query(colRef, where('slug', '==', param));

      return (collectionData(q) as Observable<OrganizationModel[]>).pipe(
        map(orgs => orgs[0] || undefined)
      );
    });
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

  //UPDATE
  async update(uid: string, data: Partial<OrganizationModel>): Promise<void> {
    const ref = this.getDocRef(uid);
    await updateDoc(ref, {
     ...data,
      updatedAt: serverTimestamp()
   });
  }

  //delete!
  async delete(orgId: string): Promise<void> {
    const ref = doc(this.firestore, 'organizations', orgId);
    await deleteDoc(ref);
  }

  //generación de i dúnico, porque el id de usuario lo autogenera firebase ...
  generateNewId(): string {
    return doc(collection(this.firestore, 'organizations')).id;
  }
//rebusca en las organizaciones
  getBySlug$(slug: string): Observable<OrganizationModel | null> {
  return runInInjectionContext(this.injector, () => {
      const q = query(this.getOrgs, where('slug', '==', slug));

      // Dejamos la conexión reactiva abierta en tiempo real
      return (collectionData(q, { idField: 'uid' }) as Observable<OrganizationModel[]>).pipe(
        map(orgs => {
          if (!orgs || orgs.length === 0) return null;
          return orgs[0] as OrganizationModel;
        })
      );
    });
  }

//ENSURE organización -> crea la organización ligada de entrada ya con el USUARIO CREADOR
 async ensureOrganization(orgName: string, contactEmail: string, owner: { uid: string; displayName: string; email: string, photoURL?: string}): Promise<OrganizationModel> {
  try {
    const slug = generateSlug(orgName);
    
    // Verificamos si ya existe
    const q = query(this.getOrgs, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Lanzamos un error controlado para que la vista lo capture y avise al usuario
      throw new Error('ORGANIZATION_EXISTS');
    }
    
    const newOrgId = this.generateNewId();
    const newOrg = createDefaultOrganization(newOrgId, orgName, owner, contactEmail, owner.photoURL); 
    
    await this.create(newOrg);
    
    return newOrg;
  } catch (e: any) {
    if (e.message === 'ORGANIZATION_EXISTS') {
      throw e; // Propagamos el error controlado
    }
    console.error('Error al crear la organización:', e);
    throw e;
  }
}

  //GESTIÓN de tareas MODIFICA RPARA USAR EL PROPIO METODO DE UPDATE ??

  async addRecentTask(orgId: string, summary: TaskSummary): Promise<void> {
    const ref = this.getDocRef(orgId);
    return updateDoc(ref, {
      recentTasks: arrayUnion(summary),
      updatedAt: serverTimestamp()
    });
  }

  //eliminación de la tarea

  async removeRecentTask(orgId: string, taskId: string): Promise<void> {
    const ref = this.getDocRef(orgId);
    const snap = await runInInjectionContext(this.injector, () => getDoc(ref));

    if (!snap.exists()) return;

    const org = snap.data();
    // Solución al error TS18048: fallback a array vacío si recentTasks es undefined
    const currentTasks = org.recentTasks ?? [];
    const updatedTasks = currentTasks.filter(t => t.taskId !== taskId);

    await updateDoc(ref, {
      recentTasks: updatedTasks,
      updatedAt: serverTimestamp()
    });
}

//añadir experiencia !

async recordCompletedTask(orgId: string): Promise<void> {
 
    try {
      // actualizamos XP
      await this.update(orgId, {
        'statistics.tasksCompleted': increment(1),
        xp: increment(100),
        updatedAt: serverTimestamp()
    } as any );

    } catch (error) {
      console.error('Error crítico en recordCompletedTask:', error);
    }
  }

}