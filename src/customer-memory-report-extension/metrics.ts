import { Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  serviceName:
    process.env.CUSTOMER_MEMORY_REPORT_METRIC_SERVICE_NAME ||
    'CustomerMemoryReportService',
  namespace:
    process.env.CUSTOMER_MEMORY_REPORT_METRIC_NAMESPACE ||
    'CustomerMemoryReport',
});

const dimensionName =
  process.env.CUSTOMER_MEMORY_REPORT_METRIC_DIMENSION_NAME || 'CustomerId';
const metricName =
  process.env.CUSTOMER_MEMORY_REPORT_METRIC_NAME || 'CustomerMemoryUsage';

const emitMetricIfEnabled = ({
  customerId,
  memoryUsage,
}: {
  customerId: string;
  memoryUsage: number;
}) => {
  if (process.env.CUSTOMER_MEMORY_REPORT_METRIC_ENABLED !== 'true') {
    return;
  }

  metrics.addDimension(dimensionName, customerId);
  metrics.addMetric(metricName, 'Megabytes', memoryUsage);
  metrics.publishStoredMetrics();
};

export { metrics, emitMetricIfEnabled };
