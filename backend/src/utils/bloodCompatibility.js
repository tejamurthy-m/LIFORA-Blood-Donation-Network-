// Medical Transfusion Compatibility Matrix (Red Blood Cells / Whole Blood)

// Donors with Blood Group X can give to:
export const DONOR_CAN_GIVE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal Red Cell Donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'], // Universal Recipient
};

// Recipients with Blood Group Y can receive from:
export const RECIPIENT_CAN_RECEIVE_FROM = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

export const getCompatibleRecipients = (donorBloodGroup) => {
  return DONOR_CAN_GIVE_TO[donorBloodGroup] || [donorBloodGroup];
};

export const getCompatibleDonors = (recipientBloodGroup) => {
  return RECIPIENT_CAN_RECEIVE_FROM[recipientBloodGroup] || [recipientBloodGroup];
};
