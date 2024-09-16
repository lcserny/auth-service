import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import * as path from 'node:path';

const YAML_CONFIG_FILENAME = 'config/config.yaml';

export default () => {
    // careful, path is relative to project root
    return yaml.load(readFileSync(path.join(require.main!.path, YAML_CONFIG_FILENAME), 'utf8')) as Record<string, any>;
};
