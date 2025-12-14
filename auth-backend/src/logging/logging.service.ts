import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  constructor() {
    super();
  }

  setLogLevels(levels: LogLevel[]) {
    super.setLogLevels(levels);
  }

  logWithContext(context: string, message: string, meta?: unknown) {
    const formatted = meta
      ? `${message} | META: ${JSON.stringify(meta)}`
      : message;

    super.log(formatted, context);
  }

  warnWithContext(context: string, message: string, meta?: unknown) {
    const formatted = meta
      ? `${message} | META: ${JSON.stringify(meta)}`
      : message;

    super.warn(formatted, context);
  }

  errorWithContext(
    context: string,
    message: string,
    trace?: string,
    meta?: unknown,
  ) {
    const formatted = meta
      ? `${message} | META: ${JSON.stringify(meta)}`
      : message;

    super.error(formatted, trace, context);
  }

  debugWithContext(context: string, message: string, meta?: unknown) {
    const formatted = meta
      ? `${message} | META: ${JSON.stringify(meta)}`
      : message;

    super.debug(formatted, context);
  }

  verboseWithContext(context: string, message: string, meta?: unknown) {
    const formatted = meta
      ? `${message} | META: ${JSON.stringify(meta)}`
      : message;

    super.verbose(formatted, context);
  }
}
