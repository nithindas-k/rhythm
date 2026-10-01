import { AppError } from './AppError';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

export class NotFoundError extends AppError {
  constructor(message: string = MESSAGES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}
