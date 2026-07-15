
//MODELO de gestión de usuarios

export interface UserModel {
  username: string;

  uid: string;

  email: string;

  displayName: string;

  photoURL: string | null;

  role: 'volunteer' | 'organization' | 'moderator';

  organizationId: string | null;

  xp: number;

  reputation: number;

  reliability: number;

  statistics: {

    completedTasks: number;

    cancelledTasks: number;

    organizationsHelped: number;

    totalHours: number;

  };

  createdAt?: any;

  updatedAt?: any;
}