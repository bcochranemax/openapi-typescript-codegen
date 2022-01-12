import { resolve } from 'path';

import type { Service } from '../client/interfaces/Service';
import { HttpClient } from '../HttpClient';
import { writeFile } from './fileSystem';
import { format } from './format';
import { getHttpRequestName } from './getHttpRequestName';
import { Templates } from './registerHandlebarTemplates';
import camelCase from "camelcase";
import camelcase from "camelcase";

const VERSION_TEMPLATE_STRING = 'OpenAPI.VERSION';

/**
 * Generate Services using the Handlebar template and write to disk.
 * @param services Array of Services to write
 * @param templates The loaded handlebar templates
 * @param outputPath Directory to write the generated files to
 * @param httpClient The selected httpClient (fetch, xhr, node or axios)
 * @param useUnionTypes Use union types instead of enums
 * @param useOptions Use options or arguments functions
 * @param postfix: Service name postfix
 * @param exportClient Create client class
 * @param clientName Create client class
 */
export async function writeClientHooks(
    services: Service[],
    templates: Templates,
    outputPath: string,
    httpClient: HttpClient,
    useUnionTypes: boolean,
    useOptions: boolean,
    postfix: string,
    exportClient: boolean,
    clientName: string
): Promise<void> {
    const contextFile = resolve(outputPath, `context.ts`);
    const contextTemplateResult = templates.exports.context({
        clientName,
        useOptions,
    });
    await writeFile(contextFile, format(contextTemplateResult));

    for (const service of services) {
        const file = resolve(outputPath, `use${service.name}${postfix}.ts`);
        const useVersion = service.operations.some(operation => operation.path.includes(VERSION_TEMPLATE_STRING));
        const templateResult = templates.exports.hooks({
            ...service,
            shortName: camelcase(service.name),
            clientName,
            httpClient,
            useUnionTypes,
            useVersion,
            useOptions,
            postfix,
            exportClient,
            httpClientRequest: getHttpRequestName(httpClient),
        });

        await writeFile(file, format(templateResult));
    }
}
