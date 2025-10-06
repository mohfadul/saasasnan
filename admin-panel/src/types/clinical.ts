export enum NoteType {
  PROGRESS = 'progress',
  INITIAL_CONSULTATION = 'initial_consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  PROCEDURE_NOTE = 'procedure_note',
  REFERRAL = 'referral',
  DISCHARGE = 'discharge',
}

export enum NoteStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  SIGNED = 'signed',
  AMENDED = 'amended',
  ARCHIVED = 'archived',
}

export interface ClinicalNote {
  id: string;
  tenantId: string;
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  providerId: string;
  noteType: NoteType;
  status: NoteStatus;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  examinationFindings?: string;
  diagnosis?: string;
  treatmentRendered?: string;
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
  vitalSigns?: Record<string, any>;
  medications?: Record<string, any>[];
  allergies?: string[];
  proceduresPerformed?: Record<string, any>[];
  providerSignature?: string;
  signedAt?: string;
  amendmentHistory?: any[];
  createdAt: string;
  updatedAt: string;
  patient?: any;
  provider?: any;
  appointment?: any;
  createdByUser?: any;
}

export interface CreateClinicalNoteRequest {
  patientId: string;
  appointmentId?: string;
  noteType: NoteType;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  examinationFindings?: string;
  diagnosis?: string;
  treatmentRendered?: string;
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
  vitalSigns?: Record<string, any>;
  medications?: Record<string, any>[];
  allergies?: string[];
  proceduresPerformed?: Record<string, any>[];
}

export enum TreatmentPlanStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface TreatmentPlan {
  id: string;
  tenantId: string;
  clinicId: string;
  patientId: string;
  clinicalNoteId?: string;
  providerId: string;
  title: string;
  description?: string;
  status: TreatmentPlanStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedCost: number;
  actualCost?: number;
  insuranceEstimate?: number;
  insuranceCoverage?: number;
  patientResponsibility?: number;
  // Progress tracking
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingItems: number;
  notes?: string;
  proposedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  patient?: any;
  provider?: any;
  items?: TreatmentPlanItem[];
}

export interface CreateTreatmentPlanRequest {
  patientId: string;
  clinicalNoteId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedCost: number;
  insuranceEstimate?: number;
  notes?: string;
  items: {
    procedureName: string;
    procedureCode?: string;
    itemType: string;
    description?: string;
    quantity?: number;
    estimatedDurationMinutes?: number;
    unitCost: number;
    dependsOnItemId?: string;
    sequenceOrder?: number;
    specialInstructions?: string[];
    requiredMaterials?: string[];
    contraindications?: string[];
  }[];
}

export interface UpdateTreatmentPlanRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedCost?: number;
  insuranceEstimate?: number;
  notes?: string;
  status?: TreatmentPlanStatus;
}

export interface TreatmentPlanItem {
  id: string;
  treatmentPlanId: string;
  itemType: string;
  procedureName: string;
  procedureCode?: string;
  description?: string;
  status: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  estimatedDurationMinutes?: number;
  sequenceOrder: number;
  specialInstructions?: string;
  requiredMaterials?: string[];
  contraindications?: string[];
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

