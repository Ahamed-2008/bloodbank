import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP-ERROR');

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest();
    const response = context.getResponse();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;
    const message = exception instanceof Error
      ? exception.message
      : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `${request.method} ${request.originalUrl} -> ${status}: ${message}`,
      stack,
    );

    if (exception instanceof HttpException) {
      response.status(status).json(exception.getResponse());
    } else {
      response.status(status).json({
        message: 'Internal server error',
        statusCode: status,
      });
    }
  }
}