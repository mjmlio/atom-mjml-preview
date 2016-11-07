'use babel';

import url from 'url'
import { CompositeDisposable } from 'atom'
import MJMLView from './mjml-view'

let MJMLPaneView = null

export default {
  config: {
    triggerOnSave: {
      type: 'boolean',
      description: 'Watch will trigger on save.',
      default: false,
    },
  },

  desactivate() {
    this.subscriptions.dispose()
  },

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
      this.subscriptions.add(editor.onDidSave(() => this.openPane(editor)))
    }))

    atom.workspace.addOpener(this.mjmlPreviewOpener)

    this.keybindings()
  },

  keybindings() {
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'mjml-preview:preview': () => this.openPane() }))
  },

  openPane(editor) {
    const currentEditor = editor || atom.workspace.getActiveTextEditor()
    const uri = 'mjml-preview://file'
    const previewPane = atom.workspace.paneForURI(uri)
    const fileGrammar = currentEditor.getGrammar()

    if (fileGrammar.scopeName !== 'text.mjml.basic') {
      return;
    }

    if (previewPane) {
      previewPane.destroyItem(previewPane.itemForURI(uri))
    }

    atom.workspace.open(uri, { split: 'right', searchAllPanes: true }).done(() => MJMLPaneView.render(currentEditor))
  },

  mjmlPreviewOpener(uri) {
    try {
      const { protocol, pathname } = url.parse(uri)
      if (protocol !== 'mjml-preview:') {
        return;
      }

      const filePath = decodeURI(pathname)

      MJMLPaneView = new MJMLView(filePath)

      return MJMLPaneView
    } catch (e) {
      return;
    }
  },
}
