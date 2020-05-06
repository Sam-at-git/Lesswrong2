import React from 'react';
import Users from '../collections/users/collection'
import { Utils } from '../vulcan-lib';
import { ContentType } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict } from '../utils/schemaUtils';
import SimpleSchema from 'simpl-schema'

export const RevisionStorageType = new SimpleSchema({
  originalContents: {type: ContentType, optional: true},
  userId: {type: String, optional: true},
  commitMessage: {type: String, optional: true},
  html: {type: String, optional: true, denormalized: true},
  updateType: {type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major']},
  version: {type: String, optional: true},
  editedAt: {type: Date, optional: true},
  wordCount: {type: SimpleSchema.Integer, optional: true, denormalized: true}
})

SimpleSchema.extendOptions([ 'inputType' ]);

const defaultOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  // Determines whether to use the comment local storage restoration system
  commentLocalStorage: false,
  permissions: {
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members']
  },
  fieldName: "",
  order: 0,
  hintText: (
    <div>
      <div>Write here. Select text for formatting options.</div>
      <div>We support LaTeX: Cmd-4 for inline, Cmd-M for block-level (Ctrl on Windows).</div>
      <div>You can switch between rich text and markdown in your user settings.</div>
    </div>
  ),
  pingbacks: false,
}

export const editableCollections = new Set<string>()
export const editableCollectionsFields: Record<string,Array<string>> = {}
export const editableCollectionsFieldOptions: Record<string,any> = {};

export const makeEditable = ({collection, options = {}}: {
  collection: any,
  options: any,
}) => {
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    getLocalStorageId,
    formGroup,
    permissions,
    fieldName,
    hintText,
    order,
    pingbacks = false,
    revisionsHaveCommitMessages = false,
  } = options

  const collectionName = collection.options.collectionName;
  editableCollections.add(collectionName)
  editableCollectionsFields[collectionName] = [
    ...(editableCollectionsFields[collectionName] || []),
    fieldName || "contents"
  ]
  editableCollectionsFieldOptions[collectionName] = {
    ...editableCollectionsFieldOptions[collectionName],
    [fieldName || "contents"]: options,
  };

  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      inputType: 'UpdateRevisionDataInput',
      optional: true,
      group: formGroup,
      ...permissions,
      order,
      control: 'EditorFormComponent',
      resolveAs: {
        type: 'Revision',
        arguments: 'version: String',
        resolver: async (doc, { version }, context: ResolverContext) => {
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const { checkAccess } = Revisions
          if (version) {
            const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            return await checkAccess(currentUser, revision, context) ? revision : null
          }
          return {
            editedAt: (doc[field]?.editedAt) || new Date(),
            userId: doc[field]?.userId,
            commitMessage: doc[field]?.commitMessage,
            originalContentsType: (doc[field]?.originalContentsType) || "html",
            originalContents: (doc[field]?.originalContents) || {},
            html: doc[field]?.html,
            updateType: doc[field]?.updateType,
            version: doc[field]?.version,
            wordCount: doc[field]?.wordCount,
          }
        }
      },
      form: {
        hintText: hintText,
        fieldName: fieldName || "contents",
        collectionName,
        commentEditor,
        commentStyles,
        getLocalStorageId,
      },
    },
    
    [Utils.camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      viewableBy: ['guests'],
      optional: true,
      resolveAs: {
        type: '[Revision]',
        arguments: 'limit: Int = 5',
        resolver: async (post, { limit }, context: ResolverContext) => {
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
          return await accessFilterMultiple(currentUser, Revisions, resolvedDocs, context);
        }
      }
    },
    
    [Utils.camelCaseify(`${fieldName}Version`)]: {
      type: String,
      viewableBy: ['guests'],
      optional: true,
      resolveAs: {
        type: 'String',
        resolver: (post) => {
          return post[fieldName || "contents"]?.version
        }
      }
    }
  });
  
  if (pingbacks) {
    addFieldsDict(collection, {
      // Dictionary from collection name to array of distinct referenced
      // document IDs in that collection, in order of appearance
      pingbacks: {
        type: Object,
        viewableBy: 'guests',
        optional: true,
        hidden: true,
      },
      "pingbacks.$": {
        type: Array,
      },
      "pingbacks.$.$": {
        type: String,
      },
    });
  }
}
