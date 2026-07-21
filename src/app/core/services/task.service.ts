import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc,  updateDoc, collection, docData,  serverTimestamp, collectionData, orderBy, query, where, QueryDocumentSnapshot, getDocs, limit, startAfter, deleteDoc, increment } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TaskModel, taskConverter, TaskStatus, MessageModel, messageConverter, createDefaultTask, createDefaultMessage } from '../../shared/models/task.model';

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

  //GETs -------------

  getById$(taskId: string): Observable<TaskModel | undefined> {
    return docData(this.getTaskDocRef(taskId));
  }

  getTasksByVolunteer$(volunteerId: string, status: string) {
    const colRef = collection(this.firestore, 'tasks').withConverter(taskConverter);
    const q = query(colRef, where('assignedVolunteerId', '==', volunteerId), where('status', '==', status));

    // Envolver obligatoriamente dentro del contexto de inyección
    return runInInjectionContext(this.injector, () => 
      collectionData(q, { idField: 'uid' })
    );
  }

  getTasksByOrg$(orgId: string, status: TaskStatus): Observable<TaskModel[]> {
    const colRef = collection(this.firestore, 'tasks').withConverter(taskConverter);
    const q = query(
      colRef,
      where('orgId', '==', orgId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q);
  }

 async getTasksPaginated(orgId: string | null = null, volunteerId: string | null = null, status?: TaskStatus, lastVisible: QueryDocumentSnapshot | null = null): Promise<{ tasks: TaskModel[], lastVisible: QueryDocumentSnapshot | null }> {
  
    const colRef = collection(this.firestore, 'tasks').withConverter(taskConverter);
    const constraints: any[] = [];

    // Filtro por Organización o Voluntario
    if (orgId) {
      constraints.push(where('orgId', '==', orgId));
    } else if (volunteerId) {
      constraints.push(where('assignedVolunteerId', '==', volunteerId));
    }

    // Si se pasa un estado específico, lo filtramos. Si es undefined, trae TODOS los estados.
    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(10));

    let q = query(colRef, ...constraints);

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(d => d.data());
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

//GESTION DE MENSAJES -------------

//READ de mensajes  -------------

  getMessages$(taskId: string, volunteerId: string): Observable<MessageModel[]> {
    const colRef = collection(this.firestore, `tasks/${taskId}/applications/${volunteerId}/messages`).withConverter(messageConverter);
    return collectionData(colRef);
  }

// Enviar mensaje en el chat sobre la tarea (pdte de implementar)
  async sendMessage(taskId: string, volunteerId: string, senderId: string, text: string): Promise<void> {
    const colRef = collection(this.firestore, `tasks/${taskId}/applications/${volunteerId}/messages`);
    const newMsgRef = doc(colRef).withConverter(messageConverter);
    const newMessage = createDefaultMessage(newMsgRef.id, senderId, text);

    await setDoc(newMsgRef, newMessage);
  }


}