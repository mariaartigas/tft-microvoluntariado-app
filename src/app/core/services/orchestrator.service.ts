import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { OrganizationService } from './organization.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';
import { TaskModel, toTaskSummary } from '../../shared/models/task.model';

@Injectable({ providedIn: 'root' })
export class OrchestratorService {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);
  private taskService = inject(TaskService);

  //Creación de TASK
  async createTaskAndSync(title: string,org: { uid: string; displayName: string; logoURL?: string | null },description: string = '',assignmentType: 'Manual' | 'Instant' = 'Manual',estimatedTime: string = '30 mins',deadline: Date = new Date()): Promise<TaskModel> {
    const newTask = await this.taskService.createTask(title,  org, description,assignmentType,  estimatedTime, deadline);

    // se mapea
    const summary = toTaskSummary(newTask);

    // actualización del resumen !
    await this.orgService.addRecentTask(org.uid, summary);

    return newTask;
  }

  // Eliminación y limpieza !
  async deleteTaskAndSync(task: TaskModel): Promise<void> {
    
    await this.taskService.deleteTask(task.uid);

    
    if (task.orgId) {
      await this.orgService.removeRecentTask(task.orgId, task.uid);
    }
  }

  // asignación de la tarea
  async claimTaskForVolunteer(taskId: string, volunteer: { uid: string; displayName: string }): Promise<void> {
    // Actualizamos la tarea asignándola al voluntario
    await this.taskService.claimTask(taskId, volunteer);
  }

  // modo de penalización +
  async unclaimTaskAndPenalize(taskId: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) throw new Error('No hay usuario autenticado');

    // se libera la tarea
    await this.taskService.unclaimTask(taskId);

    await this.userService.recordAbandonedTask(currentUser.uid);
  }

  async deleteVolunteerAccount(): Promise<void> {
  const currentUser = this.authService.currentUser();
  if (!currentUser) return;

  try {
    const uid = currentUser.uid;

    // 1. PRIMERO limpiamos y borramos en Firestore (mientras request.auth sigue activo)
    await this.taskService.unassignVolunteerFromTasks(uid);
    await this.userService.delete(uid);

    // 2. SEGUNDO borramos de Firebase Auth al final de todo
    await this.authService.deleteAuthAccount();

  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      console.warn('Se requiere reautenticación por seguridad.');
      throw new Error('Por seguridad, debes cerrar sesión y volver a entrar para poder eliminar tu cuenta.');
    }
    throw error;
  }
}

   // Delete de referencias a una organización

  async deleteOrganizationAccount(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) throw new Error('No hay usuario autenticado');

    const orgId = currentUser.uid;

    await this.taskService.deleteTasksByOrganization(orgId);

   
    await this.orgService.delete(orgId);

    
    await this.userService.delete(orgId);

    
    await this.authService.deleteAuthAccount();
  }

}