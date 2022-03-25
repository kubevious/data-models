import { DataStore, BuildTableMeta, DataStoreTableAccessor } from '@kubevious/easy-data-store';

const DB_NAME = process.env.MYSQL_DB;

/*
 *
 */
export interface NotificationSnoozeRow
{
    kind: string,
    feedback: Buffer,
    snooze?: Date 
}
export const NotificationSnoozeMeta = BuildTableMeta<NotificationSnoozeRow>("notification_snooze", meta => {
    meta
        .driverParams({ database: DB_NAME })
        .key('key')
        .key('feedback')
        .field('snooze')
        ;
})


/*
 *
 */
export interface NotificationAccessors
{
    NotificationSnooze: DataStoreTableAccessor<NotificationSnoozeRow>,
}

export function prepareNotification(dataStore : DataStore) : NotificationAccessors
{
    return {
        NotificationSnooze: NotificationSnoozeMeta.prepare(dataStore),
    }
}