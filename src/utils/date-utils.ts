import _ from 'the-lodash';
import moment from 'moment';

export class DateUtils
{
    static toMySQLDate(date : Date | null) : string | null
    {
        if (!date) {
            return null;
        }
        const str = date.toISOString().substring(0, 10);
        return str;
    }

    static diffSeconds(a: any, b: any) : number
    {
        var momentA = moment(a);
        var momentB = moment(b);
        var duration = moment.duration(momentA.diff(momentB));
        return duration.asSeconds();
    }

    static diffMilliseconds(a: any, b: any) : number
    {
        var momentA = moment(a);
        var momentB = moment(b);
        var duration = moment.duration(momentA.diff(momentB));
        return duration.asMilliseconds();
    }

    static diffFromNowSeconds(a: any) : number
    {
        return DateUtils.diffSeconds(new Date(), a);
    }

    static toMysqlFormat(date: any) : string
    {
        date = DateUtils.makeDate(date);
        return date.getUTCFullYear() + "-" + 
            DateUtils.twoDigits(1 + date.getUTCMonth()) + "-" + 
            DateUtils.twoDigits(date.getUTCDate()) + " " + 
            DateUtils.twoDigits(date.getUTCHours()) + ":" + 
            DateUtils.twoDigits(date.getUTCMinutes()) + ":" + 
            DateUtils.twoDigits(date.getUTCSeconds());
    }

    static makeDate(date: any) : Date
    {
        if (_.isString(date)) {
            date = new Date(date);
        }
        return date;
    }

    private static twoDigits(d : number) : string {
        if(0 <= d && d < 10) return "0" + d.toString();
        if(-10 < d && d < 0) return "-0" + (-1*d).toString();
        return d.toString();
    }

}
