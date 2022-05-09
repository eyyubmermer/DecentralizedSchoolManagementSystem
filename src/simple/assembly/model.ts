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

    static deleteStudent(id: u32): void {
        const student = students.getSome(id);
        assert(student.sender == context.sender, "Insufficient authorization!");
        students.delete(id);
    }
}