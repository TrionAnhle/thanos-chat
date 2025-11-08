export enum DomainCode {
  INVALID_CREDENTIALS = 1001,
  USERNAME_ALREADY_USED = 1002,
  INTERNAL_ERROR = 1500,
  UNKNOWN_ERROR = 1501,
}

export const DomainCodeMessage: Record<DomainCode, string> = {
  [DomainCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [DomainCode.USERNAME_ALREADY_USED]: 'Username already exists',
  [DomainCode.INTERNAL_ERROR]: 'Internal server error',
  [DomainCode.UNKNOWN_ERROR]: 'Unknown error',
};
