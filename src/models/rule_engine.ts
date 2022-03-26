import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface RulesRow
{
    name: string,
    target: string,
    script: string,
    enabled: boolean,
    hash: Buffer,
    date: Date,
}
export const RulesMeta = BuildTableMeta<RulesRow>("rules", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('name')
        .field('target')
        .field('script')
        .field('enabled')
            .from(x => (x === 1))
        .field('hash')
        .field('date')
        ;
})


/*
 *
 */
export interface MarkersRow
{
    name: string,
    shape: string,
    color: string,
    propagate: boolean,
}
export const MarkersMeta = BuildTableMeta<MarkersRow>("markers", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('name')
        .field('shape')
        .field('color')
        .field('propagate')
            .from(x => (x === 1))
        ;
})


/*
 *
 */
export interface RuleItemsRow
{
    id: number,
    rule_name: string,
    dn: string,
    errors: number,
    warnings: number,
    markers: string[] | null,
}
export const RuleItemsMeta = BuildTableMeta<RuleItemsRow>("rule_items", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('id')
            .autogenerateable()
        .key('rule_name')
        .key('dn')
        .field('errors')
        .field('warnings')
        .field('markers')
            .complex()
        ;
})


/*
 *
 */
export interface RuleLogsRow
{
    id: number,
    rule_name: string,
    kind: string,
    msg: any
}
export const RuleLogsMeta = BuildTableMeta<RuleLogsRow>("rule_logs", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('id')
            .autogenerateable()
        .key('rule_name')
        .key('kind')
        .key('msg')
            .complex()
        ;
})


/*
 *
 */
export interface RuleStatusRow
{
    rule_name: string,
    date: Date,
    hash: Buffer,
    error_count: number,
    item_count: number
}
export const RuleStatusMeta = BuildTableMeta<RuleStatusRow>("rule_statuses", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('rule_name')
        .field('date')
        .field('hash')
        .field('error_count')
        .field('item_count')
        ;
})


/*
 *
 */
export interface MarkerItemsRow
{
    id: number,
    marker_name: string,
    dn: string
}
export const MarkerItemsMeta = BuildTableMeta<MarkerItemsRow>("marker_items", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('id')
            .autogenerateable()
        .key('marker_name')
        .key('dn')
        ;
})



/*
 *
 */
export interface RuleEngineAccessors
{
    Rules: DataStoreTableAccessor<RulesRow>,
    Markers: DataStoreTableAccessor<MarkersRow>,
    
    RuleItems: DataStoreTableAccessor<RuleItemsRow>,
    RuleLogs: DataStoreTableAccessor<RuleLogsRow>,
    MarkerItems: DataStoreTableAccessor<MarkerItemsRow>,
    
    RuleStatuses: DataStoreTableAccessor<RuleStatusRow>
}

export function prepareRuleEngine(dataStore : DataStore) : RuleEngineAccessors
{
    return {
        Rules: RulesMeta.prepare(dataStore),
        Markers: MarkersMeta.prepare(dataStore),

        RuleItems: RuleItemsMeta.prepare(dataStore),
        RuleLogs: RuleLogsMeta.prepare(dataStore),
        MarkerItems: MarkerItemsMeta.prepare(dataStore),

        RuleStatuses: RuleStatusMeta.prepare(dataStore),
    }
}