import { AppError } from './AppError';
import { HTTP_STATUS } from '../constants/statusCodes';

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}
