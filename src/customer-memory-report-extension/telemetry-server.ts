import http, { type Server } from 'node:http';
import { EventEmitter } from 'node:events';
import { logger } from './logger.js';
import { emitMetricIfEnabled } from './metrics.js';

const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2022-07-01/telemetry`;
const eventTypes = ['platform', 'function'];
const sandboxHostname = 'sandbox';
const telemetryEventEmitter = new EventEmitter();
const completeEvent = 'telemetry-complete';
let server: Server;
const requestBag = new Map();

const startServer = () => {
  server = http
    .createServer((request, response) => {
      if (request.method !== 'POST')
        throw new Error('Unexpected request method');

      let body = '';
      request.on('data', (data) => {
        body += data;
      });
      request.on('end', () => {
        response.writeHead(200, {});
        response.end('OK');
        const data = JSON.parse(body);

        for (const event of data) {
          if (event.type === 'function') {
            try {
              const log = JSON.parse(event.record);
              const { requestId, customerId, message } = log;
              if (message !== 'customer-memory-report') {
                continue;
              }
              if (!requestBag.has(requestId)) {
                requestBag.set(requestId, {
                  customerId,
                });
              }
            } catch (error) {
              logger.debug('error parsing function event', { event, error });
              continue;
            }
          }
          if (event.type === 'platform.report') {
            try {
              const log = event.record;
              const {
                requestId,
                metrics: { maxMemoryUsedMB },
              } = log;
              const request = requestBag.get(requestId);
              if (request) {
                logger.debug('found request in bag', { request });
                logger.info({
                  message: 'Customer memory report',
                  requestId,
                  customerId: request.customerId,
                  maxMemoryUsedMB,
                });
                emitMetricIfEnabled({
                  customerId: request.customerId,
                  memoryUsage: maxMemoryUsedMB,
                });
                requestBag.delete(requestId);
              }
            } catch (error) {
              logger.error('Error parsing platform.report event', {
                error,
                event,
              });
            }
          }
          if (event.type === 'platform.runtimeDone') {
            telemetryEventEmitter.emit(completeEvent);
            break;
          }
        }
      });
    })
    .listen(4243, sandboxHostname);
};

const registerTelemetry = async ({
  extensionIdentifier,
}: { extensionIdentifier: string }) => {
  const data = JSON.stringify({
    destination: {
      protocol: 'HTTP',
      URI: `http://${sandboxHostname}:4243`,
    },
    types: eventTypes,
    buffering: { timeoutMs: 25, maxBytes: 262144, maxItems: 1000 },
    schemaVersion: '2022-07-01',
  });
  const res = await fetch(baseUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Lambda-Extension-Identifier': extensionIdentifier,
      'Content-Length': String(Buffer.byteLength(data)),
    },
    body: data,
    keepalive: true,
  });
  if (!res.ok) {
    throw new Error(
      `Unexpected logs subscribe response status code: ${res.status}`
    );
  }
};

const waitForPlatformDoneEvent = async () =>
  new Promise((resolve) => {
    telemetryEventEmitter.on(completeEvent, resolve);
  });

const shutDownServer = () =>
  new Promise((resolve) => {
    server.close(resolve);
  });

export {
  registerTelemetry,
  startServer,
  shutDownServer,
  waitForPlatformDoneEvent,
};
