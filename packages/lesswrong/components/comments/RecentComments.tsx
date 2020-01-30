import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import { useCurrentUser } from '../common/withUser';
import Typography from '@material-ui/core/Typography';
import { createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme =>  ({
  root: {
    marginTop: theme.spacing.unit*2,
    [theme.breakpoints.up('sm')]: {
      margin: theme.spacing.unit*2,
    }
  }
}))

const RecentComments = ({classes, terms, truncated=false, noResultsMessage="No Comments Found"}: {
  classes: any,
  terms: any,
  truncated?: boolean,
  noResultsMessage?: string,
}) => {
  const currentUser = useCurrentUser();
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'SelectCommentsList',
    enableTotal: false,
    pollInterval: 0,
    queryLimitName: "recentCommentsLimit",
    ssr: true
  });
  const {mutate: updateComment} = useUpdate({
    collection: Comments,
    fragmentName: 'SelectCommentsList',
  });
  if (!loadingInitial && results && !results.length) {
    return (<Typography variant="body2">{noResultsMessage}</Typography>)
  }
  if (loadingInitial || !results) {
    return <Components.Loading />
  }
  
  return (
    <div className={classes.root}>
      {results.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
            comment={comment}
            post={comment.post}
            updateComment={updateComment}
            showPostTitle
            startThreadTruncated={truncated}
            forceNotSingleLine
            condensed={false}
          />
        </div>
      )}
      <Components.LoadMore {...loadMoreProps} />
    </div>
  )
}

const RecentCommentsComponent = registerComponent('RecentComments', RecentComments, {styles});

declare global {
  interface ComponentTypes {
    RecentComments: typeof RecentCommentsComponent,
  }
}
