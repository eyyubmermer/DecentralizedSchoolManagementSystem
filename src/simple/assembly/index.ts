import {
  context, // visibility into account, contract and blockchain details
  ContractPromiseBatch, // make asynchronous calls to other contracts and receive callbacks
  logging, // append to the execution environment log (appears in JS Developer Console when using near-api-js)
  storage,
  u128, // append to the execution environment log (appears in JS Developer Console when using near-api-js)
} from "near-sdk-as";

import { AccountId, asNEAR, ONE_NEAR } from "../../utils";
import { Student, students } from "./model";

// Health Check
export function DeploymentCheck(req: string, rep: string): string {
  storage.setString(req, rep);
  let result = storage.getString(req);
  if (result) {
    return "Everything is OK!";
  }
  return "There is something wrong";
}

// Create and Register a Student
export function enrollStudent(studentName: string, term: u8): Student {
  logging.log("Student has enrolled!");
  return Student.enrollStudent(studentName, term);
}

export function setAvarage(id: u32, exams: Array<u8>): Student {
  logging.log("Student's score has been recorded!");
  return Student.setAvarage(id, exams);
}

export function getAllStudent(): Student[] {
  return Student.getAllStudent();
}

export function endTerm(): Student[] {
  return Student.endTerm();
}



export function feePayment(id: u32, receiver: AccountId): Student {
  let student = students.getSome(id);
  assert(context.attachedDeposit == ONE_NEAR, `Please do not send more or less than your fee! Your fee is ${ONE_NEAR}`)
  assert(receiver == student.sender, `You must send your payment to ${student.sender}`);
  assert(context.accountBalance > context.attachedDeposit, "Your balance is not enough!");
  logging.log(`Payment has been completed! ${context.attachedDeposit.toString()} NEAR sent.`);
  ContractPromiseBatch.create(receiver).transfer(context.attachedDeposit);
  return Student.feePayment(student.id);
}


// Take a Look to Archieve
export function bringStudent(id: u32): Student {
  return Student.bringStudent(id);
}


export function deleteStudent(id: u32): void {
  logging.log("Student's account has been deleted!");
  Student.deleteStudent(id);
}