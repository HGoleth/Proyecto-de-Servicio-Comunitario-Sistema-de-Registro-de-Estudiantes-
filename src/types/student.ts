export interface Student {
  id: string;
  ci: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: string;
  age?: string;
  gender?: string;
  placeOfBirth?: string;
  address?: string;
  entity?: string;
  country?: string;
  municipality?: string;
  parish?: string;
  level: string; 
  nivel?: string; 
  grade: string;
  section: string;
  status: "Inscrito" | "Pendiente" | "Retirado";
  previousSchool?: string;
  deaCode?: string;
  schoolYear?: string;
  admissionDate?: string;
  repeatsYear?: string;
  pendingSubjects?: string; 
  
  motherFirstName?: string;
  motherLastName?: string;
  motherName?: string; 
  motherCI?: string; 
  motherPhone?: string;
  
  fatherFirstName?: string;
  fatherLastName?: string;
  fatherName?: string; 
  fatherCI?: string; 
  fatherPhone?: string;
  
  repFirstName?: string;
  repLastName?: string;
  repName?: string; 
  repCI?: string;       
  repCedula?: string;   
  repPhone?: string; 
  relationship?: string;

  isTransfer?: boolean;
  lastSchoolName?: string;
  lastGradeCompleted?: string;
  lastTermCompleted?: string;
  transferObservations?: string;
  
  obsPersonal?: string;
  obsFamiliar?: string;
  obsSalud?: string;
  observations?: string; 

  height?: string; 
  weight?: string; 
  bloodType?: string; 
  allergies?: string; 
  medicalCondition?: string;
  shirtSize?: string; 
  pantsSize?: string; 
  shoeSize?: string;
  
  inscriptionFiles?: { name: string; path: string }[];
  transferFiles?: { name: string; path: string }[];
  studentPhoto?: string;
  repPhoto?: string;
  [key: string]: any;
}

export type StudentRecord = Student;

export interface ToastNotificationState {
  show: boolean;
  type: "error" | "success" | "info" | "";
  msg: string;
}

export interface StepItem {
  label: string;
  active: boolean;
}
