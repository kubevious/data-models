import 'mocha';
import should = require('should');

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { UuidUtils } from '../src'

describe('uuid-utils', () => {

    it('newUUID-01', () => {
        const id = UuidUtils.newUUID();
        should(id).be.a.String().and.lengthOf(UuidUtils.UUID_STR_LENGTH);

        const idBuf = Buffer.from(id, 'hex');
        should(idBuf).have.lengthOf(UuidUtils.UUID_BUF_LENGTH);

        should(UuidUtils.UUID_STR_LENGTH).be.equal(32);
        should(UuidUtils.UUID_BUF_LENGTH).be.equal(16);

    });

    it('newDatedUUID-01', () => {
        const id = UuidUtils.newDatedUUID();
        should(id).be.a.String().and.lengthOf(UuidUtils.DATED_UUID_STR_LENGTH);


        const idBuf = Buffer.from(id, 'hex');
        should(idBuf).have.lengthOf(UuidUtils.DATED_UUID_BUF_LENGTH);

        should(UuidUtils.DATED_UUID_STR_LENGTH).be.equal(40);
        should(UuidUtils.DATED_UUID_BUF_LENGTH).be.equal(20);

        {
            const partitionStr = UuidUtils.getPartStrFromDatedUUIDStr(id);
            should(partitionStr).be.a.String().and.lengthOf(8);
            should(partitionStr).startWith("202");
        }

        {
            const partition = UuidUtils.getPartFromDatedUUIDStr(id);
            should(partition).be.a.Number().and.greaterThan(20210101).and.lessThanOrEqual(20300101);
        }

        {
            const partition = UuidUtils.getPartFromDatedUUIDBuf(idBuf);
            should(partition).be.a.Number().and.greaterThan(20210101).and.lessThanOrEqual(20300101);
        }
    });

    it('newDatedUUID-02', () => {
        const baseId = UuidUtils.newUUID();
        
        {
            const id = '99999999' + baseId;
            const idBuf = Buffer.from(id, 'hex');
            should(idBuf).have.lengthOf(UuidUtils.DATED_UUID_BUF_LENGTH);
        }

        {
            const id = '00000000' + baseId;
            const idBuf = Buffer.from(id, 'hex');
            should(idBuf).have.lengthOf(UuidUtils.DATED_UUID_BUF_LENGTH);
        }
    });

});

