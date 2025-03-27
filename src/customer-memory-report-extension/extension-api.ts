import { logger } from './logger.js';

const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;
const extensionName = 'customer-memory-report-extension';

const EventTypes = {
  Invoke: 'INVOKE',
  Shutdown: 'SHUTDOWN',
};

const next = async ({
  extensionIdentifier,
}: { extensionIdentifier: string }): Promise<{ eventType: string }> => {
  const response = await fetch(`${baseUrl}/event/next`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Lambda-Extension-Identifier': extensionIdentifier || extensionName,
    },
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(
      `Unexpected register response status code: ${response.status}`
    );
  }
  const result = await response.json();
  return result;
};

const register = async () => {
  const data = JSON.stringify({
    events: [EventTypes.Invoke, EventTypes.Shutdown],
  });
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lambda-Extension-Name': extensionName,
      'Content-Length': String(Buffer.byteLength(data)),
    },
    body: data,
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(
      `Unexpected register response status code: ${response.status}`
    );
  }
  const extensionIdentifier = response.headers.get(
    'lambda-extension-identifier'
  );
  if (!extensionIdentifier) {
    throw new Error('Missing extension identifier in response');
  }
  logger.debug('extension identifier obtained successfully', {
    extensionIdentifier,
  });
  return extensionIdentifier;
};

export { EventTypes, next, register };
