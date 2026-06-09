const EMAIL_NO_WHITESPACE_PATTERN = /^\S+$/;

export const EMAIL_NO_WHITESPACE_MESSAGE = 'Email must not contain whitespace.';

export const hasEmailWhitespace = (email: string) =>
  !EMAIL_NO_WHITESPACE_PATTERN.test(email);

export const validateEmailHasNoWhitespace = (email: string): string | null =>
  hasEmailWhitespace(email) ? EMAIL_NO_WHITESPACE_MESSAGE : null;
