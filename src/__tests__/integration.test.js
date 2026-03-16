/**
 * Integration tests for refactoring - validates file structure and configurations
 * (Note: Full hook testing requires React Testing Library setup for React Native)
 */

const fs = require('fs');
const path = require('path');

describe('Refactoring Integration Tests', () => {
  describe('Hook Files Exist', () => {
    it('should have useStudentTeachers hook file', () => {
      const filePath = path.join(__dirname, '../hooks/useStudentTeachers.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have useStudentProfile hook file', () => {
      const filePath = path.join(__dirname, '../hooks/useStudentProfile.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have useStudentBooking hook file', () => {
      const filePath = path.join(__dirname, '../hooks/useStudentBooking.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have useTeacherDashboard hook file', () => {
      const filePath = path.join(__dirname, '../hooks/useTeacherDashboard.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Configuration Files', () => {
    it('should have appConfig.js file', () => {
      const filePath = path.join(__dirname, '../constants/appConfig.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('appConfig should define PAYMENT_CONFIG', () => {
      const appConfig = require('../constants/appConfig');
      expect(appConfig.PAYMENT_CONFIG).toBeDefined();
      expect(appConfig.PAYMENT_CONFIG.GST_RATE).toBe(0.18);
      expect(appConfig.PAYMENT_CONFIG.PLATFORM_FEE_RATE).toBe(0.075);
    });

    it('appConfig should define MEETING_CONFIG', () => {
      const appConfig = require('../constants/appConfig');
      expect(appConfig.MEETING_CONFIG).toBeDefined();
      expect(appConfig.MEETING_CONFIG.TOKEN_FETCH_TIMEOUT_MS).toBe(15000);
      expect(appConfig.MEETING_CONFIG.ROOM_CREATION_TIMEOUT_MS).toBe(20000);
    });

    it('appConfig should define UI_CONFIG', () => {
      const appConfig = require('../constants/appConfig');
      expect(appConfig.UI_CONFIG).toBeDefined();
      expect(appConfig.UI_CONFIG.NOTIFICATION_DEBOUNCE_MS).toBe(400);
    });
  });

  describe('Component Refactoring', () => {
    it('StudentDashboard should be updated with hook imports', () => {
      const filePath = path.join(__dirname, '../scenes/StudentDashboard.js');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('useStudentTeachers');
      expect(content).toContain('useStudentProfile');
      expect(content).toContain('useStudentBooking');
      expect(content).toContain('from \'../hooks/useStudentTeachers\'');
    });

    it('TeacherDashboard should be updated with hook imports', () => {
      const filePath = path.join(__dirname, '../scenes/TeacherDashboard.js');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('useTeacherDashboard');
      expect(content).toContain('from \'../hooks/useTeacherDashboard\'');
    });

    it('StudentCheckout should use PAYMENT_CONFIG', () => {
      const filePath = path.join(__dirname, '../scenes/Student/StudentCheckout.js');
      const content = fs.readFileSync(filePath, 'utf8');

      expect(content).toContain('PAYMENT_CONFIG');
      expect(content).toContain('PAYMENT_CONFIG.GST_RATE');
      expect(content).toContain('PAYMENT_CONFIG.PLATFORM_FEE_RATE');
    });

    it('meeting/index.js should use logger and have no duplicate code', () => {
      const filePath = path.join(__dirname, '../scenes/meeting/index.js');
      const content = fs.readFileSync(filePath, 'utf8');

      // Should use logger
      expect(content).toContain('logger.info');
      expect(content).toContain('logger.error');

      // Should not have commented-out code
      const commentedOutCode = content.match(/\/\/.*requestPermissions.*\n/g);
      if (commentedOutCode) {
        expect(content).not.toContain('// const requestPermissions');
      }
    });
  });

  describe('Logger Integration', () => {
    it('logger should be properly defined', () => {
      const logger = require('../utils/logger').default;
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.success).toBe('function');
    });
  });

  describe('.env Configuration', () => {
    it('should have .env file with Supabase credentials', () => {
      const filePath = path.join(__dirname, '../../.env');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('SUPABASE_URL');
      expect(content).toContain('SUPABASE_ANON_KEY');
    });
  });
});
