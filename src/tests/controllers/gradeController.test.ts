import { addOrUpdateGrade } from '../../controllers/gradeController';
import Student from '../../models/Student';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

jest.mock('../../models/Student');
const mockedStudentModel = Student as jest.Mocked<typeof Student>;

describe('addOrUpdateGrade controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      params: { studentId: new mongoose.Types.ObjectId().toString() },
      body: { subject: 'Math', score: 85 }
    };
    res = {
      status: statusMock,
      json: jsonMock
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    req.body = {};
    await addOrUpdateGrade(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Missing required fields'
    }));
  });

  it('should return 400 if score is invalid', async () => {
    req.body = { subject: 'Math', score: 150 };
    await addOrUpdateGrade(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Score must be a number between 0 and 100'
    }));
  });

  it('should return 400 if subject is invalid', async () => {
    req.body = { subject: '', score: 90 };
    await addOrUpdateGrade(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
  error: 'Missing required fields',
  received: { score: true, subject: false },
  required: ['subject', 'score']
}));
  });

  it('should return 400 if student ID is invalid', async () => {
    req.params = { studentId: 'invalidId' };
    await addOrUpdateGrade(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid student ID format'
    }));
  });

  it('should return 404 if student not found', async () => {
    mockedStudentModel.findById.mockResolvedValue(null as any);

    await addOrUpdateGrade(req as any, res as any);

    expect(mockedStudentModel.findById).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Student not found'
    }));
  });

  it('should update existing grade if subject already exists', async () => {
    const student = {
      _id: req.params!.studentId,
      name: 'Alice',
      studentId: 'S123',
      grades: [{ subject: 'Math', score: 70 }],
      save: jest.fn()
    };

    mockedStudentModel.findById.mockResolvedValue(student as any);

    await addOrUpdateGrade(req as any, res as any);

    expect(student.save).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      grade: expect.objectContaining({
        subject: 'Math',
        score: 85,
        action: 'updated'
      })
    }));
  });

  it('should add new grade if subject does not exist', async () => {
    const student = {
      _id: req.params!.studentId,
      name: 'Alice',
      studentId: 'S123',
      grades: [],
      save: jest.fn()
    };

    mockedStudentModel.findById.mockResolvedValue(student as any);

    await addOrUpdateGrade(req as any, res as any);

    expect(student.save).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      grade: expect.objectContaining({
        subject: 'Math',
        score: 85,
        action: 'added'
      })
    }));
  });

  it('should handle internal server error', async () => {
    mockedStudentModel.findById.mockRejectedValue(new Error('DB failure'));

    await addOrUpdateGrade(req as any, res as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Failed to add/update grade'
    }));
  });
})