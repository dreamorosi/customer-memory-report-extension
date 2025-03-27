#!/usr/bin/env node
// The #!/usr/bin/env node above is required for Lambda to run this extension.

import { register, next, EventTypes } from './extension-api.js';
import {
  registerTelemetry,
  startServer,
  waitForPlatformDoneEvent,
  shutDownServer,
} from './telemetry-server.js';
import { logger } from './logger.js';

const extensionIdentifier = await register();
logger.appendPersistentKeys({ extensionIdentifier });

startServer();
logger.debug('started extension server');

await registerTelemetry({ extensionIdentifier });
logger.debug('registered telemetry endpoint');

while (true) {
  logger.debug('calling next');
  const event = await next({ extensionIdentifier });

  // We await for the event emitter in the telemetry server to emit the event
  // to let us know that the request has completed.
  await waitForPlatformDoneEvent();

  // The next call to the `.next` lambda know that my extension is done executing
  logger.debug('extension complete', { type: event.eventType });

  // Use this event to do cleanup if needed
  if (event.eventType === EventTypes.Shutdown) {
    await shutDownServer();
  }
}
