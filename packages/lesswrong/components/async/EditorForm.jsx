import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Editor, { composeDecorators } from 'draft-js-plugins-editor';
import createInlineToolbarPlugin, { Separator } from 'draft-js-inline-toolbar-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createRichButtonsPlugin from 'draft-js-richbuttons-plugin';
import createBlockBreakoutPlugin from 'draft-js-block-breakout-plugin'
import createDividerPlugin from './editor-plugins/divider';
import createMathjaxPlugin from 'draft-js-mathjax-plugin'
import createMarkdownShortcutsPlugin from './editor-plugins/markdown-shortcuts-plugin';
import { withTheme, withStyles } from '@material-ui/core/styles';
import createLinkPlugin from 'draft-js-anchor-plugin';
import LinkButton from './editor-plugins/LinkButton'
import { myKeyBindingFn } from './editor-plugins/keyBindings.js'
import createLinkifyPlugin from './editor-plugins/linkifyPlugin'
import ImageButton from './editor-plugins/image/ImageButton.jsx';
import { Map } from 'immutable';
import classNames from 'classnames';
import compose from 'lodash/flowRight';
import NoSsr from '@material-ui/core/NoSsr';
import {
  createBlockStyleButton,
  ItalicButton,
  BoldButton,
  UnderlineButton,
  BlockquoteButton,
} from 'draft-js-buttons';

const styles = theme => ({
  root: {
    position: "relative",
  },
  placeholder: {
    color: theme.palette.grey[500],
    position: "absolute",
    top: 0
  }
})

const HeadlineOneButton = createBlockStyleButton({
  blockType: 'header-one',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});

const HeadlineTwoButton = createBlockStyleButton({
  blockType: 'header-two',
  children: (
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4v3h5.5v12h3V7H19V4z"/>
      <path d="M0 0h24v24H0V0z" fill="none"/>
    </svg>),
});

const styleMap = theme => ({
  'CODE': theme.typography.code
})

function customBlockStyleFn(contentBlock) {
  const type = contentBlock.getType();
  if (type === 'spoiler') {
    return 'spoiler';
  }
}

class EditorForm extends Component {
  constructor(props) {
    super(props);
    this.plugins = this.initializePlugins(props.isClient, props.commentEditor);
  }

  initializePlugins = (isClient, commentEditor) => {
    const linkPlugin = createLinkPlugin();
    const alignmentPlugin = createAlignmentPlugin();
    const focusPlugin = createFocusPlugin();
    const resizeablePlugin = createResizeablePlugin();
    const decorator = composeDecorators(
      resizeablePlugin.decorator,
      alignmentPlugin.decorator,
      focusPlugin.decorator,
    );

    const dividerPlugin = createDividerPlugin({decorator});

    const toolbarButtons = [
      { button: BoldButton,                    commentEditor: true   },
      { button: ItalicButton,                  commentEditor: true   },
      { button: UnderlineButton,               commentEditor: true   },
      { button: LinkButton,             commentEditor: true   },
      { button: Separator,                     commentEditor: true   },
      { button: HeadlineOneButton,             commentEditor: false  },
      { button: HeadlineTwoButton,             commentEditor: true   },
      { button: BlockquoteButton,              commentEditor: true   },
      { button: dividerPlugin.DividerButton,   commentEditor: false  },
      { button: ImageButton,                   commentEditor: false  },
    ]

    const inlineToolbarPlugin = createInlineToolbarPlugin({
      structure: _.chain(toolbarButtons)
                  .filter(b => commentEditor ? b.commentEditor : true)
                  .pluck('button')
                  .value()
    });

    const richButtonsPlugin = createRichButtonsPlugin();
    const blockBreakoutPlugin = createBlockBreakoutPlugin()
    const markdownShortcutsPlugin = createMarkdownShortcutsPlugin();

    const linkifyPlugin = createLinkifyPlugin();

    const imagePlugin = createImagePlugin({ decorator });
    let plugins = [
      inlineToolbarPlugin,
      alignmentPlugin,
      focusPlugin,
      resizeablePlugin,
      imagePlugin,
      linkPlugin,
      richButtonsPlugin,
      blockBreakoutPlugin,
      markdownShortcutsPlugin,
      dividerPlugin,
      linkifyPlugin
    ];

    if (isClient) {
      const mathjaxPlugin = createMathjaxPlugin(
        {
          completion: 'manual',
          mathjaxConfig: {
            jax: ['input/TeX', 'output/CommonHTML'],
            TeX: {
              extensions: ['autoload-all.js', 'Safe.js'],
            },
            messageStyle: 'none',
            showProcessingMessages: false,
            showMathMenu: false,
            showMathMenuMSIE: false,
            preview: 'none',
            delayStartupTypeset: true,
          }
        }
      )
      plugins.push(mathjaxPlugin);
    }

    return plugins;
  }

  focus = () => {
    // FIXME: This gets called when you click in the area the text editor has
    // been allocated, but which it hasn't filled, ie, below the text. So it
    // should put the cursor at the end of your partially written post/comment.
    // But instead it restores the cursor to wherever it was when the editor
    // lost focus.
    this._ref && this._ref.focus();
  }

  render() {
    const { classes, theme, editorState, onChange, placeholder } = this.props

    const InlineToolbar = this.plugins[0].InlineToolbar;
    const AlignmentTool = this.plugins[1].AlignmentTool;

    const showPlaceholder = !(editorState && editorState.getCurrentContent && editorState.getCurrentContent().hasText())

    return (
      <div>
        <NoSsr>
        <div
          className={classNames(classes.root, this.props.className)}
          onClick={this.focus}
        >
          {showPlaceholder && <div className={classes.placeholder}>{placeholder}</div>}
          <Editor
            editorState={editorState}
            onChange={onChange}
            spellCheck
            plugins={this.plugins}
            keyBindingFn={myKeyBindingFn}
            customStyleMap={styleMap(theme)}
            blockStyleFn={customBlockStyleFn}
            blockRenderMap={blockRenderMap}
            ref={(ref) => { this._ref = ref }}
          />
        </div>
        <InlineToolbar />
        <AlignmentTool />
        </NoSsr>
      </div>
    )
  }
}

const blockRenderMap = Map({
  'spoiler': {
    element: 'div'
  }
});

EditorForm.propTypes = {
  isClient: PropTypes.bool,
  editorState: PropTypes.object,
  onChange: PropTypes.func
}

export default compose(
  withStyles(styles, {name:"EditorForm"}),
  withTheme()
)(EditorForm);
