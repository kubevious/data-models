import moment from 'moment';

export class PartitionUtils
{

    static getPartitionIdFromDate(date: Date) : number
    {
        date = new Date(date);

        let part = date.getFullYear();
        part = part * 100 + date.getMonth() + 1; // getMonth() is zero-based
        part = part * 100 + date.getDate();
        return  part;
    }


    static partitionName(partition: number) : string
    {
        return 'p' + partition;
    }

    static getRelativePartitionId(daysDiff: number)
    {
        const date = moment().subtract({ days: daysDiff }).toDate();
        const partId = PartitionUtils.getPartitionIdFromDate(date);
        return partId;
    }
}