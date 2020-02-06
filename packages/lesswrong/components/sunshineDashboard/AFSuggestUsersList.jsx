import { Components as C, registerComponent } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import PropTypes from 'prop-types';
import Users from "meteor/vulcan:users";

const styles = theme => ({
  icon: {
    marginRight: 4
  }
})


class AFSuggestUsersList extends Component {
  render () {
    const { results, classes } = this.props
    if (results && results.length) {
      return (
        <div>
          <C.SunshineListTitle>
            <div><C.OmegaIcon className={classes.icon}/> Suggested Users</div>
          </C.SunshineListTitle>
          {this.props.results.map(user =>
            <div key={user._id} >
              <C.AFSuggestUsersItem user={user}/>
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

AFSuggestUsersList.propTypes = {
  results: PropTypes.array,
  classes: PropTypes.object.isRequired
};

const withListOptions = {
  collection: Users,
  queryName: 'SuggestionAlignmentUserQuery',
  fragmentName: 'SuggestAlignmentUser',
  fetchPolicy: 'cache-and-network',
};

registerComponent(
  'AFSuggestUsersList',
  AFSuggestUsersList,
  [withMulti, withListOptions],
  withUser,
  withStyles(styles, {name: "AFSuggestUsersList"})
);