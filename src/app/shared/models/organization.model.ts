
//MODELO de gestión de organizaciones

import { User } from "@angular/fire/auth";
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from "@angular/fire/firestore";


export interface OrganizationContacts {
  email: string;               // Email de contacto público (por defecto el del creador)
  phone: string | null;
  website: string | null;
  instagram: string | null;
}

//Estadísticas de la organización
export interface OrganizationStats {
  completedTasks: number;
  cancelledTasks: number;
  organizationsHelped: number; // whart?
  totalHours: number;
}

// para evitar lecturas extrass
export interface OrganizationMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'org_admin' | 'org_member';
}

// tareas recientes !
export interface RecentTaskSummary {
  taskId: string;
  displayName: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'under_review' | 'completed' | 'cancelled'; //revisar estados posibles
}

export interface OrganizationModel {
  uid: string;             // orgId de la base de datos
  verified: boolean;      // De entrada todo false hasta que un moderador lo revise
  displayName: string;
  email: string; // añadir además una parte de contactos?
  contacts: OrganizationContacts;
  slug: string; //para la url de la página como tal
  logoURL: string | null;
  description: string;
  website?: string; //cambiarlo por contacts
  ownerId: string;        // el uid del creader usuario de esta org
  members: OrganizationMember[]; // miembros, acualmente en desuso
  recentTasks: RecentTaskSummary[]; // tareas expuestas recientes !
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

//esto pa que? validar la organización en qué sentido !
export const isOrganizationValid = (name: string): boolean => {
  return name.trim().length >= 3;
};

//ESTAS CREACIONES DERIVADAS DEL MODELO DE USER ? REDEFINICIÓN ------------------------------------------------------

//creación por defecto ! RECUERDA AÑADIR ESTADÍSITICAS ! IMPORTANT
export function createDefaultOrganization( orgId: string, name: string, owner: { uid: string; displayName: string; email: string }): OrganizationModel {
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
  recentTasks: [],
  email: "",
  contacts: {
    email: owner.email,
    phone:"",
    website: "",
    instagram: "",
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
      uid: snapshot.id, // id del documento automatico? what?
      email: data['email'] ?? '',
      slug: data['slug'] ?? '',
      verified: data['verified'] ?? false,
      displayName: data['name'] ?? '',
      logoURL: data['logoURL'] ?? null,
      description: data['description'] ?? '',
      website: data['website'],
      createdAt: (data['createdAt'] as Timestamp).toDate(), // Convertimos de vuelta de Timestamp a Date
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
      ownerId: data['ownerId'] ?? '',
      members: data['members'] ?? [],
      recentTasks: data['recentTasks'] ?? [],
      contacts: data['contacts'] ?? { email: '' }
    };
  }
};