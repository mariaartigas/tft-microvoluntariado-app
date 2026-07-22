//MODELO de gestión de organizaciones

import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from "@angular/fire/firestore";
import { TaskSummary } from './task.model';

//información de contacto
export interface OrganizationContacts {
  email: string;              
  phone?: string | null;
  website: string | null;
  instagram?: string | null;
}

//estadísticas de la organización
export interface OrganizationStats {
  completedTasks: number;
  cancelledTasks: number;
  activeVolunteers: number; 
  totalHours: number;
}

//denormalización
export interface OrganizationMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'org_admin' | 'org_member'; //actualmente solo admite uno, esto es para escalibilidad
}

export interface OrganizationModel {
  uid: string;             // orgId de la base de datos
  verified: boolean;      // De entrada todo false hasta que un moderador lo revise
  displayName: string;
  email: string; 
  contacts: OrganizationContacts;
  slug: string; //para la url de la página como tal
  logoURL: string | null;
  description: string;
  ownerId: string;        // el uid del creader usuario de esta org
  members: OrganizationMember[]; // miembros, acualmente en desuso
  recentTasks?: TaskSummary[]; // tareas expuestas recientes !
  createdAt?:  Date, // revisar esta parte es imporante, realmente siempre tener una fecha de creación del usuario obligatoria
  updatedAt?: Date;
}

//generación rápida de los slugs para las rutas
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

//mantener para uso futuro por si acaso
export const isOrganizationValid = (name: string): boolean => {
  return name.trim().length >= 3;
};

//creación por defecto ! 
export function createDefaultOrganization( orgId: string, name: string, owner: { uid: string; displayName: string; email: string }, contactEmail: string): OrganizationModel {
  return {
  uid: orgId,
  slug: generateSlug(name),
  verified: false, // por defecto hasta revisión de moderador
  displayName: name,
  logoURL: null,
  description: '',
  ownerId: owner.uid,
  members: [
    {
      uid: owner.uid,
      displayName: owner.displayName,
      email: owner.email,
      role: 'org_admin' // creador guardamos su información
    }
  ],
  email: contactEmail,
  contacts: {
    email: contactEmail,
    phone:"",
    website: "",
    },
    createdAt: new Date(),    //marcar el tiempo actual
    updatedAt: new Date()
  };
};


//modelos
export const organizationConverter: FirestoreDataConverter<OrganizationModel> = {
    toFirestore(organization: OrganizationModel): DocumentData {
      return { ...organization };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): OrganizationModel { //snapshot son los metadatos + id + datos reales
      const data = snapshot.data(options);
    return {
      uid: snapshot.id, // id del documento automatico
      email: data['email'] ?? '',
      slug: data['slug'] ?? '',
      verified: data['verified'] ?? false,
      displayName: data['displayName'] ?? '',
      logoURL: data['logoURL'] ?? null,
      description: data['description'] ?? '',
      createdAt: data['createdAt']?.toDate() ?? new Date(), // Convertimos de vuelta de Timestamp a Date
      updatedAt: data['updatedAt']?.toDate() ?? new Date(),
      ownerId: data['ownerId'] ?? '',
      members: data['members'] ?? [],
      recentTasks: data['recentTasks'] ?? [],
      contacts: data['contacts'] ?? { email: '' }
    };
  }
};