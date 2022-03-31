import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';
import { ValidatorID, ValidatorSetting } from '@kubevious/entity-meta';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface ValidatorRow
{
    validator_id: ValidatorID,
    setting: ValidatorSetting,
}
export const ValidatorMeta = BuildTableMeta<ValidatorRow>("validators", 
    meta => {
        meta
            .driverParams({ database: DB_NAME })
            .key('validator_id')
            .field('setting')
            ;
    }
)

/*
 *
 */
export interface ValidationAccessors
{
    Validator: DataStoreTableAccessor<ValidatorRow>,
}

export function prepareValidation(dataStore : DataStore) : ValidationAccessors
{
    return {
        Validator: ValidatorMeta.prepare(dataStore)
    }
}