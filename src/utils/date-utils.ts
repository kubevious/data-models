import _ from 'the-lodash';

export function toMySQLDate(date : Date | null) : string | null
{
    if (!date) {
        return null;
    }
    const str = date.toISOString().substring(0, 10);
    return str;
}
