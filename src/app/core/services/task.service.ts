import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc,  updateDoc, collection, docData,  serverTimestamp, collectionData, orderBy, query, where, QueryDocumentSnapshot, getDocs, limit, startAfter, deleteDoc, increment, QueryConstraint } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TaskModel, taskConverter, TaskStatus, createDefaultTask } from '../../shared/models/task.model';

//para la gestión de queries de búsqueda/filtro
export type TaskQueryScope =
  | { type: 'org'; orgId: string; status?: TaskStatus }
  | { type: 'user'; volunteerId: string; status?: TaskStatus }
  | { type: 'all'; status?: TaskStatus };

@Injectable({ providedIn: 'root' })

export class TaskService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  
  // UTILS

  generateNewId(): string {
    return doc(collection(this.firestore, 'tasks')).id;
  }

  private getTaskDocRef(taskId: string) {
    return doc(this.firestore, 'tasks', taskId).withConverter(taskConverter);
  }

  //REVISIÓN DE CONSTRAINTS para queries, método privado de clase

  private buildQueryConstraints(scope: TaskQueryScope): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    switch (scope.type) {
      case 'org':
        if (!scope.orgId) throw new Error('[TaskService] orgId es obligatorio para el scope "org"');
        constraints.push(where('orgId', '==', scope.orgId));
        break;

      case 'user':
        if (!scope.volunteerId) throw new Error('[TaskService] volunteerId es obligatorio para el scope "volunteer"');
        constraints.push(where('assignedVolunteerId', '==', scope.volunteerId));
        break;

      case 'all':
        // En el scope global, por defecto buscamos las que estén activas si no se especifica otro estado
        if (!scope.status) {
          constraints.push(where('status', '==', 'Activa'));
        }
        break;
    }

    if (scope.status) {
      constraints.push(where('status', '==', scope.status));
    }

    return constraints;
  }

  //GETs -------------

  getById$(taskId: string): Observable<TaskModel | undefined> {
    return docData(this.getTaskDocRef(taskId));
  }

  private getTaskCollectionRef() {
    return collection(this.firestore, 'tasks').withConverter(taskConverter);
  }

  //obtener los TASKS por filtros! 

  getTasks$(scope: TaskQueryScope): Observable<TaskModel[]> {
    const colRef = this.getTaskCollectionRef();
    const constraints = [
      ...this.buildQueryConstraints(scope),
      orderBy('createdAt', 'desc')
    ];

    const q = query(colRef, ...constraints);

    return runInInjectionContext(this.injector, () =>
      collectionData(q, { idField: 'uid' })
    );
  }

 async getTasksPaginated(
  scope: TaskQueryScope,
  pageSize: number = 10,
  lastVisible: QueryDocumentSnapshot | null = null
): Promise<{ tasks: TaskModel[]; lastVisible: QueryDocumentSnapshot | null }> {
  const colRef = this.getTaskCollectionRef();
  const constraints: QueryConstraint[] = [
    ...this.buildQueryConstraints(scope),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  ];

  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }

  const q = query(colRef, ...constraints);

  // Encapsulamos getDocs en runInInjectionContext para eliminar la advertencia de la consola
  const snapshot = await runInInjectionContext(this.injector, () => getDocs(q));

  const tasks = snapshot.docs.map(docSnap => docSnap.data());
  const newLastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { tasks, lastVisible: newLastVisible };
}


//WRITES -------------

  async createTask(title: string, org: { uid: string; displayName: string; logoURL?: string | null }, description: string = '', assignmentType: 'Manual' | 'Instant' = 'Manual', estimatedTime: string = '30 mins', deadline: Date = new Date()): Promise<TaskModel> {
    const newTaskId = this.generateNewId();
    const newTask = createDefaultTask(newTaskId, title, org, description, assignmentType, estimatedTime, deadline);

    await setDoc(this.getTaskDocRef(newTask.uid), newTask);
    return newTask;
  }

  async update(taskId: string, data: Partial<TaskModel>): Promise<void> {
    const rawRef = doc(this.firestore, 'tasks', taskId);
    await updateDoc(rawRef, { ...data, updatedAt: serverTimestamp() });
  }

//DELETE -------------

  async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  async deleteTasksByOrganization(orgId: string): Promise<void> {
  const colRef = collection(this.firestore, 'tasks').withConverter(taskConverter);
  const q = query(colRef, where('orgId', '==', orgId));
  const snapshot = await getDocs(q);

  // Reutilizamos el método deleteTask que ya tienes definido arriba
  const deletionPromises = snapshot.docs.map(docSnap => this.deleteTask(docSnap.id));
  
  await Promise.all(deletionPromises);
}

//Métodos propios de TASKS -------------

// En este caso solo tenemos disponible asignación directa

  async claimTask(taskId: string, volunteer: { uid: string; displayName: string }): Promise<void> {

    await this.update(taskId, {
      assignedVolunteerId: volunteer.uid,
      assignedVolunteerName: volunteer.displayName,
      status: 'En Curso',
    });
}

// Desapuntarse de una tarea, en donde el usuario sufre una penalización !

  async unclaimTask(taskId: string): Promise<void> {
    await this.update(taskId, {
      assignedVolunteerId: null,
      assignedVolunteerName: null,
      status: 'Activa',
    });
  }

  async unassignVolunteerFromTasks(volunteerId: string): Promise<void> {
  const colRef = collection(this.firestore, 'tasks').withConverter(taskConverter);
  const q = query(colRef, where('assignedVolunteerId', '==', volunteerId));
  const snapshot = await getDocs(q);

  // Reutilizamos tu método unclaimTask para cada tarea encontrada
  const unclaimPromises = snapshot.docs.map(docSnap => 
    this.unclaimTask(docSnap.id)
  );

  await Promise.all(unclaimPromises);
}

//ENTREGA de tarea

async submitTaskForReview(
  taskId: string, 
  proofNote: string = '', 
  proofUrl: string = ''
): Promise<void> {
  await this.update(taskId, {
    status: 'Pendiente de Revisión',
    proofNote: proofNote.trim(),
    proofUrl: proofUrl.trim(),
    submittedAt: new Date()
  });
}

async approveTask(taskId: string, feedbackNote?: string): Promise<void> {
  await this.update(taskId, {
    status: 'Completada',
    submittedAt: new Date(), 
    feedbackNote: feedbackNote?.trim() || null
  });
}

//denegación de entrega
async rejectTask(taskId: string, feedbackNote?: string): Promise<void> {
  await this.update(taskId, {
    status: 'En Curso',
    feedbackNote: feedbackNote?.trim() || null
  });
}


}