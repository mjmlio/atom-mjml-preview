'use babel';

import path from 'path'
import fs from 'fs'
import os from 'os'
import { $, ScrollView } from 'atom-space-pen-views'
import { mjml2html } from 'mjml'

class MJMLView extends ScrollView {
  static serialize() {
    return {
      deserializer: 'MJMLView',
      filePath: this.filePath,
      editorId: this.editorId
    }
  }

  static deserialize (state) {
    return new MJMLView(state)
  }

  static content () {
    return MJMLView.div({ 'class': 'atom-html-preview native-key-bindings', 'tabindex': -1 })
  }

  constructor({editorId, filePath}) {
    super()
    this.webViewLoaded = false
    this.reloadLater = false
    this.filePath = filePath
    this.editorId = editorId
    atom.deserializers.add(this)

    if (this.editorId) {
      this.editor = this.editorForId(this.editorId)
    }

    this.createWebView()
    this.addReadyListener()
  }

  addReadyListener() {
    this.webview.addEventListener('dom-ready', () => {
      this.webViewLoaded = true
      if (this.reloadLater) {
        this.reloadLater = false
        this.webview.reload()
      }
    })
  }

  createWebView() {
    this.webview = document.createElement('webview')
    this.webview.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    this.webview.setAttribute('style', 'height: 100%')
    this.append($(this.webview))
  }

  editorForId(editorId) {
    const editors = atom.workspace.getTextEditors()
    for (let i = 0 ; i < editors.length ; i++) {
      const editor = editors[i]
      if (editor && editor.id === parseInt(editorId)) return editor
    }
  }

  renderMJML(TextEditor, done) {
    const mjmlTempPath = path.resolve(path.join(os.tmpdir(), `${TextEditor.getTitle()}.html`))
    const outputHTML = mjml2html(TextEditor.getText(), { level: 'skip', disableMinify: true, filePath: TextEditor.getPath() }).html

    fs.writeFile(mjmlTempPath, outputHTML, (err) => {
      if (err) {
        throw err
      }

      done(mjmlTempPath)
    })
  }

  render(TextEditor) {
    this.renderMJML(TextEditor, (file) => {
      this.webview.src = file

      if (this.webViewLoaded) {
        try {
          this.webview.reload()
        } catch (error) {
          return null
        }
      } else {
        this.reloadLater = true
      }
    })
  }

  getTitle() {
    return `PREVIEW - ${this.editor.getTitle()}`
  }

  getURI() {
    return `mjml-preview://editor/${this.editorId}`
  }
}

export default MJMLView
