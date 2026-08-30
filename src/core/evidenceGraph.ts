/**
 * Dynamic Evidence Graph System (TypeScript)
 * Tracks captured evidence nodes and dynamically re-evaluates evidence strength.
 */

import { EVIDENCE_STRENGTH, EVIDENCE_CATEGORIES } from '@/core/constants';

export interface EvidenceNode {
  id: string;
  category: keyof typeof EVIDENCE_CATEGORIES | string;
  description: string;
  payload: any;
  verified: boolean;
  timestamp: string;
}

export class EvidenceGraph {
  incidentId: string;
  evidenceChain: EvidenceNode[];
  evidenceStrength: keyof typeof EVIDENCE_STRENGTH;

  constructor(incidentId: string) {
    this.incidentId = incidentId;
    this.evidenceChain = [];
    this.evidenceStrength = EVIDENCE_STRENGTH.LOW;
  }

  addEvidence({
    category,
    description,
    payload,
    verified
  }: {
    category: string;
    description: string;
    payload: any;
    verified: boolean;
  }): EvidenceNode {
    const node: EvidenceNode = {
      id: `EV-${this.evidenceChain.length + 1}`,
      category,
      description,
      payload,
      verified: Boolean(verified),
      timestamp: new Date().toISOString()
    };

    this.evidenceChain.push(node);
    this.reevaluateStrength();
    return node;
  }

  reevaluateStrength(): void {
    const verifiedCount = this.evidenceChain.filter(e => e.verified).length;
    if (verifiedCount >= 3) {
      this.evidenceStrength = EVIDENCE_STRENGTH.HIGH;
    } else if (verifiedCount >= 1) {
      this.evidenceStrength = EVIDENCE_STRENGTH.MEDIUM;
    } else {
      this.evidenceStrength = EVIDENCE_STRENGTH.LOW;
    }
  }

  getChain(): EvidenceNode[] {
    return this.evidenceChain;
  }
}

export default EvidenceGraph;
