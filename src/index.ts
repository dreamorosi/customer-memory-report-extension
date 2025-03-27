import { LogFormatter, Logger, LogItem } from '@aws-lambda-powertools/logger';
import type {
  LogAttributes,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/types';
import type { Context } from 'aws-lambda';

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

const logger = new Logger({
  logFormatter: new CustomFormatter(),
});

export const handler = async (
  event: { customerId: string },
  context: Context
) => {
  logger.info('hello', {
    requestId: context.awsRequestId,
    customerId: '1234',
  });
};
