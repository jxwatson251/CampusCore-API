import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Define interfaces for type safety
interface User {
  _id: ObjectId;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Student {
  _id: ObjectId;
  userId: ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  gradeLevel: number;
  phone?: string;
  address?: string;
  enrollmentDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Subject {
  _id: ObjectId;
  name: string;
  code: string;
  description?: string;
  teacherId?: ObjectId;
  gradeLevel: number;
  credits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Grade {
  _id: ObjectId;
  studentId: ObjectId;
  subjectId: ObjectId;
  grade: number;
  semester: string;
  academicYear: string;
  gradedBy: ObjectId;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Teacher {
  _id: ObjectId;
  userId: ObjectId;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Generate ObjectIds for consistent referencing
const generateObjectIds = () => {
  return {
    // User IDs
    adminUserId: new ObjectId(),
    teacherUser1Id: new ObjectId(),
    teacherUser2Id: new ObjectId(),
    teacherUser3Id: new ObjectId(),
    studentUser1Id: new ObjectId(),
    studentUser2Id: new ObjectId(),
    studentUser3Id: new ObjectId(),
    studentUser4Id: new ObjectId(),
    studentUser5Id: new ObjectId(),
    studentUser6Id: new ObjectId(),
    
    // Student IDs
    student1Id: new ObjectId(),
    student2Id: new ObjectId(),
    student3Id: new ObjectId(),
    student4Id: new ObjectId(),
    student5Id: new ObjectId(),
    student6Id: new ObjectId(),
    
    // Teacher IDs
    teacher1Id: new ObjectId(),
    teacher2Id: new ObjectId(),
    teacher3Id: new ObjectId(),
    
    // Subject IDs
    mathId: new ObjectId(),
    englishId: new ObjectId(),
    scienceId: new ObjectId(),
    historyId: new ObjectId(),
    artId: new ObjectId(),
    physicsId: new ObjectId(),
    chemistryId: new ObjectId(),
    biologyId: new ObjectId(),
  };
};

const ids = generateObjectIds();

// Hash password function
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Generate seed data
export const generateSeedData = async () => {
  const currentDate = new Date();
  
  // Users (for authentication)
  const users: User[] = [
    {
      _id: ids.adminUserId,
      email: 'admin@campcore.edu',
      password: await hashPassword('admin123'),
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.teacherUser1Id,
      email: 'john.smith@campcore.edu',
      password: await hashPassword('teacher123'),
      role: 'teacher',
      firstName: 'John',
      lastName: 'Smith',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.teacherUser2Id,
      email: 'sarah.johnson@campcore.edu',
      password: await hashPassword('teacher123'),
      role: 'teacher',
      firstName: 'Sarah',
      lastName: 'Johnson',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.teacherUser3Id,
      email: 'mike.brown@campcore.edu',
      password: await hashPassword('teacher123'),
      role: 'teacher',
      firstName: 'Mike',
      lastName: 'Brown',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser1Id,
      email: 'alice.wilson@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Alice',
      lastName: 'Wilson',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser2Id,
      email: 'bob.davis@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Bob',
      lastName: 'Davis',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser3Id,
      email: 'charlie.miller@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Charlie',
      lastName: 'Miller',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser4Id,
      email: 'diana.garcia@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Diana',
      lastName: 'Garcia',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser5Id,
      email: 'emma.martinez@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Emma',
      lastName: 'Martinez',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.studentUser6Id,
      email: 'frank.lopez@student.campcore.edu',
      password: await hashPassword('student123'),
      role: 'student',
      firstName: 'Frank',
      lastName: 'Lopez',
      createdAt: currentDate,
      updatedAt: currentDate,
    },
  ];

  // Teachers
  const teachers: Teacher[] = [
    {
      _id: ids.teacher1Id,
      userId: ids.teacherUser1Id,
      teacherId: 'TCH001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@campcore.edu',
      phone: '+1-555-0101',
      department: 'Mathematics',
      hireDate: new Date('2020-08-15'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.teacher2Id,
      userId: ids.teacherUser2Id,
      teacherId: 'TCH002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@campcore.edu',
      phone: '+1-555-0102',
      department: 'English',
      hireDate: new Date('2019-08-20'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.teacher3Id,
      userId: ids.teacherUser3Id,
      teacherId: 'TCH003',
      firstName: 'Mike',
      lastName: 'Brown',
      email: 'mike.brown@campcore.edu',
      phone: '+1-555-0103',
      department: 'Science',
      hireDate: new Date('2021-01-10'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
  ];

  // Students
  const students: Student[] = [
    {
      _id: ids.student1Id,
      userId: ids.studentUser1Id,
      studentId: 'STU001',
      firstName: 'Alice',
      lastName: 'Wilson',
      email: 'alice.wilson@student.campcore.edu',
      age: 16,
      gradeLevel: 10,
      phone: '+1-555-1001',
      address: '123 Oak Street, Springfield, IL 62701',
      enrollmentDate: new Date('2023-08-28'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.student2Id,
      userId: ids.studentUser2Id,
      studentId: 'STU002',
      firstName: 'Bob',
      lastName: 'Davis',
      email: 'bob.davis@student.campcore.edu',
      age: 17,
      gradeLevel: 11,
      phone: '+1-555-1002',
      address: '456 Pine Avenue, Springfield, IL 62702',
      enrollmentDate: new Date('2022-08-30'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.student3Id,
      userId: ids.studentUser3Id,
      studentId: 'STU003',
      firstName: 'Charlie',
      lastName: 'Miller',
      email: 'charlie.miller@student.campcore.edu',
      age: 18,
      gradeLevel: 12,
      phone: '+1-555-1003',
      address: '789 Maple Drive, Springfield, IL 62703',
      enrollmentDate: new Date('2021-09-01'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.student4Id,
      userId: ids.studentUser4Id,
      studentId: 'STU004',
      firstName: 'Diana',
      lastName: 'Garcia',
      email: 'diana.garcia@student.campcore.edu',
      age: 15,
      gradeLevel: 9,
      phone: '+1-555-1004',
      address: '321 Elm Street, Springfield, IL 62704',
      enrollmentDate: new Date('2024-08-26'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.student5Id,
      userId: ids.studentUser5Id,
      studentId: 'STU005',
      firstName: 'Emma',
      lastName: 'Martinez',
      email: 'emma.martinez@student.campcore.edu',
      age: 16,
      gradeLevel: 10,
      phone: '+1-555-1005',
      address: '654 Cedar Lane, Springfield, IL 62705',
      enrollmentDate: new Date('2023-08-28'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.student6Id,
      userId: ids.studentUser6Id,
      studentId: 'STU006',
      firstName: 'Frank',
      lastName: 'Lopez',
      email: 'frank.lopez@student.campcore.edu',
      age: 17,
      gradeLevel: 11,
      phone: '+1-555-1006',
      address: '987 Birch Road, Springfield, IL 62706',
      enrollmentDate: new Date('2022-08-30'),
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
  ];

  // Subjects
  const subjects: Subject[] = [
    {
      _id: ids.mathId,
      name: 'Algebra II',
      code: 'MATH201',
      description: 'Advanced algebra concepts including polynomials, rational functions, and logarithms',
      teacherId: ids.teacher1Id,
      gradeLevel: 10,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.englishId,
      name: 'English Literature',
      code: 'ENG301',
      description: 'Study of classic and contemporary literature with focus on critical analysis',
      teacherId: ids.teacher2Id,
      gradeLevel: 11,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.scienceId,
      name: 'General Science',
      code: 'SCI101',
      description: 'Introduction to scientific method and basic principles of physics, chemistry, and biology',
      teacherId: ids.teacher3Id,
      gradeLevel: 9,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.historyId,
      name: 'World History',
      code: 'HIST201',
      description: 'Survey of world civilizations from ancient times to the present',
      teacherId: ids.teacher2Id,
      gradeLevel: 10,
      credits: 3,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.artId,
      name: 'Visual Arts',
      code: 'ART101',
      description: 'Introduction to drawing, painting, and basic design principles',
      teacherId: ids.teacher1Id,
      gradeLevel: 9,
      credits: 2,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.physicsId,
      name: 'Physics',
      code: 'PHYS401',
      description: 'Study of mechanics, thermodynamics, and electromagnetic theory',
      teacherId: ids.teacher3Id,
      gradeLevel: 12,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.chemistryId,
      name: 'Chemistry',
      code: 'CHEM301',
      description: 'Introduction to atomic structure, chemical bonding, and reactions',
      teacherId: ids.teacher3Id,
      gradeLevel: 11,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: ids.biologyId,
      name: 'Biology',
      code: 'BIO201',
      description: 'Study of living organisms, cell structure, genetics, and ecology',
      teacherId: ids.teacher3Id,
      gradeLevel: 10,
      credits: 4,
      isActive: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    },
  ];

  // Grades
  const grades: Grade[] = [
    // Alice Wilson (Grade 10) - STU001
    {
      _id: new ObjectId(),
      studentId: ids.student1Id,
      subjectId: ids.mathId,
      grade: 87,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher1Id,
      gradedAt: new Date('2024-12-15'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student1Id,
      subjectId: ids.historyId,
      grade: 92,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher2Id,
      gradedAt: new Date('2024-12-14'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student1Id,
      subjectId: ids.biologyId,
      grade: 89,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-16'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    
    // Bob Davis (Grade 11) - STU002
    {
      _id: new ObjectId(),
      studentId: ids.student2Id,
      subjectId: ids.englishId,
      grade: 84,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher2Id,
      gradedAt: new Date('2024-12-13'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student2Id,
      subjectId: ids.chemistryId,
      grade: 91,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-15'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    
    // Charlie Miller (Grade 12) - STU003
    {
      _id: new ObjectId(),
      studentId: ids.student3Id,
      subjectId: ids.physicsId,
      grade: 95,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-17'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student3Id,
      subjectId: ids.englishId,
      grade: 88,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher2Id,
      gradedAt: new Date('2024-12-14'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    
    // Diana Garcia (Grade 9) - STU004
    {
      _id: new ObjectId(),
      studentId: ids.student4Id,
      subjectId: ids.scienceId,
      grade: 86,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-12'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student4Id,
      subjectId: ids.artId,
      grade: 94,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher1Id,
      gradedAt: new Date('2024-12-11'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    
    // Emma Martinez (Grade 10) - STU005
    {
      _id: new ObjectId(),
      studentId: ids.student5Id,
      subjectId: ids.mathId,
      grade: 90,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher1Id,
      gradedAt: new Date('2024-12-15'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student5Id,
      subjectId: ids.biologyId,
      grade: 93,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-16'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    
    // Frank Lopez (Grade 11) - STU006
    {
      _id: new ObjectId(),
      studentId: ids.student6Id,
      subjectId: ids.englishId,
      grade: 82,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher2Id,
      gradedAt: new Date('2024-12-13'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
    {
      _id: new ObjectId(),
      studentId: ids.student6Id,
      subjectId: ids.chemistryId,
      grade: 85,
      semester: 'Fall',
      academicYear: '2024-2025',
      gradedBy: ids.teacher3Id,
      gradedAt: new Date('2024-12-15'),
      createdAt: currentDate,
      updatedAt: currentDate,
    },
  ];

  return {
    users,
    teachers,
    students,
    subjects,
    grades,
  };
};

// Database seeding function
export const seedDatabase = async (db: any) => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('teachers').deleteMany({});
    await db.collection('students').deleteMany({});
    await db.collection('subjects').deleteMany({});
    await db.collection('grades').deleteMany({});
    
    console.log('🗑️  Cleared existing data');
    
    // Generate and insert seed data
    const seedData = await generateSeedData();
    
    // Insert data in the correct order (users first, then related entities)
    await db.collection('users').insertMany(seedData.users);
    console.log(' Inserted users');
    
    await db.collection('teachers').insertMany(seedData.teachers);
    console.log(' Inserted teachers');
    
    await db.collection('students').insertMany(seedData.students);
    console.log(' Inserted students');
    
    await db.collection('subjects').insertMany(seedData.subjects);
    console.log(' Inserted subjects');
    
    await db.collection('grades').insertMany(seedData.grades);
    console.log(' Inserted grades');
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Log summary
    console.log('\n Seed Data Summary:');
    console.log(`- Users: ${seedData.users.length}`);
    console.log(`- Teachers: ${seedData.teachers.length}`);
    console.log(`- Students: ${seedData.students.length}`);
    console.log(`- Subjects: ${seedData.subjects.length}`);
    console.log(`- Grades: ${seedData.grades.length}`);
    
    console.log('\n Login Credentials:');
    console.log('Admin: admin@campcore.edu / admin123');
    console.log('Teacher: john.smith@campcore.edu / teacher123');
    console.log('Student: alice.wilson@student.campcore.edu / student123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Usage example
/*
import { MongoClient } from 'mongodb';
import { seedDatabase } from './seedData';

async function runSeed() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('campcore');
  
  await seedDatabase(db);
  
  await client.close();
}

runSeed().catch(console.error);
*/