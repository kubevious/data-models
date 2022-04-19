export interface ApiResourceStatus
{
    apiName: string | null;
    apiVersion: string;
    kindName: string;
    
    isDisabled?: boolean;
    isSkipped?: boolean;
    isDisconnected?: boolean;

    error?: ApiResourceError;
}


export interface ApiResourceError
{
    code?: number;
    message?: string;
}
