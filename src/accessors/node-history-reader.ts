import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { BufferUtils } from '../utils/buffer-utils';
import { ITableAccessor } from '@kubevious/easy-data-store';
import { DeltaItemsRow, SnapshotsAccessors } from '../models/snapshots';
import { HistoryNodeResult, HistoryNodeEntry, HistoryHierarchyResult, HistoryHierarchyEntry, HistoryNodeEntryChanges, HistoryHierarchyNodeEntry } from '@kubevious/ui-middleware/dist/services/history/types';
import { ExecutionLimiter, ExecutionLimiterItem } from '@kubevious/helper-backend/dist/execution-limiter';

import { PaginationTokenData, PaginationUtils } from '../utils/pagination-utils';
import { PartitionUtils } from '../utils/partition-utils';
import { MyPromise } from 'the-promise';

export class NodeHistoryReader
{
    private _logger : ILogger;
    private _dataStore : ITableAccessor;
    private _snapshotsAccessor: SnapshotsAccessors;
    private _dn : string;

    private _currentPartId : number;
    private _lowestPartId : number;

    private _limiter : ExecutionLimiterItem;

    private _snapshotDetails : Record<string, SnapshotDetails> = {}
    private _pendingSnapshotDetails : Record<string, SnapshotDetails> = {}
    private _configHashes : Record<string, ConfigHashDetails> = {};
    private _pendingConfigHashes : Record<string, ConfigHashDetails> = {};

    private _nextTokenData : PaginationTokenData | null = null;
    
    constructor(logger : ILogger,
                dataStore: ITableAccessor,
                snapshotsAccessor: SnapshotsAccessors,
                executionLimiter: ExecutionLimiter,
                dn: string,
                token?: string)
    {
        this._logger = logger.sublogger('NodeHistoryReader');
        this._dataStore = dataStore;
        this._snapshotsAccessor = snapshotsAccessor;
        this._dn = dn;

        this._limiter = executionLimiter.create();

        this._lowestPartId = PartitionUtils.getRelativePartitionId(15);

        if (token)
        {
            const tokenData = <{ part: number }>PaginationUtils.parseTokenData(token!);
            this._logger.info("[constructor] tokenData: ", tokenData);

            this._currentPartId = tokenData.part;
        }
        else
        {
            this._currentPartId = PartitionUtils.getRelativePartitionId(0);
        }

        this._logger.info("[constructor] _currentPartId: %s", this._currentPartId);
    }

    queryNode() : Promise<HistoryNodeResult>
    {
        return Promise.resolve()
            .then(() => this._processNextNodePartition())
            .then(() => {
                const result = this._buildNodeResult();
                return result;
            });
    }

    queryHierarchy() : Promise<HistoryHierarchyResult>
    {
        return Promise.resolve()
            .then(() => this._processNextHierarchyPartition())
            .then(() => {
                const result = this._buildHierarchyResult();
                return result;
            });
    }

    private _processNextNodePartition() : Promise<void>
    {
        this._logger.debug("[_processNextNodePartition] _currentPartId: %s", this._currentPartId);

        if (this._limiter.shouldStop()) {
            this._logger.warn("[_processNextNodePartition] limiter says stop.");
            this._nextTokenData = {
                part: this._currentPartId
            }
            return Promise.resolve();
        }

        if (this._currentPartId < this._lowestPartId) {
            return Promise.resolve();
        }

        return Promise.resolve()
            .then(() => this._queryNodeDeltaItems())
            .then(() => this._querySnapshots())
            .then(() => this._queryConfigHashes())
            .then(() => {
                this._currentPartId--;
                return this._processNextNodePartition();
            })
    }

    private _processNextHierarchyPartition() : Promise<void>
    {
        this._logger.info("[_processNextHierarchyPartition] _currentPartId: %s", this._currentPartId);

        if (this._limiter.shouldStop()) {
            this._logger.info("[_processNextHierarchyPartition] limiter says stop.");
            this._nextTokenData = {
                part: this._currentPartId
            }
            return Promise.resolve();
        }

        if (this._currentPartId < this._lowestPartId) {
            return Promise.resolve();
        }

        return Promise.resolve()
            .then(() => this._queryHierarchyDeltaItems())
            .then(() => this._querySnapshots())
            .then(() => this._queryConfigHashes())
            .then(() => {
                this._currentPartId--;
                return this._processNextNodePartition();
            })
    }

    private _queryNodeDeltaItems()
    {
        const partId = this._currentPartId;

        this._logger.verbose("[_queryNodeDeltaItems] partId: %s", partId);

        return this._dataStore.table(this._snapshotsAccessor.DeltaItems)
            .queryMany(
                { 
                    dn: this._dn,
                    part: partId
                },
                {
                    fields : { 
                        fields: [
                            'snapshot_id',
                            'config_kind',
                            'name',
                            'present',
                            'config_hash'
                        ]
                    }
                }
            )
            .then(results => {
                this._logger.verbose("[_queryNodeDeltaItems] partId: %s, result count: %s,", partId, results.length);

                this._limiter.addItems(results.length);

                for(const x of results) {
                    const snapshotInfo = this._processDiff(this._dn, partId, x, x.present!);
                    snapshotInfo.isDiff = true;
                }
            });
    }

    private _queryHierarchyDeltaItems()
    {
        const partId = this._currentPartId;
        this._logger.verbose("[_queryHierarchyDeltaItems] partId: %s", partId);

        return this._dataStore.table(this._snapshotsAccessor.DeltaItems)
            .queryMany(
                { 
                    part: partId
                }, 
                {
                    filters: {
                        fields: [{
                            name: 'dn',
                            operator: 'LIKE',
                            value: `${this._dn}%`
                        }]
                    },
                    fields : { 
                        fields: [
                            'dn',
                            'snapshot_id',
                            'config_kind',
                            'name',
                            'present',
                            'config_hash'
                        ]
                    }
                }
            )
            .then(results => {
                this._logger.verbose("[_queryHierarchyDeltaItems] partId: %s, result count: %s,", partId, results.length);

                this._limiter.addItems(results.length);

                for(const x of results) {
                    const snapshotInfo = this._processDiff(x.dn!, partId, x, x.present!);
                    snapshotInfo.isDiff = true;
                }
            });
    }

    private _processDiff(dn: string, part: number, row: Partial<DeltaItemsRow>, isPresent: boolean)
    {
        const snapshotInfo = this._getSnapshotDetails(row.snapshot_id!, part);
        const id = this._configId(row.config_kind!, row.name);

        let config : ConfigHashDetails | null = null;
        if (isPresent)
        {
            if (row.config_kind == 'node') {
                config = this._getConfigHashDetails(row.config_hash!, part);
            }
        }

        if (!snapshotInfo.nodes[dn]) {
            snapshotInfo.nodes[dn] = { 
                dn: dn,
                configs: {} 
            };
        }

        snapshotInfo.nodes[dn].configs[id] = {
            config_kind: row.config_kind!,
            name: row.name,
            present: isPresent,
            config: config
        }
        return snapshotInfo;
    }

    private _querySnapshots()
    {
        this._logger.verbose("[_querySnapshots] count: %s", _.values(this._pendingSnapshotDetails).length);

        return MyPromise.execute(_.values(this._pendingSnapshotDetails), x => this._queryShapshot(x))
    }

    private _queryShapshot(snapshot: SnapshotDetails)
    {
        return this._dataStore.table(this._snapshotsAccessor.Snapshots)
            .queryOne({ part: snapshot.part, snapshot_id: snapshot.snapshotId }, {
                fields : { 
                    fields: [
                        'date'
                    ]
                }
            })
            .then(result => {
                if (result) {
                    snapshot.date = new Date(result.date!).toISOString()
                }
                delete this._pendingSnapshotDetails[snapshot.key];
            });
    }

    private _queryConfigHashes()
    {
        this._logger.verbose("[_queryConfigHashes] count: %s", _.values(this._pendingConfigHashes).length);

        return MyPromise.execute(_.values(this._pendingConfigHashes), x => this._queryDetails(x))
    }

    private _queryDetails(details: ConfigHashDetails)
    {
        return this._dataStore.table(this._snapshotsAccessor.SnapshotConfigs)
            .queryOne({ part: details.part, hash: details.config_hash }, {
                fields : { 
                    fields: [
                        'value'
                    ]
                }
            })
            .then(result => {
                if (result) {
                    details.config = result.value!;
                }
                delete this._pendingConfigHashes[details.key];
            });
    }

    private _getSnapshotDetails(snapshotId: Buffer, part: number)
    {
        const key = BufferUtils.toStr(snapshotId);
        let value = this._snapshotDetails[key];
        if (value) {
            return value;
        }
        value = {
            key: key,
            snapshotId: snapshotId,
            snapshotIdStr: key,
            part: part,
            nodes: {}
        }
        this._snapshotDetails[key] = value;
        this._pendingSnapshotDetails[key] = value;
        return value;
    }

    private _getConfigHashDetails(configHash: Buffer, part: number)
    {
        const key = BufferUtils.toStr(configHash);
        let details = this._configHashes[key];
        if (!details) {
            details = {
                key: key,
                part: part,
                config_hash: configHash,
            }
            this._configHashes[key] = details;
            this._pendingConfigHashes[key] = details;
        } else {
            if (part > details.part) {
                details.part = part;
            }
        }
        return details;
    }

    private _configId(configKind: string, name?: string)
    {
        if (name) {
            return `${configKind}-${name}`;
        }
        return configKind;
    }

    private _buildNodeResult() : HistoryNodeResult
    {
        const result : HistoryNodeResult = {
            entries: [],
            nextToken: PaginationUtils.makeNextToken(this._nextTokenData)
        };

        for(const snapshot of _.values(this._snapshotDetails))
        {
            const xSnapshot : HistoryNodeEntry = {
                snapshotId: snapshot.snapshotIdStr,
                date: snapshot.date!
            }

            for (const node of _.values(snapshot.nodes))
            {
                for(const configDetails of _.values(node.configs))
                {
                    this._populateChanges(configDetails, xSnapshot)
                }
            }

            result.entries.push(xSnapshot);
        }

        result.entries = _.orderBy(result.entries, x => x.date, ['desc']);
        return result;
    }

    private _buildHierarchyResult() : HistoryHierarchyResult
    {
        const result : HistoryHierarchyResult = {
            entries: [],
            nextToken: PaginationUtils.makeNextToken(this._nextTokenData)
        };

        for(const snapshot of _.values(this._snapshotDetails))
        {
            const nodeDict : Record<string, HistoryHierarchyNodeEntry> = {};
            for (const node of _.values(snapshot.nodes))
            {
                let nodeEntry : HistoryHierarchyNodeEntry = nodeDict[node.dn];
                if (!nodeEntry) {
                    nodeEntry = {
                        dn: node.dn
                    };
                    nodeDict[node.dn] = nodeEntry;
                }

                for(const configDetails of _.values(node.configs))
                {
                    this._populateChanges(configDetails, nodeEntry)
                }
            }

            const xSnapshot : HistoryHierarchyEntry = {
                snapshotId: snapshot.snapshotIdStr,
                date: snapshot.date!,
                nodes: _.chain(nodeDict).values().orderBy(x => x.dn).value()
            }
            result.entries.push(xSnapshot);
        }

        result.entries = _.orderBy(result.entries, x => x.date, ['desc']);
        return result;
    }

    private _populateChanges(configDetails: ConfigDetails, changes: HistoryNodeEntryChanges)
    {
        if (configDetails.config_kind == 'node')
        {
            if (!configDetails.config) {
                changes.notPresent = true;
            } else {
                if (configDetails.config.config) {
                    const config = configDetails.config.config!;
                    if (config.markers && config.markers.length > 0) {
                        changes.markers = config.markers;
                    }
                    if (config.flags && _.keys(config.flags).length > 0) {
                        changes.flags = _.keys(config.flags);
                    }
                    if (config.alertCount) {
                        changes.alertCount = config.alertCount;
                    }
                }
            }
        }
        else if (configDetails.config_kind == 'props')
        {
            if (!changes.props) {
                changes.props = [];
            }
            changes.props!.push(configDetails.name!);
        }
    }

}

interface SnapshotDetails
{
    key: string,
    snapshotId: Buffer,
    snapshotIdStr: string,
    part: number,
    date?: string,

    nodes: Record<string, NodeDetails>,

    isSnapshot?: boolean,
    isDiff?: boolean,
}
interface NodeDetails
{
    dn: string;
    configs: Record<string, ConfigDetails>;
}

interface ConfigDetails
{
    config_kind: string,
    name?: string,
    present: boolean,

    config?: ConfigHashDetails | null
}

interface ConfigHashDetails
{
    key: string,
    part: number
    config_hash: Buffer,
    config?: any
}