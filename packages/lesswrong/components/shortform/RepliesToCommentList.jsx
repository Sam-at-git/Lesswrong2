import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import { Comments } from "../../lib/collections/comments";
import withUser from '../common/withUser';
import { unflattenComments } from "../../lib/utils/unflatten";


class RepliesToCommentList extends PureComponent {
  render() {
    const { loading, results, post, currentUser, parentCommentId } = this.props;
    const { CommentsList, Loading } = Components;
    
    if (loading || !results)
      return <Loading/>
    
    const nestedComments = unflattenComments(results);
    return <CommentsList
      currentUser={currentUser}
      totalComments={results.length}
      comments={nestedComments}
      post={post}
      startThreadTruncated={true}
      defaultNestingLevel={2}
      parentCommentId={parentCommentId}
    />
  }
}


registerComponent('RepliesToCommentList', RepliesToCommentList,
  withUser,
  [withMulti, {
    collection: Comments,
    queryName: "RepliesToCommentQuery",
    fragmentName: "CommentsList",
    ssr: true,
  }],
)