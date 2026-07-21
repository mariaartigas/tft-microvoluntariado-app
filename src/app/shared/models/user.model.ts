
//MODELO de gestión de usuarios

import { NumberSymbol } from "@angular/common";
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "@angular/fire/firestore";
import { TaskSummary } from './task.model';

export type UserRole = 'volunteer' | 'organization' | 'moderator';

export interface UserStats {
  tasksCompleted: number;
  tasksAbandoned: number;
  tasksExpired: number;
  organizationsHelped: number;
  totalHours: number;
}

export interface UserModel {
  username: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  isVisible: boolean;
  organizationId: string | null;
  isVerified: boolean;
  xp: number;
  reputation: number; //
  reliability: number;
  statistics: UserStats;
  recentTasks?: TaskSummary[];
  // campos propios de perfil de usuario
  bio?: string;
  interests?: string[];
  badges?: string[];

  createdAt: Date;
  updatedAt?: Date;
}

export function createDefaultUser(firebaseUser: { uid: string, email: string | null, displayName: string | null, photoURL: string | null }, role: UserRole = 'volunteer'
): UserModel {

  const isOrg = role === 'organization'; //verificamos si entró por organización

  return {
    uid: firebaseUser.uid,
    username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user_' + firebaseUser.uid.substring(0, 5),
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? (isOrg ? 'Nueva Organización' : 'Nuevo Voluntario'),
    photoURL: firebaseUser.photoURL,
    role,
    isVisible: isOrg, // Los voluntarios serán solo visibles en cuanto completen su priemra TAREA
    organizationId: null, // solo si está finalmente verificado, y es de org
    isVerified: !isOrg,   // Los voluntarios entran activos, las orgs requieren verificación --> replantear cómo hacerlo? con moderadores?
    xp: 0,
    reputation: 0,      // Empiezan con reputación 0, lo máximo es 100
    reliability: 0,     // Empiezan con fiabilidad 0
    statistics: {
      tasksCompleted: 0,
      tasksAbandoned: 0,
      tasksExpired: 0,
      organizationsHelped: 0,
      totalHours: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

//modelos
export const userConverter: FirestoreDataConverter<UserModel> = {
    toFirestore(user: UserModel): DocumentData { //repasar el uso del document data
      return { ...user };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): UserModel { //snapshot son los metadatos + id + datos reales
    const data = snapshot.data(options);

    const rawStats = data['statistics'] || {};
    const statistics: UserStats = {
      tasksCompleted: rawStats['tasksCompleted'] ?? 0,
      tasksAbandoned: rawStats['tasksAbandoned'] ?? 0,
      tasksExpired: rawStats['tasksExpired'] ?? 0,
      organizationsHelped: rawStats['organizationsHelped'] ?? 0,
      totalHours: rawStats['totalHours'] ?? 0,
    };
    return {
      uid: snapshot.id,
      username: data['username'],
      email: data['email'],
      displayName: data['displayName'],
      photoURL: data['photoURL'],
      role: data['role'],
      isVisible: data['isVisible'],
      organizationId: data['organizationId'],
      isVerified: data['isVerified'],
      xp: data['xp'] ?? 0,
      reputation: data['reputation'] ?? 100,
      reliability: data['reliability'] ?? 100,
      statistics,
      recentTasks: data['recentTasks'] ?? [],
      createdAt: data['createdAt']?.toDate() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate() ?? new Date(),
    };
  }
};