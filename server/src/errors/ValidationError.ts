import { AppError } from './AppError';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

export interface ValidationFieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly fieldErrors: ValidationFieldError[];

  constructor(fieldErrors: ValidationFieldError[], message: string = MESSAGES.VALIDATION_ERROR) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    this.fieldErrors = fieldErrors;
  }
}
