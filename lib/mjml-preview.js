'use babel';

import url from 'url'
import { CompositeDisposable } from 'atom'
import MJMLView from './mjml-view'

let MJMLPaneView = null

export default {
  config: {
    triggerOnSave: {
      type: 'boolean',
      description: 'Update the preview on each save.',
      default: true,
    },
  },

  desactivate() {
    this.subscriptions.dispose()
  },

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.subscriptions.add(editor.getBuffer().onDidSave(() => {
        if (atom.config.get('mjml-preview.triggerOnSave')) {
          this.openPane(editor)
        }
      }))
    }))

    atom.workspace.addOpener(this.mjmlPreviewOpener)

    this.keybindings()
  },

  keybindings() {
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'mjml-preview:preview': () => this.openPane() }))
  },

  openPane(editor) {
    const activeEditor = atom.workspace.getActiveTextEditor()
    const currentEditor = editor || activeEditor

    if (!currentEditor) {
      // probably trying to render an mjml-preview pane
      return;
    }

    if (currentEditor.id === atom.workspace.getActiveTextEditor().id) {
      const uri = `mjml-preview://editor/${currentEditor.id}`
      const fileGrammar = currentEditor.getGrammar()
      if (fileGrammar.scopeName !== 'text.mjml.basic') {
        return;
      }

      const previousActivePane = atom.workspace.getActivePane()

      atom.workspace.open(uri, { split: 'right', searchAllPanes: true })
        .then((view) => {
          if (view instanceof MJMLView) {
            return view.render(currentEditor)
          }
        })
        .done(() => previousActivePane.activate())
    }
  },

  mjmlPreviewOpener(uri) {
    try {
      const { protocol, pathname } = url.parse(uri)
      if (protocol !== 'mjml-preview:') {
        return;
      }

      const filePath = decodeURI(pathname)

      MJMLPaneView = new MJMLView({editorId: filePath.substring(1), filePath})

      return MJMLPaneView
    } catch (e) {
      return;
    }
  },
}
