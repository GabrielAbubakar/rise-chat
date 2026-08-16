import '@tanstack/react-query';
import { AppError } from '../shared/utils';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AppError;
  }
}
