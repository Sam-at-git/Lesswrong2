import { compose } from 'react-apollo'; // note: at the moment, compose@react-apollo === compose@redux ; see https://github.com/apollostack/react-apollo/blob/master/src/index.ts#L4-L7
import React from 'react';
import difference from 'lodash/difference';

let componentsPopulated = false;


const componentsProxyHandler = {
  get: function(obj, prop) {
    if (prop in obj) {
      return obj[prop];
    }
    else if (prop in ComponentsTable) {
      obj[prop] = getComponent(prop);
      return obj[prop];
    }
    
    console.error(`Missing component: ${prop}`);
  }
}

// will be populated on startup (see vulcan:routing)
export const Components = new Proxy({}, componentsProxyHandler);

// storage for infos about components
export const ComponentsTable = {};

export const coreComponents = [
  'Alert',
  'Button',
  'Modal',
  'ModalTrigger',
  'FormComponentCheckbox',
  'FormComponentCheckboxGroup',
  'FormComponentDate',
  'FormComponentDateTime',
  'FormComponentDefault',
  'FormComponentEmail',
  'FormComponentNumber',
  'FormComponentSelect',
  'FormComponentTextarea',
  'FormComponentUrl',
  'FormComponentInner',
  'FormControl',
  'FormElement',
  'FormItem',
];

/**
 * Register a Vulcan component with a name, a raw component than can be extended
 * and one or more optional higher order components.
 *
 * @param {String} name The name of the component to register.
 * @param {React Component} rawComponent Interchangeable/extendable component.
 * @param {...Function} hocs The HOCs to compose with the raw component.
 *
 * Note: when a component is registered without higher order component, `hocs` will be
 * an empty array, and it's ok!
 * See https://github.com/reactjs/redux/blob/master/src/compose.js#L13-L15
 *
 * @returns Structure of a component in the list:
 *
 * ComponentsTable.Foo = {
 *    name: 'Foo',
 *    hocs: [fn1, fn2],
 *    rawComponent: React.Component,
 *    call: () => compose(...hocs)(rawComponent),
 * }
 *
 */
export function registerComponent(name, rawComponent, ...hocs) {
  // support single-argument syntax
  if (typeof arguments[0] === 'object') {
    // note: cannot use `const` because name, components, hocs are already defined
    // as arguments so destructuring cannot work
    // eslint-disable-next-line no-redeclare
    var { name, component, hocs = [] } = arguments[0];
    rawComponent = component;
  }
  
  rawComponent.displayName = name;
  
  if (name in ComponentsTable && ComponentsTable[name].rawComponent !== rawComponent) {
    throw new Error(`Two components with the same name: ${name}`);
  }
  
  // store the component in the table
  ComponentsTable[name] = {
    name,
    rawComponent,
    hocs,
  };
}

/**
 * Get a component registered with registerComponent(name, component, ...hocs).
 *
 * @param {String} name The name of the component to get.
 * @returns {Function|React Component} A (wrapped) React component
 */
const getComponent = name => {
  const component = ComponentsTable[name];
  if (!component) {
    throw new Error(`Component ${name} not registered.`);
  }
  if (component.hocs && component.hocs.length) {
    const hocs = component.hocs.map(hoc => {
      if (!Array.isArray(hoc)) {
        if (typeof hoc !== 'function') {
          throw new Error(`In registered component ${name}, an hoc is of type ${typeof hoc}`);
        }
        return hoc;
      }
      const [actualHoc, ...args] = hoc;
      if (typeof actualHoc !== 'function') {
        throw new Error(`In registered component ${name}, an hoc is of type ${typeof actualHoc}`);
      }
      return actualHoc(...args);
    });
    return compose(...hocs)(component.rawComponent);
  } else {
    return component.rawComponent;
  }
};

/**
 * Populate the lookup table for components to be callable
 * ℹ️ Called once on app startup
 **/
export const populateComponentsApp = () => {
  const registeredComponents = Object.keys(ComponentsTable);

  const missingComponents = difference(coreComponents, registeredComponents);

  if (missingComponents.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Found the following missing core components: ${missingComponents.join(
        ', '
      )}. Include a UI package such as vulcan:ui-bootstrap to add them.`
    );
  }
};

/**
 * Returns an instance of the given component name of function
 * @param {string|function} component  A component or registered component name
 * @param {Object} [props]  Optional properties to pass to the component
 */
//eslint-disable-next-line react/display-name
export const instantiateComponent = (component, props) => {
  if (!component) {
    return null;
  } else if (typeof component === 'string') {
    const Component = Components[component];
    return <Component {...props} />;
  } else if (
    typeof component === 'function' &&
    component.prototype &&
    component.prototype.isReactComponent
  ) {
    const Component = component;
    return <Component {...props} />;
  } else if (typeof component === 'function') {
    return component(props);
  } else {
    return component;
  }
};

/**
 * Creates a component that will render the registered component with the given name.
 *
 * This function  may be useful when in need for some registered component, but in contexts
 * where they have not yet been initialized, for example at compile time execution. In other
 * words, when using `Components.ComponentName` is not allowed (because it has not yet been
 * populated, hence would be `undefined`), then `delayedComponent('ComponentName')` can be
 * used instead.
 *
 * @example Create a container for a registered component
 *  // SomeContainer.js
 *  import compose from 'recompose/compose';
 *  import { delayedComponent } from 'meteor/vulcan:core';
 *
 *  export default compose(
 *    // ...some hocs with container logic
 *  )(delayedComponent('ComponentName')); // cannot use Components.ComponentName in this context!
 *
 * @example {@link dynamicLoader}
 * @param {String} name Component name
 * @return {Function}
 *  Functional component that will render the given registered component
 */
export const delayedComponent = name => {
  return props => {
    const Component = Components[name] || null;
    return Component && <Component {...props} />;
  };
};

// Example with Proxy (might be unstable/hard to reason about)
//const mergeWithComponents = (myComponents = {}) => {
//  const handler = {
//    get: function(target, name) {
//      return name in target ? target[name] : Components[name];
//    }
//  };
//  const proxy = new Proxy(myComponents, handler);
//  return proxy;
//};
export const mergeWithComponents = myComponents =>
  myComponents ? { ...Components, ...myComponents } : Components;
