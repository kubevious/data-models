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

}