import { v4 as uuidv4 } from 'uuid'

import { PartitionUtils } from './partition-utils';

export class UuidUtils {
        
    public static UUID_STR_LENGTH = 32;
    public static UUID_BUF_LENGTH = 16;

    public static DATED_UUID_STR_LENGTH = 40;
    public static DATED_UUID_BUF_LENGTH = 20;

    static newUUID() : string
    {
        const id = uuidv4();
        return id.replace(/-/g, '');
    }

    static newDatedUUID() : string
    {
        const date = UuidUtils.newDateStr();
        const id = UuidUtils.newUUID();
        return `${date}${id}`;
    }

    static getPartStrFromDatedUUIDStr(id: string) : string
    {
        if (id.length !== UuidUtils.DATED_UUID_STR_LENGTH) {
            throw new Error("Invalid ID.");
        }
        return id.substr(0, 8);
    }

    static getPartFromDatedUUIDStr(id: string) : number
    {
        const partStr = UuidUtils.getPartStrFromDatedUUIDStr(id);
        return parseInt(partStr);
    }

    static getPartStrFromDatedUUIDBuf(id: Buffer) : string
    {
        const idStr = id.toString('hex');
        return UuidUtils.getPartStrFromDatedUUIDStr(idStr);
    }

    static getPartFromDatedUUIDBuf(id: Buffer) : number
    {
        const partStr = UuidUtils.getPartStrFromDatedUUIDBuf(id);
        return parseInt(partStr);
    }

    private static newDateStr()
    {
        const date = new Date();
        const partId = PartitionUtils.getPartitionIdFromDate(date);
        return partId.toString();
    }


}