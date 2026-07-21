//MODELO de gestión de TAREAS

import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "@angular/fire/firestore";

export type TaskStatus = 'Activa' | 'Asignada' | 'En Curso' | 'Pendiente de Revisión' | 'Completada' | 'Cancelada';

export interface TaskSummary {
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
}

//SUBCOLECCIÓN
export interface MessageModel {
  uid: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

//modelo general
export interface TaskModel {
  uid: string;                 // ID del documento en la colección /tasks
  title: string;
  description: string;
  status: TaskStatus;
  hoursCalculated: number;    
  orgId: string;
  orgDisplayName: string;      
  estimatedTime: string;
  deadline: Date; // ISO string o formato de fecha
  assignedVolunteerName?: string | null;
  assignedVolunteerId: string | null;
 // chatRoomId: string | null;   // ID del canal de mensajes dedicado a esta tarea
  
  createdAt: Date;
  updatedAt?: Date;
}

//función factory !
export function createDefaultTask( taskId: string, title: string, org: { uid: string; displayName: string; logoURL?: string | null }, description: string = '', assingmentType: 'Manual' | 'Instant', estimatedTime: string, deadline: Date): TaskModel {
  return {
    uid: taskId,
    title: title.trim(),
    description: description.trim(),
    status: 'Activa',
    hoursCalculated: 1, // Por defecto cada momento suma 1 hora de impacto
    orgId: org.uid,
    orgDisplayName: org.displayName,
    estimatedTime: estimatedTime.trim(),
    deadline: deadline,
    assignedVolunteerName: null,
    assignedVolunteerId:  null,
   // chatRoomId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function createDefaultMessage(
  messageId: string, 
  senderId: string, 
  text: string
): MessageModel {
  return {
    uid: messageId,
    senderId,
    text: text.trim(),
    createdAt: new Date()
  };
}

//CONVERTERS --------------------
export const taskConverter: FirestoreDataConverter<TaskModel> = {
  toFirestore(task: TaskModel): DocumentData {
    return { ...task };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): TaskModel {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      title: data['title'] ?? '',
      orgId: data['orgId'] ?? '',
      orgDisplayName: data['orgDisplayName'] ?? '',
      description: data['description'] ?? '',
      status: data['status'] ?? 'Activa',
      estimatedTime: data['estimatedTime'] ?? 'No especificado',
      deadline: data['deadline']?.toDate ? data['deadline'].toDate() : new Date(data['deadline'] ?? Date.now()),
      assignedVolunteerName: data['assignedVolunteerName'],
      hoursCalculated: data['hoursCalculated'] ?? 1,
      assignedVolunteerId: data['assignedVolunteerId'] ?? null,
      createdAt: data['createdAt']?.toDate() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate() ?? new Date()
    };
  }
}

export function toTaskSummary(task: TaskModel): TaskSummary {
  return {
    taskId: task.uid,
    title: task.title,
    description: task.description,
    status: task.status
  };
}

export const messageConverter: FirestoreDataConverter<MessageModel> = {
  toFirestore: (data: MessageModel) => ({ ...data }),
  fromFirestore: (snap: QueryDocumentSnapshot, options?: SnapshotOptions): MessageModel => {
    const data = snap.data(options);
    return {
      uid: snap.id,
      senderId: data['senderId'] ?? '',
      text: data['text'] ?? '',
      createdAt: data['createdAt']?.toDate() ?? new Date()
    };
  }
};