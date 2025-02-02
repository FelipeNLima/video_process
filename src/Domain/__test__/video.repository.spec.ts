import * as fs from 'fs';
import { VideoRepository } from '../Repositories/video.repository';

// Mock ffmpeg
jest.mock('fluent-ffmpeg', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'end') {
        callback();  // Simulate 'end' event immediately
      }
      if (event === 'error') {
        callback(new Error('FFmpeg error'));  // Simulate 'error' event if needed
      }
      return this;
    }),
    save: jest.fn(),
  }));
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false), // Assume outputDir does not exist
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, cb) => {
      if (event === 'close') cb();
    }),
  }),
}));

// Mock archiver
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    directory: jest.fn(),
    on: jest.fn(),
    finalize: jest.fn(),
  }));
});

describe('VideoRepository', () => {
  let repository: VideoRepository;

  beforeEach(() => {
    repository = new VideoRepository();
  });
 
  it('should process video and return zip path', async () => {
    const mockVideoPath = 'test/video.mp4'
    const mockOutputDir = 'test/frames'
    const mockZipPath = 'test/output.zip'

    const zipPath = await repository.processVideo(
      mockVideoPath,
      mockOutputDir,
      mockZipPath,
    );

    // Mock the constructor to return our mock object

    expect(zipPath).toEqual({"file": "test/output.zip", "fileContent": "mock file content"});
    expect(fs.existsSync).toHaveBeenCalledWith(mockOutputDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockOutputDir, {
      recursive: true,
    });
  });
});
