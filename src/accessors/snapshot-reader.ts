import _ from 'the-lodash';
import { ILogger } from "the-logger";
import { ITableAccessor } from "@kubevious/easy-data-store";
import { FilterOptions } from '@kubevious/easy-data-store/dist/driver';
import { SnapItemsRow, SnapshotsAccessors, SnapshotsRow } from '../models/snapshots';
import { UuidUtils } from '../';
import { MyPromise } from 'the-promise';

interface SnapshotScopeFilter
{
    part: number,
    snapshot_id: Buffer,
}

export class SnapshotReader
{
    private _snapshotsAccessors : SnapshotsAccessors;
    private _logger: ILogger;
    private _snapshotId: Buffer;
    private _snapshotPartitionId: number;
    private _dataStore: ITableAccessor;

    private _snapshotRow? : Partial<SnapshotsRow> | null = null;

    private _isDiffSnapshot = false;
    private _baseSnapshotScope?: SnapshotScopeFilter;
    private _diffSnapshotScope?: SnapshotScopeFilter;

    constructor(logger: ILogger, snapshotsAccessors : SnapshotsAccessors, dataStore: ITableAccessor, snapshotId: Buffer)
    {
        this._logger = logger;
        this._snapshotsAccessors = snapshotsAccessors;

        this._snapshotId = snapshotId;
        this._dataStore = dataStore;

        if (!this._snapshotId) {
            throw new Error('Missing SnapshotId');
        }

        this._snapshotPartitionId = UuidUtils.getPartFromDatedUUIDBuf(this._snapshotId);
    }

    queryNode(dn : string)
    {
        return this._queryConfig({
            dn: dn, 
            config_kind: 'node'
        })
    }

    queryChildren(dn : string)
    {
        return this._queryConfig({
            dn: dn, 
            config_kind: 'children'
        })
    }

    queryProperties(dn : string)
    {
        return this._queryConfigs({
            dn: dn, 
            config_kind: 'props'
        })
    }

    querySelfAlerts(dn : string)
    {
        return this._queryConfig({
            dn: dn, 
            config_kind: 'alerts'
        })
        .then(result => {
            if (!result) {
                return [];
            }
            return result;
        })
    }

    queryAlerts(dn : string)
    {
        return this._prepare()
            .then(() => {
                if (!this._isReady()) {
                    return [];
                }
                return this._querySnapConfigHash({
                    config_kind: 'alerts'
                }, {
                    fields: [{
                        name: 'dn',
                        operator: 'LIKE',
                        value: `${dn}%`
                    }]
                })
                .then(hashes => {
                    const alerts : any[] = [];
                    return MyPromise.serial(hashes, x => {
                        return this._queryConfigData(x.hash)
                            .then(config => {
                                for(const alert of config)
                                {
                                    const myAlert = _.clone(alert);
                                    myAlert.dn = x.dn;
                                    alerts.push(myAlert);
                                }
                            })
                    })
                    .then(() => alerts);
                })
            })
    }

    private _queryConfig(filter: Record<string, any>) : Promise<any>
    {
        this._logger.silly("[queryConfig] ...");
        return this._queryConfigs(filter)
            .then(results => {
                if (results.length == 0) {
                    return null;
                }
                return _.head(results);
            })
    }

    private _queryConfigs(filter: Record<string, any>) : Promise<any[]>
    {
        return this._prepare()
            .then(() => {
                if (!this._isReady()) {
                    return [];
                }
                return this._querySnapConfigHash(filter, {})
                    .then(hashes => {
                        // this._logger.info("[_queryConfig] RESULT: ", hashes);
                        return MyPromise.serial(hashes, x => this._queryConfigData(x.hash))
                            .then(values => values.map(x => x));
                    })
            })
    }

    private _isReady()
    {
        if (!this._baseSnapshotScope) {
            return false;
        }
        if (this._isDiffSnapshot) {
            if (!this._diffSnapshotScope) {
                return false;
            }
        }
        return true;
    }

    private _prepare()
    {
        return this._querySnapshot()
            .then(() => {
                if (!this._snapshotRow) {
                    return;
                }

                if (this._snapshotRow.base_snapshot_id) {
                    if (Buffer.compare(this._snapshotRow.base_snapshot_id!, this._snapshotRow.snapshot_id!) === 0) {
                        this._isDiffSnapshot = false;
                    } else {
                        this._isDiffSnapshot = true;
                    }
                } else {
                    this._isDiffSnapshot = false;
                }

                if (this._isDiffSnapshot) {
                    this._diffSnapshotScope = this._makeSnapshotScopeFilter(this._snapshotId);
                    return this._queryBaseSnapshot()
                } else {
                    this._baseSnapshotScope = this._makeSnapshotScopeFilter(this._snapshotId);
                }
            })
    }

    private _querySnapshot()
    {
        this._logger.silly("[_querySnapshot] ...");

        return this._dataStore.table(this._snapshotsAccessors.Snapshots)
            .queryOne({
                part: UuidUtils.getPartFromDatedUUIDBuf(this._snapshotId),
                snapshot_id: this._snapshotId
            }, { 
                fields: { fields: ['snapshot_id', 'base_snapshot_id'] }
            })
            .then(result => {
                this._snapshotRow = result; // <DBSnapshotRow>result;
                // this._logger.info("SNAPSHOT ROW: ", this._snapshotRow);
            })
    }

    private _queryBaseSnapshot()
    {
        const baseSnapshotId = this._snapshotRow!.base_snapshot_id!;
        this._baseSnapshotScope = this._makeSnapshotScopeFilter(baseSnapshotId);
    }

    private _makeSnapshotScopeFilter(snapshotId: Buffer) : SnapshotScopeFilter
    {
        return {
            part: UuidUtils.getPartFromDatedUUIDBuf(snapshotId),
            snapshot_id: snapshotId
        };
    }

    private _querySnapConfigHash(filter: Record<string, any>, customFilters: FilterOptions) : Promise<HashWithDn[]>
    {
        // this._logger.info("[_querySnapConfigHash] begin ", filter);

        return this._querySnapItemHash(filter, customFilters)
            .then(configDict => {
                if (this._isDiffSnapshot) {
                    return this._queryDiffItemHash(filter, customFilters, configDict);
                }
                return configDict;
            })
            .then(configDict => {
                // this._logger.info("[_querySnapConfigHash] configDict: ", configDict);
                return _.values(configDict);
            });
    }

    private _querySnapItemHash(filter: Record<string, any>, customFilters: FilterOptions) : Promise<ItemHashDict>
    {
        // this._logger.info("[_querySnapItemHash] begin ", filter);
        return this._dataStore!.table(this._snapshotsAccessors.SnapItems)
            .queryMany({
                ...this._baseSnapshotScope!,
                ...filter
            }, {
                fields: { fields: ['dn', 'config_kind', 'name', 'config_hash'] },
                filters: customFilters
            })
            .then(results => {
                const dict : ItemHashDict = {};
                for(const row of results)
                {
                    const key = makeKey(row);
                    dict[key] = {
                        dn: row.dn!,
                        hash: row.config_hash!
                    }
                }
                return dict;
            })
    }

    private _queryDiffItemHash(filter: Record<string, any>, customFilters: FilterOptions, baseDict: ItemHashDict) : Promise<ItemHashDict>
    {
        // this._logger.info("[_queryDiffItemHash] begin ", filter);

        return this._dataStore!.table(this._snapshotsAccessors.DiffItems)
            .queryMany({
                ...this._diffSnapshotScope!,
                ...filter
            }, {
                fields: { fields: ['dn', 'config_kind', 'name', 'config_hash', 'present'] },
                filters: customFilters
            })
            .then(results => {
                // this._logger.info("[_queryDiffItemHash] RESULT: ", result);

                for(const row of results)
                {
                    const key = makeKey(row);
                    if (row.present) {
                        baseDict[key] = {
                            dn: row.dn!,
                            hash: row.config_hash!
                        }
                    } else {
                        delete baseDict[key];
                    }
                }

                return baseDict;
            })
    }

    private _queryConfigData(hash: Buffer)
    {
        // this._logger.info("[_queryConfig] begin ", hash);

        return this._dataStore.table(this._snapshotsAccessors.SnapshotConfigs)
            .queryOne({
                part: this._snapshotPartitionId,
                hash: hash
            }, {
                fields: { fields: ['value'] }
            })
            .then(result => {
                // this._logger.info("[_queryConfig] RESULT: ", result);
                if (!result) {
                    return null;
                }

                return result.value;
            })
    }
}

interface HashWithDn {
    hash: Buffer,
    dn: string
}

type ItemHashDict = Record<string, HashWithDn>;

function makeKey(row: Partial<SnapItemsRow>)
{
    const parts = [row.dn!, row.config_kind!];
    if (row.name) {
        parts.push(row.name)
    }
    return parts.join("_");
}