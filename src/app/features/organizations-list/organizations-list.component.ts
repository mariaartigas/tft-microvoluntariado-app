import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { OrganizationModel, organizationConverter } from '../../shared/models/organization.model';
import { FooterComponent } from "../../shared/components/footer/footer.component";

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations-list.component.html',
  styleUrls: ['./organizations-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FooterComponent]
})
export class OrganizationsListComponent implements OnInit {
  private firestore = inject(Firestore);

  isLoading = signal<boolean>(true);
  organizations = signal<OrganizationModel[]>([]);

  async ngOnInit() {
    await this.loadOrganizations();
  }

  //carga de orgs

  async loadOrganizations() {
    try {
      this.isLoading.set(true);
      const colRef = collection(this.firestore, 'organizations').withConverter(organizationConverter);
      const snapshot = await getDocs(colRef);
      
      const orgsList = snapshot.docs.map(doc => doc.data());
      this.organizations.set(orgsList);
    } catch (error) {
      console.error('Error al cargar las organizaciones:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}