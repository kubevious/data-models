import { DataStore } from "@kubevious/easy-data-store";
import { ConfigAccessors } from "../models/config";

export class ConfigAccessor
{
    private _dataStore : DataStore;
    private _config : ConfigAccessors;

    constructor(dataStore : DataStore, config : ConfigAccessors)
    {
        this._dataStore = dataStore;
        this._config = config;
    }

    setLatestSnapshotInfo(info: LatestSnapshotInfo)
    {
        return this.setConfig(LATEST_SNAPSHOT_CONFIG_KEY, info);
    }

    getLatestSnapshotInfo()
    {
        return this.getConfig<LatestSnapshotInfo | null>(LATEST_SNAPSHOT_CONFIG_KEY, null);
    }

    getLatestSnapshotId()
    {
        return this.getLatestSnapshotInfo()
            .then(result => {
                return result?.snapshot_id ?? null;
            })
    }

    setDBSchemaVersion(version: number)
    {
        const valueObj : DBVersionConfig = {
            version: version
        };

        return this.setConfig(DB_SCHEMA_CONFIG_KEY, valueObj);
    }
    getDBSchemaVersion()
    {
        return this.getConfig<DBVersionConfig | null>(DB_SCHEMA_CONFIG_KEY, null)
            .then(result => {
                return result?.version ?? 0;
            })
    }

    setCollectorStateConfig(info: CollectorStateInfo)
    {
        return this.setConfig(COLLECTOR_STATE_CONFIG_KEY, info);
    }

    getCollectorStateConfig()
    {
        return this.getConfig<CollectorStateInfo>(COLLECTOR_STATE_CONFIG_KEY, {
            snapshots_in_queue: 0
        })
    }

    /** ** **/

    public getConfig<T>(name: string, defaultValue: T)
    {
        return this._dataStore.table(this._config.Config)
            .queryOne({ key: name })
            .then(result => {
                if (!result) {
                    return defaultValue;
                }
                return result.value! as T;
            });
    }

    public setConfig<T>(name: string, value: T)
    {
        return this._dataStore.table(this._config.Config)
            .create({ key: name, value: value });
    }
}

export const DB_SCHEMA_CONFIG_KEY = 'DB_SCHEMA';
export interface DBVersionConfig  {
    version: number;
}

export const LATEST_SNAPSHOT_CONFIG_KEY = 'LATEST_SNAPSHOT';
export interface LatestSnapshotInfo  {
    snapshot_id: string;
    date: string;
    agent_version: string;
}

export const COLLECTOR_STATE_CONFIG_KEY = 'COLLECTOR_STATE';
export interface CollectorStateInfo  {
    snapshots_in_queue: number;
}
