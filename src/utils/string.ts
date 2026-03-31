export function replace(
  str: string,
  start: number,
  end: number,
  value: string,
): string {
  return str.slice(0, start) + value + str.slice(end)
}

export function isEscape(str: string, index: number): boolean {
  if (str[index - 1] !== '\\') return false

  let isEsc = false
  for (let i = index - 1; i >= 0; i--) {
    if (str[i] === '\\') {
      isEsc = !isEsc
    } else {
      break
    }
  }

  return isEsc
}

export function randomString(): string {
  return Math.random().toString(36).slice(2)
}
