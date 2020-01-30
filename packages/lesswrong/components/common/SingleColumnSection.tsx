import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

export const SECTION_WIDTH = 765

const styles = createStyles((theme) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: SECTION_WIDTH,
  }
}))

const SingleColumnSection = ({classes, className, children}: {
  classes: any,
  className?: string,
  children?: any,
}) => {

  return (
    <Components.ErrorBoundary>
      <div className={classNames(classes.root, className)}>
        { children }
      </div>
    </Components.ErrorBoundary>
  )
};

const SingleColumnSectionComponent = registerComponent('SingleColumnSection', SingleColumnSection, {styles});

declare global {
  interface ComponentTypes {
    SingleColumnSection: typeof SingleColumnSectionComponent
  }
}