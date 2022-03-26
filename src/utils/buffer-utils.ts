import _ from 'the-lodash';

export class BufferUtils
{
    static areEqual(a: (Buffer | null), b : (Buffer | null)) : boolean
    {
        if (_.isNullOrUndefined(a)) {
            if (_.isNullOrUndefined(b)) {
                return true;
            } else {
                return false;
            }
        } else {
            if (_.isNullOrUndefined(b)) {
                return false;
            } else {
                return a!.equals(b!);
            }
        }
    }

    static fromStr(value: string) : Buffer
    {
        return Buffer.from(value, 'hex');
    }

    static toStr(value: Buffer) : string
    {
        return value.toString('hex');
    }

    static parseUUID(value: string) : Buffer | null
    {
        const buf = BufferUtils.fromStr(value);
        if (buf.length != 16) {
            return null
        }
        return buf;
    }

}
