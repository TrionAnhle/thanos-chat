export enum DomainCode {
  USERNAME_ALREADY_USED = 1001,
  BAD_REQUEST = 1400,
  INVALID_CREDENTIALS = 1401,
  INTERNAL_ERROR = 1500,
  UNKNOWN_ERROR = 1501,
}

export const DomainCodeMessage: Record<DomainCode, string> = {
  [DomainCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [DomainCode.USERNAME_ALREADY_USED]: 'Username already exists',
  [DomainCode.BAD_REQUEST]: 'Bad request',
  [DomainCode.INTERNAL_ERROR]: 'Internal server error',
  [DomainCode.UNKNOWN_ERROR]: 'Unknown error',
};
