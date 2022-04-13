import { RulesRow } from '../models/rule_engine';
import { HashUtils } from '../utils/hash-utils';

export interface RuleConfig {
    name: string;
    target: string;
    script: string;
    enabled: boolean;
}


export function makeDbRulesRow(rule: RuleConfig)
{
    const hashKey = {
        name: rule.name,
        enabled: rule.enabled,
        target: rule.target,
        script: rule.script,
    }

    const ruleObj : Partial<RulesRow> = {
        name: rule.name,
        enabled: rule.enabled,
        target: rule.target,
        script: rule.script,
        date: new Date(),
        hash: HashUtils.calculateObjectHash(hashKey)
    }
    return ruleObj;
}