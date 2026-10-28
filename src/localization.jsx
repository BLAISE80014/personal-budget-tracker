import { cloneElement, isValidElement } from 'react'
import { usePreferences } from './contexts.js'
import { translate } from './translations.js'

export function LocalizedText({ value, leadingSpace = false, trailingSpace = false }) {
  const { preferences } = usePreferences() ?? {}
  const resolvedValue = typeof value === 'function' ? value() : value
  if (typeof resolvedValue !== 'string') return resolvedValue
  return `${leadingSpace ? ' ' : ''}${translate(resolvedValue, preferences?.language)}${trailingSpace ? ' ' : ''}`
}

export function LocalizedElement({ children, properties }) {
  const { preferences } = usePreferences() ?? {}
  if (!isValidElement(children)) return children

  const localizedProps = Object.fromEntries(
    properties
      .filter((property) => typeof children.props[property] === 'string')
      .map((property) => [property, translate(children.props[property], preferences?.language)]),
  )

  return Object.keys(localizedProps).length
    ? cloneElement(children, localizedProps)
    : children
}
