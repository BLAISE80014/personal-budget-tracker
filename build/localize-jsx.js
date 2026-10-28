import path from 'node:path'
import { parse } from '@babel/parser'

const localizedProperties = new Set([
  'actionLabel',
  'alt',
  'caption',
  'description',
  'detail',
  'emptyMessage',
  'footer',
  'heading',
  'helper',
  'label',
  'message',
  'placeholder',
  'submitLabel',
  'subtitle',
  'title',
  'aria-label',
])

function containsJsx(node) {
  if (!node || typeof node !== 'object') return false
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true
  return Object.entries(node).some(([key, value]) => (
    !['loc', 'start', 'end', 'extra', 'tokens', 'comments'].includes(key)
    && (Array.isArray(value) ? value.some(containsJsx) : containsJsx(value))
  ))
}

function localizedAttributes(openingElement) {
  return openingElement.attributes
    .filter((attribute) => {
      if (attribute.type !== 'JSXAttribute' || !localizedProperties.has(attribute.name.name)) return false
      return attribute.value?.type === 'StringLiteral'
        || (attribute.value?.type === 'JSXExpressionContainer' && attribute.value.expression.type === 'StringLiteral')
        || (['aria-label', 'placeholder'].includes(attribute.name.name) && attribute.value?.type === 'JSXExpressionContainer')
    })
    .map((attribute) => attribute.name.name)
}

export default function localizeJsx() {
  const sourceRoot = `${path.resolve('src').replaceAll('\\', '/')}/`
  return {
    name: 'budgetly-localize-jsx',
    enforce: 'pre',
    transform(source, id) {
      const filePath = id.split('?')[0]
      const normalizedPath = filePath.replaceAll('\\', '/')
      if (!normalizedPath.startsWith(sourceRoot) || !normalizedPath.endsWith('.jsx')) return null

      const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] })
      const edits = []

      function visit(node, parent = null) {
        if (!node || typeof node !== 'object') return

        if (node.type === 'JSXText') {
          const value = node.value.replace(/\s+/g, ' ').trim()
          if (value) {
            const leadingSpace = !node.value.includes('\n') && /^\s/.test(node.value)
            const trailingSpace = !node.value.includes('\n') && /\s$/.test(node.value)
            const expression = `{<LocalizedText value=${JSON.stringify(value)}${leadingSpace ? ' leadingSpace' : ''}${trailingSpace ? ' trailingSpace' : ''} />}`
            edits.push({ start: node.start, end: node.end, text: expression })
          }
          return
        }

        if (
          node.type === 'JSXExpressionContainer'
          && parent?.type !== 'JSXAttribute'
          && node.expression.type !== 'JSXEmptyExpression'
          && !containsJsx(node.expression)
        ) {
          edits.push({ start: node.start + 1, end: node.start + 1, text: '<LocalizedText value={() => (' })
          edits.push({ start: node.end - 1, end: node.end - 1, text: ')} />' })
        }

        if (node.type === 'JSXElement') {
          const properties = localizedAttributes(node.openingElement)
          if (properties.length) {
            edits.push({ start: node.start, end: node.start, text: `<LocalizedElement properties={${JSON.stringify(properties)}}>` })
            edits.push({ start: node.end, end: node.end, text: '</LocalizedElement>' })
          }
        }

        for (const [key, value] of Object.entries(node)) {
          if (['loc', 'start', 'end', 'extra', 'tokens', 'comments'].includes(key)) continue
          if (Array.isArray(value)) value.forEach((child) => visit(child, node))
          else if (value && typeof value === 'object') visit(value, node)
        }
      }

      visit(ast)
      if (!edits.length) return null

      edits.sort((left, right) => right.start - left.start || right.end - left.end)
      let output = source
      for (const edit of edits) {
        output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`
      }

      const localizationPath = path.relative(path.dirname(filePath), path.resolve('src/localization.jsx')).replaceAll('\\', '/')
      const importPath = localizationPath.startsWith('.') ? localizationPath : `./${localizationPath}`
      return { code: `import { LocalizedElement, LocalizedText } from ${JSON.stringify(importPath)}\n${output}`, map: null }
    },
  }
}
