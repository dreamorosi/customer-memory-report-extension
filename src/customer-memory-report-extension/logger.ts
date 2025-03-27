import { LogFormatter, Logger, LogItem } from '@aws-lambda-powertools/logger';
import type {
  LogAttributes,
  LogLevel,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/types';

class CustomFormatter extends LogFormatter {
  formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ) {
    return new LogItem({
      attributes: {
        message: attributes.message,
        logLevel: attributes.logLevel,
        timestamp: this.formatTimestamp(attributes.timestamp),
      },
    }).addAttributes(additionalLogAttributes);
  }
}

export const logger = new Logger({
  serviceName:
    process.env.CUSTOMER_MEMORY_REPORT_SERVICE_NAME || 'customer-memory-report',
  logLevel:
    (process.env.CUSTOMER_MEMORY_REPORT_LOG_LEVEL as LogLevel) || 'INFO',
  logFormatter: new CustomFormatter(),
});
