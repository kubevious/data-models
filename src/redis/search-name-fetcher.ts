export class RedisSearchNameFetcher
{
    get nodeKeyPrefix()
    {
        return 'search_node';
    }

    get labelKeyPrefix()
    {
        return 'search_label';
    }

    get annoKeyPrefix()
    {
        return 'search_anno';
    }

    get nodeSearchIndex()
    {
        return `idx.${this.nodeKeyPrefix}`;
    }

    get labelSearchIndex()
    {
        return `idx.${this.labelKeyPrefix}`;
    }

    get annoSearchIndex()
    {
        return `idx.${this.annoKeyPrefix}`;
    }

}