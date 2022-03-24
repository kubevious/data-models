import 'mocha';
import should = require('should');

import { setupLogger, LoggerOptions } from 'the-logger';
const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { DataStore } from '@kubevious/easy-data-store'

import { prepareSnapshots } from '../src/models/snapshots'
import { prepareRuleEngine } from '../src/models/rule_engine'

describe('models', () => {

    it('SnapshotsMetaBuilder', () => {
        const dataStore = new DataStore(logger, false);
        const accessors = prepareSnapshots(dataStore);
        return dataStore.init()
            .then(() => {
                should(accessors.SnapItems.table()).be.ok();
                should(accessors.Snapshots.table()).be.ok();
                dataStore.close();
            });
    });

    it('RuleEngineMetaBuilder', () => {
        const dataStore = new DataStore(logger, false);
        const accessors = prepareRuleEngine(dataStore);
        return dataStore.init()
            .then(() => {
                should(accessors.Rules.table()).be.ok();
                dataStore.close();
            });
    });

});
