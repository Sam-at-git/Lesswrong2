import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user) => {
    if (!user) return false;
    return Users.canDo(user, 'posts.new')
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'posts.alignment.move.all') ||
        Users.canDo(user, 'posts.alignment.suggest')) {
      return true
    }
    return Posts.canEdit(user, document)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'posts.edit.own') : Users.canDo(user, `posts.edit.all`)
  },
}

interface ExtendedPostsCollection extends PostsCollection {
  // Functions in lib/collections/posts/helpers.ts
  getLink: any
  getShareableLink: any
  getLinkTarget: any
  getAuthorName: any
  getDefaultStatus: any
  getStatusName: any
  isApproved: any
  isPending: any
  current: any
  getTwitterShareUrl: any
  getFacebookShareUrl: any
  getEmailShareUrl: any
  getPageUrl: any
  getCommentCount: any
  getCommentCountStr: any
  getLastCommentedAt: any
  canEdit: any
  canDelete: any
  getKarma: any
  getVoteCount: any
  getVoteCountStr: any
  canEditHideCommentKarma: any
  
  // In lib/alignment-forum/posts/helpers.ts
  suggestForAlignment: any
  unSuggestForAlignment: any
  
  // In search/utils.ts
  toAlgolia: any
  
  // Things in lib/collections/posts/collection.ts
  config: Record<string,number>
  statuses: Array<{value: number, label: string}>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
});

// refactor: moved here from schema.js
Posts.config = {};

Posts.config.STATUS_PENDING = 1;
Posts.config.STATUS_APPROVED = 2;
Posts.config.STATUS_REJECTED = 3;
Posts.config.STATUS_SPAM = 4;
Posts.config.STATUS_DELETED = 5;


// Post statuses
Posts.statuses = [
  {
    value: 1,
    label: 'pending'
  },
  {
    value: 2,
    label: 'approved'
  },
  {
    value: 3,
    label: 'rejected'
  },
  {
    value: 4,
    label: 'spam'
  },
  {
    value: 5,
    label: 'deleted'
  }
];

addUniversalFields({collection: Posts})

export default Posts;
