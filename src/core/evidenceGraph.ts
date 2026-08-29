/**
 * Evidence Graph & Root Cause Chain (TypeScript)
 * Builds structured evidence chains to substantiate AI SRE incident diagnoses.
 */

export interface EvidenceNode {
  id: string;
  category: string;
  description: string;
  payload: any;
  verified: boolean;
  timestamp: string;
}

export class EvidenceGraph {
  incidentId: string;
  evidenceChain: EvidenceNode[];
  evidenceStrength: "LOW" | "MEDIUM" | "HIGH";

  constructor(incidentId?: string) {
    this.incidentId = incidentId || `INC-${Date.now()}`;
    this.evidenceChain = [];
    this.evidenceStrength = "LOW";
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
      this.evidenceStrength = "HIGH";
    } else if (verifiedCount >= 1) {
      this.evidenceStrength = "MEDIUM";
    } else {
      this.evidenceStrength = "LOW";
    }
  }

  getChain(): EvidenceNode[] {
    return this.evidenceChain;
  }
}

export default EvidenceGraph;
