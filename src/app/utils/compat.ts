export const shortenB64 = (value: string = '') => {
  if (value.startsWith('0000000000000000000000000000000000000000000')) {
    return value.substring(0, 1);
  }

  return value.replace(/0+=?$/g, '').substring(0, 25);
};
