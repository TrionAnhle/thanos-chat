export enum DomainCode {
  BAD_REQUEST = 1400,
  INVALID_CREDENTIALS = 1401,
  INTERNAL_ERROR = 1500,
  UNKNOWN_ERROR = 1501,
  USERNAME_ALREADY_USED = 1001,
  USER_NOT_FOUND = 1002,
  ROOM_NOT_FOUND = 2001,
}

export const DomainCodeMessage: Record<DomainCode, string> = {
  [DomainCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [DomainCode.BAD_REQUEST]: 'Bad request',
  [DomainCode.INTERNAL_ERROR]: 'Internal server error',
  [DomainCode.UNKNOWN_ERROR]: 'Unknown error',
  [DomainCode.USERNAME_ALREADY_USED]: 'Username already exists',
  [DomainCode.USER_NOT_FOUND]: 'User not found',
  [DomainCode.ROOM_NOT_FOUND]: 'Room not found',
};
