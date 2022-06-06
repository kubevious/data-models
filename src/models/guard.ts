import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';
import { ValidationStateSummary,
         ValidationIssues,
         ChangePackageChart,
         ChangePackageDeletion,
         ValidationState,
         ChangePackageSummary } from '@kubevious/ui-middleware/dist/entities/guard';
import { KubernetesObject } from '@kubevious/ui-middleware';


const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */

export interface ChangePackageSource
{
    kind: 'k8s' | 'web',
    name: string,
    namespace?: string
}

export interface ChangePackageRow
{
    change_id: string,
    date: Date,
    source: ChangePackageSource,
    summary: ChangePackageSummary,
    charts: ChangePackageChart[],
    changes: KubernetesObject[],
    deletions: ChangePackageDeletion[]
}
export const ChangePackageMeta = BuildTableMeta<ChangePackageRow>("guard_change_packages", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('change_id')
        .field('date')
        .field('source')
        .field('summary')
        .field('charts')
        .field('changes')
        .field('deletions')
        ;
})


/*
 *
 */
export interface ValidationQueueRow
{
    change_id: string,
    date: Date
}
export const ValidationQueueMeta = BuildTableMeta<ValidationQueueRow>("guard_validation_queue", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('change_id')
        .field('date')
        ;
})


/*
 *
 */
export interface ValidationHistoryRow
{
    change_id: string,
    date: Date,
    state: ValidationState
}
export const ValidationHistoryMeta = BuildTableMeta<ValidationHistoryRow>("guard_validation_history", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('change_id')
        .field('date')
        .field('state')
        ;
})


/*
 *
 */

export interface ValidationStateRow
{
    change_id: string,

    date: Date,
    state: ValidationState,
    success?: boolean,

    summary?: ValidationStateSummary,
    newIssues?: ValidationIssues,
    clearedIssues?: ValidationIssues,
}
export const ValidationStateMeta = BuildTableMeta<ValidationStateRow>("guard_validation_states", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('change_id')
        .field('date')
        .field('state')
        .field('success')
        .field('summary')
        .field('newIssues')
        .field('clearedIssues')
        ;
})


/*
 *
 */
export interface GuardAccessors
{
    ChangePackage: DataStoreTableAccessor<ChangePackageRow>
    ValidationQueue: DataStoreTableAccessor<ValidationQueueRow>
    ValidationHistory: DataStoreTableAccessor<ValidationHistoryRow>
    ValidationState: DataStoreTableAccessor<ValidationStateRow>
}

export function prepareGuard(dataStore : DataStore) : GuardAccessors
{
    return {
        ChangePackage: ChangePackageMeta.prepare(dataStore),
        ValidationQueue: ValidationQueueMeta.prepare(dataStore),
        ValidationHistory: ValidationHistoryMeta.prepare(dataStore),
        ValidationState: ValidationStateMeta.prepare(dataStore),
    }
}