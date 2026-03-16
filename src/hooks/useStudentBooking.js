import { useState, useCallback } from 'react';
import { getTeacherSlotsByDateRange, bookAvailabilitySlot } from '../database/database';
import logger from '../utils/logger';

/**
 * Custom hook to manage booking flow and modal state
 * Encapsulates booking UI state and related operations
 */
export const useStudentBooking = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSubject, setBookingSubject] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Open booking modal for a teacher
  const openBookingModal = useCallback((teacher) => {
    setSelectedTeacher(teacher);
    setShowBookingModal(true);
  }, []);

  // Close booking modal
  const closeBookingModal = useCallback(() => {
    setShowBookingModal(false);
    setSelectedTeacher(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setBookingSubject('');
  }, []);

  // Fetch available slots for a teacher
  const fetchAvailableSlots = useCallback(async (teacherId, dateRange) => {
    try {
      setSlotsLoading(true);
      logger.info('Fetching available slots for teacher:', teacherId);

      // Destructure dateRange object to pass as separate parameters
      const { startDate, endDate } = dateRange || {};
      if (!startDate || !endDate) {
        throw new Error('Invalid date range provided');
      }

      const slots = await getTeacherSlotsByDateRange(teacherId, startDate, endDate);
      setAvailableSlots(slots || []);
      logger.success('Available slots loaded:', slots?.length || 0);
    } catch (error) {
      logger.error('Error fetching slots:', error);
      setAvailableSlots([]);
      throw error;
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Book a slot
  const bookSlot = useCallback(async (studentId, teacherId, slotId, subject) => {
    try {
      setBookingInProgress(true);
      logger.info('Booking slot:', slotId);

      const result = await bookAvailabilitySlot({
        student_id: studentId,
        teacher_id: teacherId,
        availability_slot_id: slotId,
        subject: subject || bookingSubject,
      });

      logger.success('Slot booked successfully');
      closeBookingModal();
      return result;
    } catch (error) {
      logger.error('Error booking slot:', error);
      throw error;
    } finally {
      setBookingInProgress(false);
    }
  }, [bookingSubject, closeBookingModal]);

  return {
    showBookingModal,
    selectedTeacher,
    availableSlots,
    slotsLoading,
    selectedSlot,
    bookingSubject,
    bookingInProgress,
    setSelectedSlot,
    setBookingSubject,
    openBookingModal,
    closeBookingModal,
    fetchAvailableSlots,
    bookSlot,
  };
};
