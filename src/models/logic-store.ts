import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface LogicItemDataRow
{
    dn: string,
    key: string,
    latest_part: number,
    value: any,
}
export const LogicItemDataMeta = BuildTableMeta<LogicItemDataRow>("logic_item_data", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('id')
            .autogenerateable()
        .field('latest_part')
        .field('dn')
        .field('key')
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