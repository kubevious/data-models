import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = 'kubevious';


export interface SnapshotsRow
{
    part: number,
    snapshot_id: Buffer,
    date: Date,
    base_snapshot_id?: Buffer,
    prev_snapshot_id?: Buffer,
    summary: any
}
export const SnapshotsMeta = BuildTableMeta<SnapshotsRow>("snapshots", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('part')
            .key('snapshot_id')
            .field('date')
            .field('base_snapshot_id')
            .field('prev_snapshot_id')
            .field('summary')
            ;
    }
)


export interface SnapshotConfigsRow
{
    part: number,
    hash: Buffer,
    value: any
}
export const SnapshotConfigsMeta = BuildTableMeta<SnapshotConfigsRow>("snapshot_configs", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('part')
            .key('hash')
            .field('value')
            ;
    }
)

export interface SnapItemsRow
{
    part: number,
    snapshot_id: Buffer,
    dn: string,
    kind: string,
    config_kind: string,
    name: string,
    config_hash: Buffer
}
export const SnapItemsMeta = BuildTableMeta<SnapItemsRow>("snap_items", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('id')
                .autogenerateable()
            .field('part')
            .field('snapshot_id')
            .field('dn')
            .field('kind')
            .field('config_kind')
            .field('name')
            .field('config_hash')
            ;
    }
)


export interface DiffItemsRow
{
    part: number,
    snapshot_id: Buffer,
    dn: string,
    kind: string,
    config_kind: string,
    name: string,
    present: boolean,
    config_hash: Buffer
}
export const DiffItemsMeta = BuildTableMeta<DiffItemsRow>("diff_items", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('id')
                .autogenerateable()
            .field('part')
            .field('snapshot_id')
            .field('dn')
            .field('kind')
            .field('config_kind')
            .field('name')
            .field('present')
            .field('config_hash')
            ;
    }
)


export interface DeltaItemsRow
{
    part: number,
    snapshot_id: Buffer,
    dn: string,
    kind: string,
    config_kind: string,
    name: string,
    present: boolean,
    config_hash: Buffer
}
export const DeltaItemsMeta = BuildTableMeta<DeltaItemsRow>("delta_items", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('id')
                .autogenerateable()
            .field('part')
            .field('snapshot_id')
            .field('dn')
            .field('kind')
            .field('config_kind')
            .field('name')
            .field('present')
            .field('config_hash')
            ;
    }
)


export interface TimelineRow
{
    part: number,
    snapshot_id: Buffer,
    date: Date,
    changes: number,
    error: number,
    warn: number,
}
export const TimelineMeta = BuildTableMeta<TimelineRow>("timeline", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('id')
                .autogenerateable()
            .field('part')
            .field('snapshot_id')
            .field('date')
            .field('changes')
            .field('error')
            .field('warn')
            ;
    }
)


export interface ClusterLatestSnapshotRow
{
    snapshot_id: Buffer,
    date: Date
}
export const ClusterLatestSnapshotMeta = BuildTableMeta<ClusterLatestSnapshotRow>("cluster_latest_snapshot", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .field('snapshot_id')
            .field('date')
            ;
    }
)


export interface SnapshotsAccessors
{
    Snapshots: DataStoreTableAccessor<SnapshotsRow>,
    SnapshotConfigs: DataStoreTableAccessor<SnapshotConfigsRow>,
    SnapItems: DataStoreTableAccessor<SnapItemsRow>,
    DiffItems: DataStoreTableAccessor<DiffItemsRow>,
    DeltaItems: DataStoreTableAccessor<DeltaItemsRow>,
    Timeline: DataStoreTableAccessor<TimelineRow>,
    ClusterLatestSnapshot: DataStoreTableAccessor<ClusterLatestSnapshotRow>,
}

export function prepareSnapshots(dataStore : DataStore): SnapshotsAccessors
{
    return {
        Snapshots: SnapshotsMeta.prepare(dataStore),
        SnapshotConfigs : SnapshotConfigsMeta.prepare(dataStore),
        SnapItems: SnapItemsMeta.prepare(dataStore),
        DiffItems: DiffItemsMeta.prepare(dataStore),
        DeltaItems: DeltaItemsMeta.prepare(dataStore),
        Timeline: TimelineMeta.prepare(dataStore),
        ClusterLatestSnapshot: ClusterLatestSnapshotMeta.prepare(dataStore)
    }
}