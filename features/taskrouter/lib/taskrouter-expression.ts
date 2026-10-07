export function isSafeTaskRouterLiteral(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 255 &&
    !/[\\'"\u0000-\u001f\u007f]/.test(value)
  )
}
