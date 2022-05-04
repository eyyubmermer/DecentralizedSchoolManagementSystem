It is a decentralized school operating system developed with NEAR Protocol. Students can be enrolled in the school. An id is assigned to each registered student. With these id's, student records can be accessed and necessary changes can be made on the record or records can be viewed. For example, student grades can be entered and calculated. Student payment status can be checked. Term ends with endTerm command. Students who have not paid after the end of the semester are deleted from the system. Successful students who have paid are transferred to the next semester. Unsuccessful students who have made a payment stay in the same semester. When the new semester starts, all student information is reset and returns to its default values.

After cloning the project please run:

`yarn`

`yarn build:release`

`yarn dev`

`export CONTRACT=$ACCOUNT_ID`




| Name  | What does it do?  | Usage |
| :------------ |:---------------| :--------|
| DeploymentCheck | Just used for checking if the contract deployed successfully | near call $CONTRACT DeploymentCheck '{"req":"Hello", "rep":"Selam"}' --accountId $NEAR_ACCOUNT |
| enrollStudent | Registers a student and generate an ID for him. |near call $CONTRACT enrollStudent '{"studentName":"$STUDENT_NAME", "term": $TERM}' --accountId $NEAR_ACCOUNT|
| setAvarage |Gets the exam results of the student and calculates the avarage|near call $CONTRACT enrollStudent '{"studentName":"$STUDENT_NAME", "term": $TERM}' --accountId $NEAR_ACCOUNT|
|feePayment |Provides student to pay his course price. |near call $CONTRACT feePayment '{"id": '$STUDENT_ID'}' --amount 1 --accountId $NEAR_ACCOUNT|
| getAllStudent |Shows all the students in an object array.|near call $CONTRACT getAllStudent --accountId $NEAR_ACCOUNT|
| endTerm |This function is called when the term is ended. Student properties are reseted. Students who didn't pay their debts are deleted. Successful students pass to another term, unsuccesful students can't.|near call $CONTRACT endTerm --accountId $NEAR_ACCOUNT|
| deleteStudent |Deletes a particular student|near call $CONTRACT deleteStudent '{"id":$STUDENT_ID}' --accountId $NEAR_ACCOUNT|
| bringStudent |Shows a particular student's data.|near call $CONTRACT bringStudent '{"id":$STUDENT_ID}' --accountId $NEAR_ACCOUNT|

#index.ts
```javascript
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



export function bringStudent(id: u32): Student {
  return Student.bringStudent(id);
}


export function readStudent(): Student[] {
  return Student.readAnStudent();
}


export function deleteStudent(id: u32): void {
  logging.log("Student's account has been deleted!");
  Student.deleteStudent(id);
}
})();```


```



#model.ts
```javascript
import {
    context, // visibility into account, contract and blockchain details 
    PersistentUnorderedMap, // data structure that wraps storage
    math, // utility math function for hashing using SHA and Keccak as well as pseudo-random data
    logging,
} from "near-sdk-as";

export const students = new PersistentUnorderedMap<u32, Student>("students");
@nearBindgen
export class Student {
    studentName: string;
    id: u32;
    sender: string;
    enrollmentDate: u64;
    term: u8;
    exams: Array<u8> = [];
    avarage: u64;
    didPay: bool = false;


    constructor(studentName: string, term: u8) {
        this.id = math.hash32<string>(studentName);
        this.studentName = studentName;
        this.sender = context.sender;
        this.enrollmentDate = context.blockTimestamp;
        this.term = term;
    }


    static enrollStudent(studentName: string, term: u8): Student {
        const student = new Student(studentName, term);
        students.set(student.id, student);
        return student;
    }

    static setAvarage(id: u32, exams: Array<u8>): Student {
        const student = students.getSome(id);
        assert(student.sender == context.sender);
        const sum = exams.reduce((a, b) => a + b, 0);
        const avg = (sum / exams.length) || 0;
        student.avarage = avg;
        student.exams = exams;
        students.set(student.id, student);
        return student;
    }


    static getAllStudent(): Student[] {
        return students.values();
    }

    static endTerm(): Student[] {
        const arrayStudent: Student[] = new Array<Student>();
        const arrStudent: Student[] = students.values();

        let length: i32 = students.length;
        for (let i = 0; i < length; i++) {
            if (arrStudent[i].didPay == false) {
                students.delete(arrStudent[i].id);
                if (arrayStudent.includes(arrStudent[i])) {
                    arrayStudent.splice(arrayStudent.indexOf(arrStudent[i]), 1);
                };
            }
            if (arrStudent[i].didPay == true) {
                if (arrStudent[i].avarage >= 50) {
                    arrStudent[i].term += 1;
                }
                arrStudent[i].exams = [];
                arrStudent[i].avarage = 0;
                arrStudent[i].didPay = false;
                students.set(arrStudent[i].id, arrStudent[i]);
                if (!arrayStudent.includes(arrStudent[i])) {
                    arrayStudent.push(arrStudent[i])
                };
            }
        }
        return arrayStudent;
    }


    static bringStudent(id: u32): Student {
        assert(students.contains(id), "Student could not found!");
        return students.getSome(id);
    }

    static feePayment(id: u32): Student {
        const student = students.getSome(id)
        student.didPay = true;
        students.set(student.id, student);
        return student;
    }

    static readAnStudent(): Student[] {
        let start: u32 = 0;
        logging.log("You can donate to an Advertisingman using 'sendGratitude' function!");
        return students.values(start, students.length);
    }

    static deleteStudent(id: u32): void {
        const student = students.getSome(id);
        assert(student.sender == context.sender, "Insufficient authorization!");
        students.delete(id);
    }
}
