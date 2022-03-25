import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface ConfigRow
{
    key: string,
    value: any,
}
export const ConfigMeta = BuildTableMeta<ConfigRow>("config", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('key')
        .field('value')
        ;
})


/*
 *
 */
export interface ConfigAccessors
{
    Config: DataStoreTableAccessor<ConfigRow>,
}

export function prepareRuleEngine(dataStore : DataStore) : ConfigAccessors
{
    return {
        Config: ConfigMeta.prepare(dataStore),
    }
}