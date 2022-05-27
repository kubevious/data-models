import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

export interface ChangePackageSummary
{
    createdCount: number,
    deletedCount: number,
}

export interface ChangePackageChart
{
    namespace: string,
    name: string,
}

export interface KubernetesObject {
    kind: string;
    apiVersion: string;
    metadata: {
        name: string;
        namespace?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        [x: string]: any;
    };
    spec?: object;
    status?: object;
    data?: object;
    [x: string]: any;
}

export interface ChangePackageDeletion
{
    apiVersion: string,
    kind: string,
    namespace?: string,
    name: string,
}


/*
 *
 */
export interface ChangePackageRow
{
    namespace: string,
    name: string,
    summary: ChangePackageSummary,
    charts: ChangePackageChart[],
    changes: KubernetesObject[],
    deletions: ChangePackageDeletion[]
}
export const ChangePackageMeta = BuildTableMeta<ChangePackageRow>("guard_change_packages", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('namespace')
        .key('name')
        .field('summary')
        .field('charts')
        .field('changes')
        .field('deletions')
        ;
})

/*
 *
 */
export enum ValidationState {
    pending = 'pending',
    running = 'running',
    completed = 'completed',
}


export interface ValidationStateSummary
{
    issues: {
        raised: ValidationStateAlerts,
        cleared: ValidationStateAlerts,
    }
}

export interface ValidationStateAlerts
{
    errors: number,
    warnings: number,
}

export interface ValidationStateIssue
{
    dn: string,
    msg: string,
    severity: string,
}

export interface ValidationStateRow
{
    namespace: string,
    name: string,

    state: ValidationState,
    success?: boolean,

    summary?: ValidationStateSummary,
    issues?: ValidationStateIssue[],
}
export const ValidationStateMeta = BuildTableMeta<ValidationStateRow>("guard_validation_states", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('namespace')
        .key('name')
        .field('state')
        .field('success')
        .field('summary')
        .field('issues')
        ;
})


/*
 *
 */
export interface GuardAccessors
{
    ChangePackage: DataStoreTableAccessor<ChangePackageRow>
    ValidationState: DataStoreTableAccessor<ValidationStateRow>
}

export function prepareGuard(dataStore : DataStore) : GuardAccessors
{
    return {
        ChangePackage: ChangePackageMeta.prepare(dataStore),
        ValidationState: ValidationStateMeta.prepare(dataStore),
    }
}