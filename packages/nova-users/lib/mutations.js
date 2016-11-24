import Telescope, { newMutation, editMutation, removeMutation } from 'meteor/nova:lib';
import Users from './groups'; // circular dependency?

const performCheck = (mutation, user, document) => {
  if (!mutation.check(user, document)) throw new Error(`Sorry, you don't have the rights to perform the mutation ${mutation.name} on document _id = ${document._id}`);
};

const mutations = {

  new: {
    
    name: 'usersNew',
    
    check(user, document) {
      if (!user) return false;
      return Users.canDo(user, 'users.new');
    },
    
    mutation(root, {document}, context) {
      
      performCheck(this, context.currentUser, document);

      return newMutation({
        collection: context.Users,
        document: document, 
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  },

  edit: {
    
    name: 'usersEdit',
    
    check(user, document) {
      if (!user || !document) return false;
      return Users.owns(user, document) ? Users.canDo(user, 'users.edit.own') : Users.canDo(user, `users.edit.all`);
    },

    mutation(root, {documentId, set, unset}, context) {

      const document = context.Users.findOne(documentId);
      performCheck(this, context.currentUser, document);

      return editMutation({
        collection: context.Users, 
        documentId: documentId, 
        set: set, 
        unset: unset, 
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  },
  
  remove: {

    name: 'usersRemove',
    
    check(user, document) {
      if (!user || !document) return false;
      return Users.owns(user, document) ? Users.canDo(user, 'users.remove.own') : Users.canDo(user, `users.remove.all`);
    },
    
    mutation(root, {documentId}, context) {

      const document = context.Users.findOne(documentId);
      performCheck(this, context.currentUser, document);

      return removeMutation({
        collection: context.Users, 
        documentId: documentId, 
        currentUser: context.currentUser,
        validate: true,
        context,
      });
    },

  },

};

export default mutations;