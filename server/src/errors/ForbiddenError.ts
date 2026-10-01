import { AppError } from './AppError';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

export class ForbiddenError extends AppError {
  constructor(message: string = MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}
