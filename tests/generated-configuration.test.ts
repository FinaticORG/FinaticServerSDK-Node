import { Configuration, ConfigurationParameters } from '../src/openapi/configuration';

describe('generated Configuration', () => {
  it('omits optional properties when their constructor values are omitted', () => {
    const configuration = new Configuration();
    const optionalProperties: Array<keyof ConfigurationParameters> = [
      'apiKey',
      'username',
      'password',
      'accessToken',
      'awsv4',
      'basePath',
      'serverIndex',
      'formDataCtor',
    ];

    for (const property of optionalProperties) {
      expect(Object.prototype.hasOwnProperty.call(configuration, property)).toBe(false);
    }

    expect(configuration.baseOptions).toEqual({ headers: {} });
  });

  it('preserves supplied configuration values', () => {
    class FormDataStub {}

    const parameters: ConfigurationParameters = {
      apiKey: 'api-key',
      username: 'user',
      password: 'password',
      accessToken: 'access-token',
      awsv4: {
        options: { region: 'us-east-1', service: 'execute-api' },
        credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
      },
      basePath: 'https://api.example.com',
      serverIndex: 2,
      baseOptions: { timeout: 1000, headers: { 'x-test': 'value' } },
      formDataCtor: FormDataStub,
    };

    const configuration = new Configuration(parameters);

    expect(configuration.apiKey).toBe(parameters.apiKey);
    expect(configuration.username).toBe(parameters.username);
    expect(configuration.password).toBe(parameters.password);
    expect(configuration.accessToken).toBe(parameters.accessToken);
    expect(configuration.awsv4).toBe(parameters.awsv4);
    expect(configuration.basePath).toBe(parameters.basePath);
    expect(configuration.serverIndex).toBe(parameters.serverIndex);
    expect(configuration.baseOptions).toEqual(parameters.baseOptions);
    expect(configuration.formDataCtor).toBe(FormDataStub);
  });
});
