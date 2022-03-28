import _ from 'the-lodash';

export class PaginationUtils
{

    static makeNextToken(tokenData?: PaginationTokenData | null) : string | undefined
    {
        if (!tokenData) {
            return undefined;
        }
        const str = _.stableStringify(tokenData);
        const encoded = Buffer.from(str, 'binary').toString('base64');
        return encoded;
    }

    static parseTokenData(tokenStr: string) : PaginationTokenData
    {
        const str = Buffer.from(tokenStr, 'base64').toString('binary');
        const data = JSON.parse(str) as PaginationTokenData;
        return data;
    }

}

export interface PaginationTokenData
{
    part: number;
}