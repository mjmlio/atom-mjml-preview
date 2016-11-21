'use babel';

import path from 'path'
import fs from 'fs'
import os from 'os'
import { $, ScrollView } from 'atom-space-pen-views'
import { mjml2html } from 'mjml'

class MJMLView extends ScrollView {
  static serialiaze() {
    return {
      deserializer: 'AtomHtmlPreviewView',
      filePath: this.filePath,
    }
  }

  static deserialize ({ filePath }) {
    return new MJMLView(filePath)
  }

  static content () {
    return MJMLView.div({ 'class': 'atom-html-preview native-key-bindings', 'tabindex': -1 })
  }

  constructor(filePath) {
    super()
    this.filePath = filePath
    atom.deserializers.add(this)
    this.createWebView()
  }

  createWebView() {
    this.webview = document.createElement('webview')
    this.webview.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    this.webview.setAttribute('style', 'height: 100%')
    this.append($(this.webview))
  }

  renderMJML(TextEditor, done) {
    const mjmlTempPath = path.resolve(path.join(os.tmpdir(), `${TextEditor.getTitle()}.html`))
    const outputHTML = mjml2html(TextEditor.getText(), { level: 'skip', disableMjInclude: true, disableMinify: true }).html

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
      try {
        this.webview.reload()
      } catch (error) {
        return null
      }
    })
  }

  getTitle() {
    return 'MJML Preview'
  }

  getURI() {
    return `mjml-preview://file`
  }
}

export default MJMLView
