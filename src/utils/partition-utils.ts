
export function getPartitionIdFromDate(date: Date) : number
{
    let part = date.getFullYear();
    part = part * 100 + date.getMonth() + 1; // getMonth() is zero-based
    part = part * 100 + date.getDate();
    return  part;
}