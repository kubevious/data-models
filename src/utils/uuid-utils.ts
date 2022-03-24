import { v4 as uuidv4 } from 'uuid'

import { getPartitionIdFromDate } from './partition-utils';

export const UUID_STR_LENGTH = 32;
export const UUID_BUF_LENGTH = 16;

export const DATED_UUID_STR_LENGTH = 40;
export const DATED_UUID_BUF_LENGTH = 20;

export function newUUID() : string
{
    const id = uuidv4();
    return id.replace(/-/g, '');
}

export function newDatedUUID() : string
{
    const date = newDateStr();
    const id = newUUID();
    return `${date}${id}`;
}

export function getPartStrFromDatedUUIDStr(id: string) : string
{
    if (id.length !== DATED_UUID_STR_LENGTH) {
        throw new Error("Invalid ID.");
    }
    return id.substr(0, 8);
}

export function getPartFromDatedUUIDStr(id: string) : number
{
    const partStr = getPartStrFromDatedUUIDStr(id);
    return parseInt(partStr);
}

export function getPartStrFromDatedUUIDBuf(id: Buffer) : string
{
    const idStr = id.toString('hex');
    return getPartStrFromDatedUUIDStr(idStr);
}

export function getPartFromDatedUUIDBuf(id: Buffer) : number
{
    const partStr = getPartStrFromDatedUUIDBuf(id);
    return parseInt(partStr);
}

function newDateStr()
{
    const date = new Date();
    const partId = getPartitionIdFromDate(date);
    return partId.toString();
}