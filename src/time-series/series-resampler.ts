import _ from 'the-lodash';

export interface TimeSeriesPoint
{
    date: Date
}

export type Reducer = (points: number[]) => number;

export class SeriesResampler<T extends TimeSeriesPoint = TimeSeriesPoint>
{
    private _resolution : number;
    private _metadata : Record<string, Reducer> = {};

    constructor(resolution : number)
    {
        this._resolution = resolution;
    }

    column(name: string, reducer: Reducer)
    {
        this._metadata[name] = reducer;
        return this;
    }

    process(data: T[]) : T[]
    {
        if (data.length <= 2) {
            return data;
        }
    
        let minTime = data[0].date.getTime();
        let maxTime = minTime;
        for(const point of data)
        {
            const time = point.date.getTime();
            minTime = Math.min(time, minTime);
            maxTime = Math.max(time, maxTime);
        }
    
        const bucketWidth = (maxTime - minTime) / this._resolution;
        if (bucketWidth <= 0) {
            return data;
        }
    
        const buckets : {
            time: any,
            points: any[]
        }[] = [];

        for(let i = 0; i < this._resolution; i++)
        {
            const bucket = {
                time: minTime + bucketWidth * i,
                points: []
            };
            buckets.push(bucket);
        }
        buckets.push({
            time: maxTime,
            points: []
        });
    
        for(const point of data)
        {
            const bucketId = this._getBucketId(point.date, minTime, bucketWidth);
            buckets[bucketId].points.push(point);
        }
    
        const resampled : T[] = [];
        let lastPoint : (Record<string, any> | null) = null;
        for(let i = 0; i < buckets.length; i++)
        {
            const bucket = buckets[i];
            const point : Record<string, any> = {
                date: new Date(bucket.time)
            }
    
            for(const column of _.keys(this._metadata))
            {
                const reducer = this._metadata[column];
    
                const values : number[] = bucket.points.map(p => p[column]);
                let value;
                if (values.length == 0)
                {
                    if (lastPoint) {
                        value = lastPoint[column];
                    } else {
                        value = 0;
                    }
                } 
                else 
                {
                    value = Math.floor(reducer(values));
                }
    
                point[column] = value;
            }
    
            lastPoint = point;
    
            resampled.push(point as T);
        }
    
        return resampled;
    }

    private _getBucketId(date: Date, minTime: any, bucketWidth: number)
    {
        const timeDiff = date.getTime() - minTime;
        let id = Math.floor(timeDiff / bucketWidth);
        if (id > this._resolution) {
            id = this._resolution;
        }
        return id;
    }
}
