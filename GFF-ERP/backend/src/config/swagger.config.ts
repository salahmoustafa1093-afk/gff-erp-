import { registerAs } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
  title: string;
  description: string;
  version: string;
  contactName: string;
  contactEmail: string;
  contactUrl: string;
  licenseName: string;
  licenseUrl: string;
  termsOfService: string;
  tagSorter: string;
  persistAuthorization: boolean;
}

export default registerAs(
  'swagger',
  (): SwaggerConfig => ({
    enabled: process.env.SWAGGER_ENABLED !== 'false', // Default true
    path: process.env.SWAGGER_PATH || 'api/docs',
    title: process.env.SWAGGER_TITLE || 'GFF ERP API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'GFF ERP Enterprise - Feed Manufacturing & Poultry Management System API Documentation',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    contactName: process.env.SWAGGER_CONTACT_NAME || 'GFF IT Support',
    contactEmail: process.env.SWAGGER_CONTACT_EMAIL || 'support@gff-erp.com',
    contactUrl: process.env.SWAGGER_CONTACT_URL || 'https://gff-erp.com',
    licenseName: process.env.SWAGGER_LICENSE_NAME || 'Proprietary',
    licenseUrl:
      process.env.SWAGGER_LICENSE_URL || 'https://gff-erp.com/license',
    termsOfService:
      process.env.SWAGGER_TERMS || 'https://gff-erp.com/terms',
    tagSorter: process.env.SWAGGER_TAG_SORTER || 'alpha',
    persistAuthorization: true,
  }),
);

/**
 * Build Swagger document from configuration.
 */
export function buildSwaggerDocument(
  config: SwaggerConfig,
): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .setContact(
      config.contactName,
      config.contactUrl,
      config.contactEmail,
    )
    .setLicense(config.licenseName, config.licenseUrl)
    .setTermsOfService(config.termsOfService)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter refresh token',
        in: 'header',
      },
      'refresh-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-branch-id',
        description: 'Branch ID for multi-tenancy',
        in: 'header',
      },
      'branch-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        description: 'API key for external integrations',
        in: 'header',
      },
      'api-key',
    )
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Roles', 'Role management')
    .addTag('Permissions', 'Permission management')
    .addTag('Branches', 'Branch management')
    .addTag('Warehouses', 'Warehouse management')
    .addTag('Inventory', 'Inventory management')
    .addTag('Products', 'Product management')
    .addTag('Categories', 'Product categories')
    .addTag('Brands', 'Product brands')
    .addTag('Units', 'Measurement units')
    .addTag('Sales', 'Sales operations')
    .addTag('Sales Returns', 'Sales returns management')
    .addTag('Customers', 'Customer management')
    .addTag('Suppliers', 'Supplier management')
    .addTag('Purchases', 'Purchase operations')
    .addTag('Purchase Returns', 'Purchase returns management')
    .addTag('Treasury', 'Treasury and cash management')
    .addTag('Banks', 'Bank account management')
    .addTag('Cashboxes', 'Cashbox management')
    .addTag('Accounting', 'Accounting operations')
    .addTag('Chart of Accounts', 'Chart of accounts management')
    .addTag('Journal Entries', 'Journal entry management')
    .addTag('General Ledger', 'General ledger reports')
    .addTag('Cost Centers', 'Cost center management')
    .addTag('Fixed Assets', 'Fixed asset management')
    .addTag('HR', 'Human resources')
    .addTag('Employees', 'Employee management')
    .addTag('Attendance', 'Attendance tracking')
    .addTag('Payroll', 'Payroll management')
    .addTag('CRM', 'Customer relationship management')
    .addTag('Leads', 'Lead management')
    .addTag('Activities', 'Activity tracking')
    .addTag('Logistics', 'Logistics management')
    .addTag('Vehicles', 'Vehicle fleet management')
    .addTag('Drivers', 'Driver management')
    .addTag('Trips', 'Trip and route management')
    .addTag('Production', 'Production management')
    .addTag('Feed Formulation', 'Feed formula management')
    .addTag('Manufacturing', 'Manufacturing orders')
    .addTag('Poultry', 'Poultry management')
    .addTag('Chicks', 'Chicks management')
    .addTag('Eggs', 'Egg production tracking')
    .addTag('Reports', 'Reports and analytics')
    .addTag('Dashboards', 'Dashboard widgets')
    .addTag('Audit Log', 'Audit trail')
    .addTag('Notifications', 'Notification management')
    .addTag('Settings', 'System settings')
    .build();
}
