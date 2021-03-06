import React from 'react';
import Button from 'react-bootstrap/Button';
import { registerComponent } from '../../../lib/vulcan-core';

const BootstrapButton = ({ children, variant, size, iconButton, ...rest }) => 
  <Button variant={variant} size={size} {...rest}>{children}</Button>;

const ButtonComponent = registerComponent('Button', BootstrapButton);

declare global {
  interface ComponentTypes {
    Button: typeof ButtonComponent
  }
}

