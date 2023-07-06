import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { SeriesResampler } from '../../src';
import { TimeSeriesPoint } from '../../src/time-series/series-resampler';

export interface MyTimeSeriesPoint extends TimeSeriesPoint
{
    changes: number,
    error: number,
    warn: number,
}

describe('series-resampler', function() {

    it('test-empty', function() {
        const resampler = new SeriesResampler(10);
        const result = resampler.process([]);
        should(result).be.an.Array();
        should(result.length).be.equal(0);
    });

    it('test-one', function() {
        const resampler = new SeriesResampler(10);
        const result = resampler.process([{ date: new Date() }]);
        should(result).be.an.Array();
        should(result.length).be.equal(1);
    });


    it('test-two', function() {
        const resampler = new SeriesResampler<MyTimeSeriesPoint>(10);
        const importData : MyTimeSeriesPoint[] = [
            {"date": new Date("2020-10-07 22:08:50"), "changes":7, "error":42, "warn":368},
            {"date": new Date("2020-10-20 23:24:32"), "changes":7, "error":54, "warn":367},
        ];
        const result = resampler.process(importData);
        should(result).be.an.Array();
        should(result.length).be.equal(2);
    });

    it('test-case-01', function() {
        const resampler = new SeriesResampler<MyTimeSeriesPoint>(10)
            .column("changes", x => _.max(x) ?? 0)
            .column("error", _.mean)
            ;

        const importData : MyTimeSeriesPoint[] = [
            {"date":new Date("2020-10-08T05:08:50.000Z"), "changes":7, "error":42, "warn":368},
            {"date":new Date("2020-10-14T14:09:51.000Z"), "changes":6, "error":54, "warn":370},
            {"date":new Date("2020-10-21T06:24:32.000Z"), "changes":7, "error":54, "warn":367},
        ];
        const result = resampler.process(importData);
        should(result).be.an.Array();
        should(result.length).be.equal(11);

        for(const p of result)
        {
            should(p).be.an.Object();
            should(p.date).be.a.ok();
            should(p.changes).be.a.Number();
            should(p.error).be.a.Number();
            should(p.warn).not.be.ok();
        }
        should(result[0].date.toISOString()).be.equal("2020-10-08T05:08:50.000Z");
        should(result[10].date.toISOString()).be.equal("2020-10-21T06:24:32.000Z");
    });


});
