export type BrokerAccount = {
  id: string;
  account: {
    userId: string;
    name: string;
    email: string;
    status: string;
    isActive: boolean;
    memberSince: string | null;
  };
  organization: {
    legalName: string | null;
    tradeName: string | null;
    entityType: string | null;
    incorporationDate: string | null;
    pan: string | null;
    cin: string | null;
    gstin: string | null;
    website: string | null;
  };
  contact: {
    email: string | null;
    mobile: string | null;
    registeredAddress: string | null;
    correspondenceAddress: string | null;
  };
  registration: {
    sebiRegistrationNo: string | null;
    category: string | null;
    registrationDate: string | null;
    validity: string | null;
    membershipCode: string | null;
    status: string | null;
    applicationStatus: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
  };
  exchanges: Record<"nse" | "bse" | "smi" | "ncdex", boolean>;
  segments: Record<"cash" | "futuresAndOptions" | "currency", boolean>;
  compliance: {
    officerName: string | null;
    designation: string | null;
    pan: string | null;
    mobile: string | null;
  };
  financials: {
    netWorth: string | number | null;
    auditorName: string | null;
    auditorMembership: string | null;
  };
  authorizedPerson: {
    name: string | null;
    pan: string | null;
    designation: string | null;
    email: string | null;
    aadhaar: string | null;
    mobile: string | null;
  };
  declarations: Record<
    | "noDisciplinaryAction"
    | "noSuspension"
    | "noCriminalCase"
    | "agreeSebiCirculars"
    | "agreeCodeOfConduct",
    boolean
  >;
  documents: {
    sebiCertificate: string | null;
    exchangeCertificates: string[];
    appointmentLetter: string | null;
    netWorthCertificate: string | null;
    financialStatements: string | null;
    caCertificate: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
};

export type BrokerAccountResponse = {
  success: boolean;
  broker: BrokerAccount;
  message?: string;
};
