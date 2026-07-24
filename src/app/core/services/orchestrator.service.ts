import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { OrganizationService } from './organization.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';
import { TaskModel, toTaskSummary } from '../../shared/models/task.model';
import { firstValueFrom } from 'rxjs';

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

  //GESTIÓN DE ENTREGA

 async submitTaskDelivery(taskId: string, proofNote: string = '', proofUrl: string = ''): Promise<void> {
    await this.taskService.submitTaskForReview(taskId, proofNote, proofUrl);
  }

  // La ONG aprueba la entrega -> Marca completada y actualiza el perfil del voluntario 
  async approveTaskCompletion(taskId: string, volunteerId?: string, feedbackReview?: string): Promise<void> {
 
    await this.taskService.approveTask(taskId, feedbackReview);
    const task = await firstValueFrom(this.taskService.getById$(taskId));
    let targetVolunteerId = task?.assignedVolunteerId || (task as any)?.assignedVolunteer?.uid; //esto es para asegurarnos de que se actualizan los datos
    const orgId = task?.orgId || (task as any)?.org?.uid;

    if (targetVolunteerId) {
      await this.userService.recordCompletedTask(targetVolunteerId);
    } else {
      console.warn(' No se pudo actualizar XP: La tarea no tiene un voluntario asignado válido.');
    }

    if (targetVolunteerId) {
      await this.orgService.recordCompletedTask(orgId);
    } else {
      console.warn(' No se pudo actualizar XP: La tarea no tiene un voluntario asignado válido.');
    }
}

  // la ONG rechaza la entrega -> Pide correcciones 
  async rejectTaskDelivery(taskId: string, feedbackNote: string): Promise<void> {
    await this.taskService.rejectTask(taskId, feedbackNote);
  }
  
  //opción de rechazar
  async rejectTaskSubmission(taskId: string, feedbackReason?: string): Promise<void> {
    await this.taskService.update(taskId, {
      status: 'En Curso', // Vuelve a ponerse en curso para que el voluntario corrija
      proofNote: null,
      proofUrl: null
    });
    
  }

  //DELETE--------

  // Eliminación de voluntario adaptada para Google Auth
  async deleteVolunteerAccount(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const uid = currentUser.uid;
    const profile = this.authService.currentUserProfile();

    try {
     await this.authService.reauthenticateWithGoogle();

  
      await this.taskService.unassignVolunteerFromTasks(uid);
      if (profile?.role === 'organization') {
        const orgId = profile.organizationId || uid;
        await this.orgService.delete(orgId);
      }
      await this.userService.delete(uid);


      await this.authService.deleteAuthAccount();

    } catch (error: any) {
      console.error('Error durante la eliminación del voluntario:', error);
      throw error;
    }
  }

  // Eliminación de referencias a una organización adaptada para Google Auth
  async deleteOrganizationAccount(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) throw new Error('No hay usuario autenticado');

    const uid = currentUser.uid;
    const profile = this.authService.currentUserProfile();
   
    try {
       const orgId = profile?.organizationId || uid;

      await this.authService.reauthenticateWithGoogle();

      await this.taskService.deleteTasksByOrganization(orgId);
      await this.orgService.delete(orgId);
      await this.userService.update(uid, {role: 'volunteer', organizationId: '', organizationSlug: ''});

      //await this.authService.deleteAuthAccount();

    } catch (error: any) {
      console.error('Error durante la eliminación de la organización:', error);
      throw error;
    }
  }

}