import 'mocha';
import should = require('should');

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { getPartitionIdFromDate } from '../src'

describe('partition-utils', () => {

    it('getPartitionIdFromDate-1', () => {
        const date = new Date("2021-08-16T20:10:11Z");
        const partId = getPartitionIdFromDate(date);
        
        should(partId).be.equal(20210816);
    });

    it('getPartitionIdFromDate-2', () => {
        const date = new Date("2022-01-14T20:10:11Z");
        const partId = getPartitionIdFromDate(date);
        
        should(partId).be.equal(20220114);
    });

});

