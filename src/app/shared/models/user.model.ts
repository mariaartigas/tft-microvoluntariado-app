
//MODELO de gestión de usuarios

import { User } from "@angular/fire/auth";
import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "@angular/fire/firestore";

export type UserRole = 'volunteer' | 'organization' | 'moderator';

export interface UserStats {
  completedTasks: number;
  cancelledTasks: number;
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
  createdAt?: Date;
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
    reputation: 100,      // Empiezan con reputación máxima
    reliability: 100,     // Empiezan con fiabilidad máxima
    statistics: {
      completedTasks: 0,
      cancelledTasks: 0,
      organizationsHelped: 0,
      totalHours: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

//modelos
export const userConverter: FirestoreDataConverter<UserModel> = {
    toFirestore(user: UserModel) {
      return {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        isVisible: user.isVisible,
        organizationId: user.organizationId,
        isVerified: user.isVerified,
        xp: user.xp,
        reputation: user.reputation,
        reliability: user.reliability,
        statistics: user.statistics,
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date() // seguimiento - control de versiones y actualizaciones
      };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserModel { //snapshot son los metadatos + id + datos reales
    const data = snapshot.data(options);
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
      statistics: data['statistics'] ?? {
        completedTasks: 0,
        cancelledTasks: 0,
        organizationsHelped: 0,
        totalHours: 0
      },
      createdAt: data['createdAt']?.toDate(),
      updatedAt: data['updatedAt']?.toDate()
    };
  }
};