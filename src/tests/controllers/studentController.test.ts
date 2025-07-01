// src/tests/controllers/studentController.test.ts
import { addStudent } from '../../controllers/studentController';
import Student from '../../models/Student';
import { Request, Response } from 'express';

// This fixes both `new Student()` and `Student.findOne` mocking
jest.mock('../../models/Student', () => {
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      findOne: jest.fn(),
    }),
  };
});

describe('addStudent controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock, json: jsonMock };

    jest.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    req.body = { name: 'John' }; // missing required fields

    await addStudent(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Missing required fields'
    }));
  });

  it('should return 409 if email already exists', async () => {
    req.body = {
      studentId: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 16,
      gradeLevel: '10'
    };

    (Student.findOne as jest.Mock).mockResolvedValueOnce(true); // email exists

    await addStudent(req as Request, res as Response);

    expect(Student.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Email already exists' });
  });

  it('should return 409 if student ID already exists', async () => {
    req.body = {
      studentId: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 16,
      gradeLevel: '10'
    };

    (Student.findOne as jest.Mock)
      .mockResolvedValueOnce(null)  // email does not exist
      .mockResolvedValueOnce(true); // student ID exists

    await addStudent(req as Request, res as Response);

    expect(Student.findOne).toHaveBeenNthCalledWith(1, { email: 'john@example.com' });
    expect(Student.findOne).toHaveBeenNthCalledWith(2, { studentId: 'S001' });
    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Student ID already exists' });
  });

  it('should save and return 201 on success', async () => {
    req.body = {
      studentId: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 16,
      gradeLevel: '10'
    };

    (Student.findOne as jest.Mock)
      .mockResolvedValueOnce(null)  // email does not exist
      .mockResolvedValueOnce(null); // student ID does not exist

    const saveMock = jest.fn().mockResolvedValue({});
    (Student as unknown as jest.Mock).mockImplementation(() => ({ save: saveMock }));

    await addStudent(req as Request, res as Response);

    expect(Student).toHaveBeenCalledWith({
      studentId: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 16,
      gradeLevel: '10'
    });
    expect(saveMock).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Student added successfully'
    }));
  });

  it('should return 500 on exception', async () => {
    req.body = {
      studentId: 'S001',
      name: 'John Doe',
      email: 'john@example.com',
      age: 16,
      gradeLevel: '10'
    };

    (Student.findOne as jest.Mock).mockRejectedValue(new Error('DB failure'));

    await addStudent(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to add student' });
  });
})