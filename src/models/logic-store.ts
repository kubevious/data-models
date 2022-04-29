import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface LogicItemDataRow
{
    dn: string,
    key: string,
    value: any,
}
export const LogicItemDataMeta = BuildTableMeta<LogicItemDataRow>("logic_item_data", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('dn')
        .key('key')
        .field('value')
        ;
})



/*
 *
 */
export interface LogicStoreAccessors
{
    LogicItemData: DataStoreTableAccessor<LogicItemDataRow>
}

export function prepareLogicStore(dataStore : DataStore) : LogicStoreAccessors
{
    return {
        LogicItemData: LogicItemDataMeta.prepare(dataStore)
    }
}