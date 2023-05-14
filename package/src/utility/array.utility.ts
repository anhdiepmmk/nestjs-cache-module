export function filterArrayByPattern(pattern: string, arr: string[]) {
  // convert pattern to regular expression
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

  // filter array using regular expression
  return arr.filter((str) => regex.test(str));
}
