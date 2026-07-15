import { User } from '@angular/fire/auth';
import { UserModel } from '../models/user.model';


export function firebaseUserToUserModel(
 firebaseUser: User
): UserModel {

return {

 uid: firebaseUser.uid,

 email: firebaseUser.email ?? '',

 displayName:
 firebaseUser.displayName ?? '',

 photoURL:
 firebaseUser.photoURL,

 role:'volunteer',

 organizationId:null,

 xp:0,

 reputation:0,

 reliability:100,

 statistics:{
   completedTasks:0,
   cancelledTasks:0,
   organizationsHelped:0,
   totalHours:0
 },

 username:''

};

}