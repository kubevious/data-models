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

    setLatestSnapshotId(snapshotId: string)
    {
        const valueObj : LatestSnapshotIdConfig = {
            snapshot_id: snapshotId
        };

        return this.setConfig(LATEST_SNAPSHOT_CONFIG_KEY, valueObj);
    }

    getLatestSnapshotId()
    {
        return this.getConfig<LatestSnapshotIdConfig | null>(LATEST_SNAPSHOT_CONFIG_KEY, null)
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
export interface LatestSnapshotIdConfig  {
    snapshot_id: string;
}
